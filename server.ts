import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
dotenv.config();

// Vérifier les variables d'environnement requises
const requiredEnvVars = {
  'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
};

for (const [name, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise`);
  }
}

// Configuration de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  console.log('Application en mode PRODUCTION');
  // Désactiver les logs détaillés en production
  console.log = () => {};
  console.debug = () => {};
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware de sécurité pour la production
if (isProduction) {
  app.use((req, res, next) => {
    // Vérifier l'origine des requêtes
    const allowedOrigins = [process.env.ALLOWED_ORIGIN];
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // Headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
} else {
  app.use(cors());
}

// Créer un client Supabase avec le service role
const serviceRoleClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Fonction pour récupérer les clés API depuis Supabase
async function getApiKey(keyName: string): Promise<string> {
  const { data, error } = await serviceRoleClient
    .from('api_keys')
    .select('key_value')
    .eq('key_name', keyName)
    .single();

  if (error) {
    throw new Error(`Erreur lors de la récupération de la clé ${keyName}: ${error.message}`);
  }

  if (!data?.key_value) {
    throw new Error(`Clé ${keyName} non trouvée dans la base de données`);
  }

  return data.key_value;
}

// Fonction pour mettre à jour le statut d'abonnement
async function updateSubscriptionStatus(customerId: string, status: 'active' | 'inactive') {
  try {
    console.log('Updating subscription status for customer:', customerId);
    
    // Get customer details from Stripe
    const stripeSecretKey = await getApiKey('stripe_secret_key');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia'
    });
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = (customer as Stripe.Customer).email;
    
    console.log('Stripe customer details:', {
      id: customer.id,
      email: customerEmail,
      status: status
    });

    if (!customerEmail) {
      console.error('No email found for customer:', customerId);
      return;
    }

    // Get user by email using admin auth API
    const { data: { users }, error: userError } = await serviceRoleClient.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error getting users:', userError);
      return;
    }

    const user = users.find(u => u.email === customerEmail);
    if (!user) {
      console.error('No user found with email:', customerEmail);
      return;
    }

    // First, check if subscription exists
    const { data: existingSubscription, error: checkError } = await serviceRoleClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking subscription:', checkError);
      return;
    }

    if (!existingSubscription) {
      console.log('No existing subscription found, creating new one');
      // Create new subscription
      const { error: insertError } = await serviceRoleClient
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            status: status,
            current_period_end: new Date().toISOString(),
            email: customerEmail // Add email for reference
          }
        ]);

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return;
      }
      console.log('Created new subscription for user:', user.id);
      return;
    }

    console.log('Existing subscription found:', existingSubscription);

    // Update existing subscription
    const { error: updateError } = await serviceRoleClient
      .from('subscriptions')
      .update({ 
        status: status,
        current_period_end: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return;
    }

    console.log('Subscription updated successfully for user:', user.id);
  } catch (error) {
    console.error('Error in updateSubscriptionStatus:', error);
  }
}

// Middleware spécial pour les webhooks Stripe
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      throw new Error('Signature manquante');
    }

    const [stripeSecretKey, webhookSecret] = await Promise.all([
      getApiKey('stripe_secret_key'),
      getApiKey('stripe_webhook_secret')
    ]);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true
    });

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    if (isProduction) {
      console.log(`Stripe event: ${event.type}`);
    } else {
      console.log('Événement Stripe reçu:', event.type);
      console.log('Données:', JSON.stringify(event.data.object, null, 2));
    }

    // Gérer l'événement
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription status:', subscription.status);
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await updateSubscriptionStatus(subscription.customer as string, 'active');
        } else {
          await updateSubscriptionStatus(subscription.customer as string, 'inactive');
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          console.log('Invoice subscription status:', subscription.status);
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await updateSubscriptionStatus(subscription.customer as string, 'active');
          } else {
            await updateSubscriptionStatus(subscription.customer as string, 'inactive');
          }
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`La période d'essai se termine bientôt pour ${subscription.customer}`);
        break;
      }

      default:
        console.log(`Type d'événement non géré: ${event.type}`);
    }

    res.json({received: true});
  } catch (error: any) {
    console.error('Erreur webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Middleware général pour les autres routes
app.use(express.json());

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
    console.log('Variables d\'environnement chargées:');
    console.log('- PORT:', process.env.PORT);
    console.log('- STRIPE_WEBHOOK_SECRET présent:', !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log('- STRIPE_SECRET_KEY présent:', !!process.env.STRIPE_SECRET_KEY);
    console.log('- SUPABASE_URL présent:', !!process.env.VITE_SUPABASE_URL);
});