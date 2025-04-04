import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tool, Category } from '../types';
import { ChevronDown, ChevronUp, Share2, Search, Filter } from 'lucide-react';
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
        setLoading(true);
        console.log('Fetching tools...');

        // Fetch categories first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name');

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          throw categoriesError;
        }

        console.log('Categories fetched:', categoriesData);
        setCategories(categoriesData || []);

        // Then fetch tools
        const { data: toolsData, error: toolsError } = await supabase
          .from('tools')
          .select(`
            id,
            name,
            description,
            logo_url,
            website_link,
            price_type,
            category_id,
            subcategory,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (toolsError) {
          console.error('Error fetching tools:', toolsError);
          throw toolsError;
        }

        console.log('Tools fetched:', toolsData);

        // Map tools with their categories and fix the url property
        const toolsWithCategories = toolsData?.map(tool => {
          const category = categoriesData?.find(cat => cat.id === tool.category_id);
          return {
            ...tool,
            url: tool.website_link, // Map website_link to url for compatibility
            categories: category ? {
              id: category.id,
              name: category.name,
              slug: category.slug
            } : undefined
          };
        }) || [];

        setTools(toolsWithCategories);
        
        // Initialize filtered tools
        const toolsByCategory = toolsWithCategories.reduce((acc: Record<string, Tool[]>, tool: Tool) => {
          const categoryId = tool.category_id;
          if (!acc[categoryId]) {
            acc[categoryId] = [];
          }
          acc[categoryId].push(tool);
          return acc;
        }, {});

        console.log('Tools by category:', toolsByCategory);
        setFilteredTools(toolsByCategory);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load tools');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  const handleSearch = (query: string) => {
    if (selectedCategory === 'all') {
      const filtered = tools.filter(tool =>
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        (tool.categories?.name || '').toLowerCase().includes(query.toLowerCase())
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
    } else {
      const filtered = tools.filter(tool => 
        tool.category_id === selectedCategory &&
        (tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredTools({ [selectedCategory]: filtered });
    }
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, selectedCategory]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    handleSearch(searchTerm);
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
    const url = `${window.location.origin}/tools?id=${tool.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(tool.id);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const getPriceTypeColor = (priceType: string) => {
    switch (priceType.toLowerCase()) {
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        AI Tools Directory
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1f2e] rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="pl-10 pr-8 py-2 bg-[#1a1f2e] rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all min-w-[180px]"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(filteredTools).map(([categoryId, categoryTools]) => (
          categoryTools.length > 0 && (
            <div key={categoryId} className="space-y-4">
              <h2 className="text-2xl font-semibold text-white/90 border-b border-gray-700 pb-2">
                {getCategoryName(categoryId)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="group bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        {tool.logo_url && (
                          <img
                            src={tool.logo_url}
                            alt={tool.name}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-700"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">
                            {tool.name}
                          </h3>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getPriceTypeColor(tool.price_type)}`}>
                            {tool.price_type.charAt(0).toUpperCase() + tool.price_type.slice(1)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleShare(tool)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Share tool"
                      >
                        <Share2 size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className={`text-gray-300 ${expandedDescriptions.has(tool.id) ? '' : 'line-clamp-2'}`}>
                        {tool.description}
                      </p>
                      {tool.description.length > 100 && (
                        <button
                          onClick={() => toggleDescription(tool.id)}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center"
                        >
                          {expandedDescriptions.has(tool.id) ? (
                            <>
                              Show Less <ChevronUp size={16} className="ml-1" />
                            </>
                          ) : (
                            <>
                              Show More <ChevronDown size={16} className="ml-1" />
                            </>
                          )}
                        </button>
                      )}
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default Tools;