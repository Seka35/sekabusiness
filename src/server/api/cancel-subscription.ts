import express from 'express';
import { getStripeInstance } from '../../lib/stripe';

const router = express.Router();

router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Subscription ID is required' });
    }

    const stripe = await getStripeInstance();
    await stripe.subscriptions.cancel(subscriptionId);

    return res.status(200).json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ message: 'Error cancelling subscription' });
  }
});

export default router; 