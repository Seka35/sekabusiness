import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateTitle } from '../lib/api';
import { Message } from '../types';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface UpdateTitlesProps {
  onUpdate?: () => void;
}

const UpdateTitles: React.FC<UpdateTitlesProps> = ({ onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateAllTitles = async () => {
    try {
      setIsUpdating(true);
      
      // Récupérer toutes les conversations sans titre
      const { data: chats, error } = await supabase
        .from('chat_history')
        .select('*')
        .is('title', null);

      if (error) throw error;

      if (!chats || chats.length === 0) {
        toast.success('Aucune conversation à mettre à jour');
        return;
      }

      // Mettre à jour chaque conversation
      let updated = 0;
      for (const chat of chats) {
        try {
          const messages = JSON.parse(chat.messages);
          const title = await generateTitle(messages);
          
          const { error: updateError } = await supabase
            .from('chat_history')
            .update({ title })
            .eq('id', chat.id);

          if (!updateError) updated++;
        } catch (e) {
          console.error('Error updating chat:', chat.id, e);
        }
      }

      toast.success(`${updated} conversation(s) mise(s) à jour`);
      // Appeler la fonction de rafraîchissement si elle existe
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating titles:', error);
      toast.error('Erreur lors de la mise à jour des titres');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={updateAllTitles}
      disabled={isUpdating}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isUpdating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Mise à jour des titres...
        </>
      ) : (
        'Mettre à jour les titres'
      )}
    </button>
  );
};

export default UpdateTitles; 