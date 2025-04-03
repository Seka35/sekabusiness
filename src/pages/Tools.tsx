import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tool, Category } from '../types';
import { ChevronDown, ChevronUp, Share2, Search, Filter } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import toast from 'react-hot-toast';

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTools, setFilteredTools] = useState<Record<string, Tool[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const { data: toolsData, error: toolsError } = await supabase
          .from('tools')
          .select('*')
          .order('created_at', { ascending: false });

        if (toolsError) throw toolsError;

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) throw categoriesError;

        setTools(toolsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      const toolsByCategory = tools.reduce((acc: Record<string, Tool[]>, tool: Tool) => {
        const categoryId = tool.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(tool);
        return acc;
      }, {});
      setFilteredTools(toolsByCategory);
      return;
    }

    const filtered = tools.filter(tool =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase()) ||
      tool.categories?.name.toLowerCase().includes(query.toLowerCase())
    );

    const filteredByCategory = filtered.reduce((acc: Record<string, Tool[]>, tool: Tool) => {
      const categoryId = tool.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(tool);
      return acc;
    }, {});

    setFilteredTools(filteredByCategory);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      const toolsByCategory = tools.reduce((acc: Record<string, Tool[]>, tool: Tool) => {
        const catId = tool.category_id;
        if (!acc[catId]) {
          acc[catId] = [];
        }
        acc[catId].push(tool);
        return acc;
      }, {});
      setFilteredTools(toolsByCategory);
    } else {
      const filtered = tools.filter(tool => tool.category_id === categoryId);
      setFilteredTools({ [categoryId]: filtered });
    }
  };

  const toggleDescription = (toolId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  const handleShare = async (tool: Tool) => {
    const url = `${window.location.origin}?tool=${tool.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(tool.id);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  // Modify the price type color mapping to use more transparent backgrounds
  const getPriceTypeColor = (priceType: string) => {
    switch (priceType) {
      case 'free':
        return 'bg-green-500/20 text-green-300';
      case 'freemium':
        return 'bg-orange-500/20 text-orange-300';
      case 'paid':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Tools Directory</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-12">
          {Object.entries(filteredTools).map(([categoryId, categoryTools]) => {
            const category = categories.find(c => c.id === categoryId);
            if (!category || categoryTools.length === 0) return null;

            return (
              <div key={categoryId} className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h2 className="text-2xl font-semibold text-white">{category.name}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {categoryTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="group bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <img
                              src={tool.logo_url}
                              alt={tool.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="text-lg font-semibold mb-1">{tool.name}</h3>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriceTypeColor(tool.price_type)}`}>
                            {tool.price_type.charAt(0).toUpperCase() + tool.price_type.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">
                          {expandedDescriptions.has(tool.id)
                            ? tool.description
                            : tool.description.length > 100
                            ? tool.description.substring(0, 100) + '...'
                            : tool.description}
                        </p>
                        {tool.description.length > 100 && (
                          <button
                            onClick={() => toggleDescription(tool.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center mt-auto"
                          >
                            {expandedDescriptions.has(tool.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Show More
                              </>
                            )}
                          </button>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <a
                            href={tool.website_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Visit Website
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(filteredTools).length === 0 && (
            <p className="text-gray-400 text-center py-4">No tools found matching your search.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tools;