import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CreditCard } from 'lucide-react';
import { sendMessage, Message } from '../lib/chat';
import { supabase } from '../lib/supabase';

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiryDate: Date | null;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    expiryDate: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
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
          });
          setIsLoading(false);
          return;
        }

        if (!subscriptionData || subscriptionData.status !== 'active') {
          console.log('No active subscription found');
          setSubscriptionStatus({
            isSubscribed: false,
            expiryDate: null,
          });
        } else {
          console.log('Active subscription found:', subscriptionData);
          setSubscriptionStatus({
            isSubscribed: true,
            expiryDate: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null,
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus({
          isSubscribed: false,
          expiryDate: null,
        });
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [navigate]);

  const handleSendMessage = async () => {
    if (!input.trim() || !subscriptionStatus.isSubscribed) return;

    const newMessage: Message = {
      content: input,
      role: 'user',
    };

    try {
      setMessages(prev => [...prev, newMessage]);
      setInput('');

      const response = await sendMessage([...messages, newMessage]);
      if (response) {
        const assistantMessage: Message = {
          content: response,
          role: 'assistant',
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        content: "Désolé, une erreur est survenue. Veuillez réessayer.",
        role: 'assistant',
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!subscriptionStatus.isSubscribed) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-2xl mx-auto text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-3xl font-bold mb-4">Accédez au Chat GPT</h1>
          <p className="text-gray-400 mb-8">
            Abonnez-vous pour seulement 10$ par mois et profitez d'un accès illimité au chat GPT.
          </p>
          <button
            onClick={() => window.location.href = 'https://buy.stripe.com/5kA3fl5SAeEA5J6bII'}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            S'abonner maintenant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Chat GPT</h1>
        <div className="bg-gray-800 rounded-lg p-4 mb-4 h-[60vh] overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 