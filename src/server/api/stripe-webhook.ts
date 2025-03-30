import express from 'express';
import { getStripeInstance } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';

const router = express.Router();

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = await getStripeInstance();
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret as string
    );

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Mettre à jour l'abonnement dans Supabase
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: session.client_reference_id,
            subscription_id: session.subscription,
            status: 'active',
            current_period_end: new Date(session.subscription_end * 1000).toISOString()
          });
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        
        await supabase
          .from('subscriptions')
          .upsert({
            subscription_id: subscription.id,
            status: subscription.status === 'active' ? 'active' : 'inactive',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          });
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('subscription_id', canceledSubscription.id);
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router; 