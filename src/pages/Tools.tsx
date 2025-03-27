import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tool, Category } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const Tools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTools, setFilteredTools] = useState<Record<string, Tool[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

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

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        AI Tools Directory
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
              placeholder="Search tools by name, description, or category..."
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
          >
            <option value="all">All Categories</option>
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
          if (!category) return null;

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
                          <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
                            {tool.name}
                          </h3>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            {tool.categories?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <p className={`text-gray-400 text-sm ${!expandedDescriptions.has(tool.id) ? 'line-clamp-3' : ''}`}>
                            {tool.description}
                          </p>
                          {tool.description.length > 150 && (
                            <button
                              onClick={() => toggleDescription(tool.id)}
                              className="mt-2 flex items-center text-blue-400 hover:text-blue-300 text-sm"
                            >
                              {expandedDescriptions.has(tool.id) ? (
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
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                        <span className="text-xs text-gray-500">
                          {tool.subcategory}
                        </span>
                        <a
                          href={tool.website_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center"
                        >
                          Visit site
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tools;