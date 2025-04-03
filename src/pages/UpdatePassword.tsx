import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const UpdatePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Mot de passe mis à jour avec succès');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">Nouveau mot de passe</h2>
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700/50 rounded-lg px-4 py-2 pl-10"
              placeholder="••••••••"
              minLength={6}
              required
            />
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-700/50 rounded-lg px-4 py-2 pl-10"
              placeholder="••••••••"
              minLength={6}
              required
            />
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default UpdatePassword; 