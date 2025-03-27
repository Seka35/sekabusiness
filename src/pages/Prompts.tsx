import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar';

const Prompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

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
        setFilteredPrompts(data);
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

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredPrompts(prompts);
      return;
    }

    const filtered = prompts.filter(prompt =>
      prompt.title.toLowerCase().includes(query.toLowerCase()) ||
      prompt.description.toLowerCase().includes(query.toLowerCase()) ||
      prompt.tool.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPrompts(filtered);
  };

  const togglePrompt = (promptId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const getPreviewText = (text: string) => {
    if (text.length <= 200) return text;
    return text.substring(0, 200) + '...';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        AI Prompts Collection
      </h1>

      <div className="mb-8">
        <SearchBar
          items={prompts.map(prompt => ({
            id: prompt.id,
            name: prompt.title,
            description: prompt.description,
            category: prompt.tool
          }))}
          onSearch={handleSearch}
          placeholder="Search prompts by title, description, or tool..."
        />
      </div>

      <div className="space-y-6">
        {filteredPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{prompt.title}</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-blue-400 text-sm">{prompt.tool}</span>
                </div>
                <p className="text-gray-300 mb-4">{prompt.description}</p>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
                    {expandedPrompts.has(prompt.id) 
                      ? prompt.prompt_text 
                      : getPreviewText(prompt.prompt_text)}
                  </pre>
                  {prompt.prompt_text.length > 200 && (
                    <button
                      onClick={() => togglePrompt(prompt.id)}
                      className="mt-2 flex items-center text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {expandedPrompts.has(prompt.id) ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Show more
                        </>
                      )}
                    </button>
                  )}
                </div>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prompts;