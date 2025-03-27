import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Prompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }

      if (data) {
        setPrompts(data);
      }
    };

    fetchPrompts();
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy prompt');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Prompts Library
      </h1>
      
      <div className="space-y-6">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">{prompt.title}</h2>
                <span className="text-sm text-blue-400">{prompt.tool}</span>
              </div>
              <button
                onClick={() => copyToClipboard(prompt.prompt_text, prompt.id)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy prompt"
              >
                {copiedId === prompt.id ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">{prompt.description}</p>
            
            <div className="bg-gray-900/50 rounded p-4 font-mono text-sm text-gray-300">
              {prompt.prompt_text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prompts;