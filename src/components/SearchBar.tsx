import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  items: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
  }>;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  items,
  onSearch,
  placeholder = 'Search...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState(items);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredItems(filtered);
      setIsOpen(true);
    } else {
      setFilteredItems([]);
      setIsOpen(false);
    }
  }, [query, items]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleItemClick = (item: typeof items[0]) => {
    setQuery(item.name);
    setIsOpen(false);
    onSearch(item.name);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {isOpen && filteredItems.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="w-full px-4 py-2 text-left hover:bg-gray-700/50 transition-colors"
            >
              <div className="text-white font-medium">{item.name}</div>
              {item.description && (
                <div className="text-sm text-gray-400">{item.description}</div>
              )}
              {item.category && (
                <div className="text-xs text-blue-400 mt-1">{item.category}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 