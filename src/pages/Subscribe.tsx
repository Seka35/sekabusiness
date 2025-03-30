import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Zap, Shield, Clock, Check, Star, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Subscribe: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Please login to subscribe');
        navigate('/login');
        return;
      }

      window.location.href = `https://buy.stripe.com/5kA3fl5SAeEA5J6bII?client_reference_id=${session.user.id}`;
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Unlock the Power of AI
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Transform your workflow with our advanced AI chat system. Get instant answers, creative solutions, and expert assistance 24/7.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            {isLoading ? 'Processing...' : 'Start Now - Only $10/month'}
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <Zap className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-bold mb-3">Lightning Fast Responses</h3>
          <p className="text-gray-300">Get instant, accurate answers to your questions with our optimized AI system.</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <Shield className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
          <p className="text-gray-300">Your conversations are encrypted and never shared with third parties.</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <Clock className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-bold mb-3">24/7 Availability</h3>
          <p className="text-gray-300">Access our AI assistant whenever you need it, day or night.</p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Our AI Assistant?</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Star className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Premium AI Model</h3>
              <p className="text-gray-300">Access to the latest AI technology for superior understanding and responses.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Versatile Assistant</h3>
              <p className="text-gray-300">From coding to creative writing, our AI can help with any task.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Check className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No Limits</h3>
              <p className="text-gray-300">Unlimited conversations and responses with our AI assistant.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-lg mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-1">
        <div className="bg-gray-900 rounded-xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">Premium Plan</h3>
            <div className="text-4xl font-bold mb-2">$10<span className="text-xl text-gray-400">/month</span></div>
            <p className="text-gray-300">Everything you need for AI-powered productivity</p>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <span>Unlimited AI conversations</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <span>Early access to new features</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <span>No usage limits</span>
            </div>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all"
          >
            {isLoading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscribe; 