import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Subscribe: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Veuillez vous connecter pour vous abonner');
        navigate('/login');
        return;
      }

      // Rediriger vers la page de paiement Stripe avec l'ID de l'utilisateur
      window.location.href = `https://buy.stripe.com/5kA3fl5SAeEA5J6bII?client_reference_id=${session.user.id}`;
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-3xl font-bold mb-4">Abonnement Premium</h1>
          <p className="text-gray-300 mb-6">
            Accédez à toutes les fonctionnalités du chat GPT pour seulement 10$ par mois
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <span>Accès illimité au chat GPT</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <span>Support prioritaire</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <span>Nouvelles fonctionnalités en avant-première</span>
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Redirection...' : 'S\'abonner maintenant'}
        </button>
      </div>
    </div>
  );
};

export default Subscribe; 