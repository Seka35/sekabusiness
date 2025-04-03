import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Zap, Shield, Clock, Check, Star, Users, MessageSquare, Sparkles, Brain, DollarSign, Infinity } from 'lucide-react';
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

  const aiModels = [
    { name: 'GPT-4', price: 20, icon: Brain },
    { name: 'Claude 3', price: 20, icon: Star },
    { name: 'Gemini Pro', price: 10, icon: Sparkles },
    { name: 'Mistral', price: 10, icon: Zap },
    { name: 'Llama 3', price: 15, icon: Brain },
    { name: 'DeepSeek', price: 10, icon: Star },
  ];

  const totalValue = aiModels.reduce((acc, model) => acc + model.price, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-6 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 backdrop-blur-sm">
            <span className="text-blue-400 font-semibold tracking-wide">PREMIUM AI ACCESS</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent leading-tight">
            All Premium AI Models<br />One Simple Price
          </h1>
          <p className="text-xl md:text-2xl text-gray-300/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Why pay for multiple subscriptions? Get access to all the latest AI models
            for one fixed price. Save over ${totalValue} monthly!
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="group relative inline-flex items-center justify-center px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full text-lg md:text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_50px_rgba(66,153,225,0.5)] overflow-hidden"
          >
            <span className="relative z-10 bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
              {isLoading ? 'Processing...' : 'Start Now - Only $10/month'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
          </button>
          <p className="mt-4 text-gray-400 tracking-wide">No commitment - Cancel anytime</p>
        </div>

        {/* Value Proposition */}
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-gray-700/50 shadow-[0_0_50px_rgba(0,0,0,0.3)] mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Save Over ${totalValue} Monthly</h2>
            <p className="text-gray-300 text-lg">Compare with individual subscriptions:</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {aiModels.map((model, index) => {
              const Icon = model.icon;
              return (
                <div key={index} className="group bg-gray-800/30 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(66,153,225,0.2)] border border-gray-700/50">
                  <div className="mb-4">
                    <Icon className="w-8 h-8 mx-auto text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                  </div>
                  <h3 className="text-white font-bold mb-2 text-lg">{model.name}</h3>
                  <p className="text-gray-400 line-through mb-1">${model.price}/month</p>
                  <p className="text-green-400 font-bold">Included</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          <div className="group bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-gray-700/50 transform hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(66,153,225,0.2)]">
            <div className="h-16 w-16 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors duration-300">
              <Brain className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Premium AI Models</h3>
            <p className="text-gray-300 leading-relaxed">
              Access the most advanced AI models: GPT-4, Claude 3, Gemini, and many more.
              All included in your subscription.
            </p>
          </div>

          <div className="group bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-gray-700/50 transform hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(66,153,225,0.2)]">
            <div className="h-16 w-16 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors duration-300">
              <DollarSign className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Unbeatable Value</h3>
            <p className="text-gray-300 leading-relaxed">
              Save hundreds of dollars monthly by avoiding multiple subscriptions.
              One simple price for all premium features.
            </p>
          </div>

          <div className="group bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-gray-700/50 transform hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(66,153,225,0.2)]">
            <div className="h-16 w-16 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors duration-300">
              <Infinity className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Future-Proof Access</h3>
            <p className="text-gray-300 leading-relaxed">
              Get instant access to new AI models as they launch.
              Stay ahead with continuous updates at no extra cost.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[
              "Access to all premium AI models",
              "Unlimited conversations",
              "24/7 priority support",
              "Early access to new features",
              "No usage limits",
              "Regular model updates"
            ].map((benefit, index) => (
              <div key={index} className="group flex items-center space-x-4 bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-gray-700/50 hover:border-blue-500/50 transition-colors duration-300">
                <div className="text-green-400 group-hover:text-green-300 transition-colors duration-300">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors duration-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80 rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto backdrop-blur-xl border border-gray-700/50 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="inline-block mb-6 px-6 py-2 bg-green-500/10 rounded-full border border-green-500/20">
            <span className="text-green-400 font-semibold tracking-wide">SPECIAL LAUNCH OFFER</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Start Today</h2>
          <div className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">$10</span>
            <span className="text-gray-400 text-xl md:text-2xl">/month</span>
          </div>
          <p className="text-gray-300 mb-8 text-lg md:text-xl leading-relaxed">
            Access all premium AI models for less than the price of a single subscription
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="group relative inline-flex items-center justify-center px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full text-lg md:text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_50px_rgba(66,153,225,0.5)] mb-6 overflow-hidden w-full md:w-auto"
          >
            <span className="relative z-10 bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
              {isLoading ? 'Processing...' : 'Get Started Now'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
          </button>
          <p className="text-sm text-gray-400">
            No long-term contract - Cancel anytime - Money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscribe; 