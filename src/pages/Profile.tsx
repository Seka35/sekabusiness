import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { CreditCard, User as UserIcon, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subscription {
  status: 'active' | 'inactive';
  current_period_end: string;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiryDate: Date | null;
  subscriptionId: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    expiryDate: null,
    subscriptionId: null,
  });
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscriptionStatus({
          isSubscribed: false,
          expiryDate: null,
          subscriptionId: null,
        });
        setIsLoading(false);
        return;
      }

      if (!subscriptionData || subscriptionData.status !== 'active') {
        setSubscriptionStatus({
          isSubscribed: false,
          expiryDate: null,
          subscriptionId: null,
        });
      } else {
        setSubscriptionStatus({
          isSubscribed: true,
          expiryDate: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null,
          subscriptionId: subscriptionData.subscription_id,
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus({
        isSubscribed: false,
        expiryDate: null,
        subscriptionId: null,
      });
      setIsLoading(false);
    }
  };

  const handleSubscribe = () => {
    window.location.href = 'https://buy.stripe.com/5kA3fl5SAeEA5J6bII';
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Appeler l'API pour annuler l'abonnement Stripe
      const response = await fetch('http://localhost:3001/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionStatus.subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Mettre à jour le statut dans Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('user_id', session.user.id);
      }

      setSubscriptionStatus({
        isSubscribed: false,
        expiryDate: null,
        subscriptionId: null,
      });

      toast.success('Votre abonnement a été annulé avec succès');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Une erreur est survenue lors de l\'annulation de l\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connexion requise</h2>
          <p className="text-gray-300 mb-6">
            Veuillez vous connecter pour accéder à votre profil.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <UserIcon className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
          </div>

          {/* Subscription Status */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold">Statut de l'abonnement</h2>
                  <p className="text-gray-300">
                    {subscriptionStatus.isSubscribed ? (
                      <>
                        Abonnement actif jusqu'au{' '}
                        {subscriptionStatus.expiryDate?.toLocaleDateString()}
                      </>
                    ) : (
                      'Aucun abonnement actif'
                    )}
                  </p>
                </div>
              </div>
              {subscriptionStatus.isSubscribed ? (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Annuler l'abonnement
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = 'https://buy.stripe.com/5kA3fl5SAeEA5J6bII'}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  S'abonner maintenant
                </button>
              )}
            </div>
          </div>

          {/* Add more dashboard content here */}
        </div>
      </div>
    </div>
  );
};

export default Profile; 