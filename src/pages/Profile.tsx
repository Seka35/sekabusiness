import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserIcon, CreditCard, XCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiryDate: Date | null;
  subscriptionId: string | null;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    expiryDate: null,
    subscriptionId: null,
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Check subscription status
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
        } else if (subscriptionData && subscriptionData.status === 'active') {
          setSubscriptionStatus({
            isSubscribed: true,
            expiryDate: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null,
            subscriptionId: subscriptionData.subscription_id,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Call API to cancel Stripe subscription
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

      // Update status in Supabase
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

      toast.success('Your subscription has been successfully cancelled');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('An error occurred while canceling your subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
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
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-300 mb-6">
            Please log in to access your profile.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-6">
            <div className="flex items-center">
              <UserIcon className="w-10 h-10 text-blue-500 mr-4" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-500/10 p-3 rounded-lg mr-4">
                  <CreditCard className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Subscription Status</h2>
                  <p className="text-gray-300">
                    {subscriptionStatus.isSubscribed ? (
                      <>
                        <span className="text-green-500">●</span>{' '}
                        Active subscription until{' '}
                        <span className="font-medium">
                          {subscriptionStatus.expiryDate?.toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-500">●</span>{' '}
                        No active subscription
                      </>
                    )}
                  </p>
                </div>
              </div>
              {subscriptionStatus.isSubscribed ? (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <XCircle className="w-5 h-5 mr-2" />
                  )}
                  Cancel Subscription
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = 'https://buy.stripe.com/5kA3fl5SAeEA5J6bII'}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscribe Now
                </button>
              )}
            </div>
          </div>

          {/* Password Change Form */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-500/10 p-3 rounded-lg mr-4">
                <Lock className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold">Change Password</h2>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 