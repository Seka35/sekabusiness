import Stripe from 'stripe';
import { supabase } from './supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

export async function getStripeInstance(): Promise<Stripe> {
  return stripe;
}

export async function createCheckoutSession(userId: string, priceId: string) {
  try {
    // Get user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user || !user.email) throw new Error('User not found or no email');

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/cancel`,
      metadata: {
        userId: userId
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createPortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.VITE_APP_URL}/profile`,
    });

    return session;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

export { stripe }; 