import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tool } from '../types';
import { ExternalLink } from 'lucide-react';

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Record<string, Tool[]>>({});

  useEffect(() => {
    const fetchTools = async () => {
      const { data: toolsData, error } = await supabase
        .from('tools')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tools:', error);
        return;
      }

      if (toolsData) {
        const toolsByCategory = toolsData.reduce((acc: Record<string, Tool[]>, tool) => {
          const category = tool.categories?.name || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(tool as Tool);
          return acc;
        }, {});

        setTools(toolsData as Tool[]);
        setCategories(toolsByCategory);
      }
    };

    fetchTools();
  }, []);

  return (
    <div className="space-y-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Business Tools
        </h1>
        
        {Object.entries(categories).map(([category, categoryTools]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-white">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <img
                      src={tool.logo_url}
                      alt={tool.name}
                      className="w-12 h-12 rounded-lg mr-4 object-cover"
                    />
                    <h3 className="text-xl font-semibold text-white">{tool.name}</h3>
                  </div>
                  <p className="text-gray-300 mb-4 text-sm">{tool.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{tool.subcategory}</span>
                    <a
                      href={tool.affiliate_link || tool.website_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Visit <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tools;