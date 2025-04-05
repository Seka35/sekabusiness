import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { N8nScript } from '../types';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const N8nScripts: React.FC = () => {
  const [scripts, setScripts] = useState<N8nScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchScripts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    // Check if user exists in subscriptions table
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error || !subscription) {
      navigate('/login');
      return;
    }
  };

  const fetchScripts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('n8n_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scripts:', error);
        setError(error.message);
        toast.error('Failed to load scripts');
        return;
      }

      setScripts(data || []);
    } catch (err) {
      console.error('Error in fetchScripts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to load scripts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (script: N8nScript) => {
    try {
      const { data, error } = await supabase.storage
        .from('n8n')
        .download(script.file_url);

      if (error) {
        throw error;
      }

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = script.file_url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error('Failed to download file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Error</h1>
        <p className="text-gray-300">{error}</p>
        <button
          onClick={fetchScripts}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        N8n Scripts
      </h1>
      
      {scripts.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No scripts available yet.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {scripts.map((script) => (
            <article
              key={script.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">{script.title}</h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-300 whitespace-pre-line mb-4">
                      {script.description}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(script)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default N8nScripts; 