import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserIcon, CreditCard, XCircle, Lock, MessageSquare, Star, History, BarChart2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiryDate: Date | null;
  subscriptionId: string | null;
}

interface UserStats {
  total_conversations: number;
  total_messages_sent: number;
  total_messages_received: number;
  models_used: Record<string, number>;
  last_activity: string;
}

interface RecentChat {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
}

interface FavoritePrompt {
  id: string;
  title: string;
  description: string;
  prompt_text: string;
}

interface PromptData {
  id: string;
  prompts: {
    id: string;
    title: string;
    description: string;
    prompt_text: string;
  };
}

// Corriger l'URL de l'avatar par défaut
const DEFAULT_AVATAR_URL = 'https://zhsflgbiitabtnbktxte.supabase.co/storage/v1/object/public/images/1a649947-e379-449b-82ec-bd05c9865bc8/avatar.jpeg';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [favoritePrompts, setFavoritePrompts] = useState<FavoritePrompt[]>([]);
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

        // Vérifier d'abord si l'utilisateur a un avatar personnalisé
        const { data: userAvatarData, error: userAvatarError } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('user_id', session.user.id)
          .single();

        if (userAvatarData?.avatar_url) {
          setAvatarUrl(userAvatarData.avatar_url);
        } else {
          setAvatarUrl(DEFAULT_AVATAR_URL);
        }

        // Fetch user stats
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (statsData) {
          setUserStats(statsData);
        }

        // Fetch recent chats
        const { data: chatsData } = await supabase
          .from('chat_history')
          .select('id, messages, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (chatsData) {
          const formattedChats = chatsData.map(chat => ({
            id: chat.id,
            title: getFirstMessage(chat.messages),
            last_message: getLastMessage(chat.messages),
            created_at: chat.created_at
          }));
          setRecentChats(formattedChats);
        }

        // Fetch favorite prompts
        const { data: promptsData } = await supabase
          .from('favorite_prompts')
          .select(`
            id,
            prompts (
              id,
              title,
              description,
              prompt_text
            )
          `)
          .eq('user_id', session.user.id);

        if (promptsData) {
          const formattedPrompts = (promptsData as unknown as PromptData[]).map(fp => ({
            id: fp.prompts.id,
            title: fp.prompts.title,
            description: fp.prompts.description,
            prompt_text: fp.prompts.prompt_text
          }));
          setFavoritePrompts(formattedPrompts);
        }

        // Check subscription status
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (subscriptionData && subscriptionData.status === 'active') {
          setSubscriptionStatus({
            isSubscribed: true,
            expiryDate: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null,
            subscriptionId: subscriptionData.subscription_id,
          });
        }
      } catch (error) {
        console.error('Error:', error);
        setAvatarUrl(DEFAULT_AVATAR_URL);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const getFirstMessage = (messages: string): string => {
    try {
      const parsedMessages = JSON.parse(messages);
      if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
        const firstUserMessage = parsedMessages.find(m => m.role === 'user');
        if (firstUserMessage) {
          const content = firstUserMessage.content.slice(0, 30);
          return content + (content.length > 30 ? '...' : '');
        }
      }
    } catch (e) {}
    return 'New Chat';
  };

  const getLastMessage = (messages: string): string => {
    try {
      const parsedMessages = JSON.parse(messages);
      if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
        const lastMessage = parsedMessages[parsedMessages.length - 1];
        const content = lastMessage.content.slice(0, 50);
        return content + (content.length > 50 ? '...' : '');
      }
    } catch (e) {}
    return 'No messages yet';
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      
      if (!event.target.files || !event.target.files[0]) {
        toast.error('Please select a file');
        return;
      }

      const file = event.target.files[0];
      
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = await supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Sauvegarder l'URL de l'avatar dans la table user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user?.id,
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(urlData.publicUrl);
      toast.success('Photo de profil mise à jour avec succès');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={avatarUrl || DEFAULT_AVATAR_URL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-700/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Total Conversations</h3>
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-400">{userStats.total_conversations}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Messages Sent</h3>
                  <BarChart2 className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">{userStats.total_messages_sent}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Messages Received</h3>
                  <BarChart2 className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-purple-400">{userStats.total_messages_received}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Last Activity</h3>
                  <History className="w-6 h-6 text-yellow-400" />
                </div>
                <p className="text-lg text-yellow-400">
                  {new Date(userStats.last_activity).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Recent Chats */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Conversations</h2>
            <div className="grid gap-4">
              {recentChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="bg-gray-700/30 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-blue-400 mb-1">{chat.title}</h3>
                      <p className="text-sm text-gray-400">{chat.last_message}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(chat.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Prompts */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Favorite Prompts</h2>
            <div className="grid gap-4">
              {favoritePrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className="bg-gray-700/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-blue-400 mb-1">{prompt.title}</h3>
                      <p className="text-sm text-gray-400">{prompt.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/chat');
                        // Add logic to pre-fill chat with this prompt
                      }}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      Use Prompt
                    </button>
                  </div>
                </div>
              ))}
              {favoritePrompts.length === 0 && (
                <p className="text-gray-400 text-center py-4">No favorite prompts yet</p>
              )}
            </div>
          </div>

          {/* Subscription Status */}
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
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
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
  );
};

export default Profile; 