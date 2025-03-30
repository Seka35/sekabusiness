import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Créer le client Supabase avec les variables d'environnement minimales
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fonction pour récupérer les clés API depuis Supabase
async function getApiKey(keyName: string): Promise<string> {
  const { data, error } = await supabase
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

// Fonction pour initialiser Stripe avec la clé depuis Supabase
async function initStripe(): Promise<Stripe> {
  const stripeSecretKey = await getApiKey('stripe_secret_key');
  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia'
  });
}

async function updateSubscriptionStatus(stripe: Stripe, customerId: string, status: 'active' | 'inactive') {
  try {
    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = (customer as Stripe.Customer).email;

    if (!customerEmail) {
      console.error('No email found for customer:', customerId);
      return;
    }

    // Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error getting users:', userError);
      return;
    }

    const user = users.find(u => u.email === customerEmail);
    if (!user) {
      console.error('No user found with email:', customerEmail);
      return;
    }

    // Check if subscription exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking subscription:', checkError);
      return;
    }

    if (!existingSubscription) {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            status: status,
            current_period_end: new Date().toISOString(),
            email: customerEmail
          }
        ]);

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return;
      }
      console.log('Created new subscription for user:', user.id);
      return;
    }

    // Update existing subscription
    const { error: updateError } = await supabase
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

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const sig = event.headers['stripe-signature'];
    
    if (!sig) {
      return { statusCode: 400, body: 'Missing signature' };
    }

    // Initialiser Stripe et récupérer le webhook secret
    const [stripe, webhookSecret] = await Promise.all([
      initStripe(),
      getApiKey('stripe_webhook_secret')
    ]);

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      sig,
      webhookSecret
    );

    // Handle the event
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await updateSubscriptionStatus(stripe, subscription.customer as string, 'active');
        } else {
          await updateSubscriptionStatus(stripe, subscription.customer as string, 'inactive');
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await updateSubscriptionStatus(stripe, subscription.customer as string, 'active');
          } else {
            await updateSubscriptionStatus(stripe, subscription.customer as string, 'inactive');
          }
        }
        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`
    };
  }
}; 