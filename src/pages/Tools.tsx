import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tool, Category } from '../types';
import { ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Tools: React.FC = () => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTools, setFilteredTools] = useState<Record<string, Tool[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .order('name');

      if (toolsError) {
        console.error('Error fetching tools:', toolsError);
        return;
      }

      if (toolsData) {
        setTools(toolsData);
        const toolsByCategory = toolsData.reduce((acc: Record<string, Tool[]>, tool: Tool) => {
          const categoryId = tool.category_id;
          if (!acc[categoryId]) {
            acc[categoryId] = [];
          }
          acc[categoryId].push(tool);
          return acc;
        }, {});
        setFilteredTools(toolsByCategory);
      }
    };

    const fetchCategories = async () => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      if (categoriesData) {
        setCategories(categoriesData);
      }
    };

    fetchTools();
    fetchCategories();
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
      toast.success(t('tools.urlCopied'));
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error(t('tools.copyError'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        {t('tools.title')}
      </h1>

      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              items={tools.map(tool => ({
                id: tool.id,
                name: tool.name,
                description: tool.description,
                category: tool.categories?.name
              }))}
              onSearch={handleSearch}
              placeholder={t('tools.search')}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
          >
            <option value="all">{t('admin.tools.allCategories')}</option>
            {categories.map((category) => (
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
                      <div className="flex items-start space-x-4 mb-4">
                        <img
                          src={tool.logo_url}
                          alt={tool.name}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/48?text=AI';
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
                              {tool.name}
                            </h3>
                            <span className={`text-sm px-3 py-1 rounded bg-gray-900/80 ${
                              tool.price_type === 'free'
                                ? 'text-green-400'
                                : tool.price_type === 'paid'
                                ? 'text-purple-400'
                                : 'text-yellow-500'
                            } font-medium`}>
                              {tool.price_type === 'free' 
                                ? 'Free'
                                : tool.price_type === 'paid'
                                ? tool.price || 'Paid'
                                : 'Freemium'}
                            </span>
                          </div>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            {tool.categories?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`text-gray-400 text-sm ${!expandedDescriptions.has(tool.id) ? 'line-clamp-3' : ''}`}>
                          {tool.description}
                        </p>
                        {tool.description.length > 150 && (
                          <button
                            onClick={() => toggleDescription(tool.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm mt-2 flex items-center"
                          >
                            {expandedDescriptions.has(tool.id) ? (
                              <>
                                {t('tools.showLess')}
                                <ChevronUp className="w-4 h-4 ml-1" />
                              </>
                            ) : (
                              <>
                                {t('tools.showMore')}
                                <ChevronDown className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="mt-4">
                        <a
                          href={tool.website_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          {t('tools.visitWebsite')}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {categoryTools.length === 0 && (
                <p className="text-gray-400 text-center py-4">{t('tools.noResults')}</p>
              )}
            </div>
          );
        })}
        {Object.keys(filteredTools).length === 0 && (
          <p className="text-gray-400 text-center py-4">{t('tools.noResults')}</p>
        )}
      </div>
    </div>
  );
};

export default Tools;