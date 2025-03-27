import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blog posts:', error);
        return;
      }

      if (data) {
        setPosts(data);
        setFilteredPosts(data);
      }
    };

    fetchPosts();
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPosts(filtered);
  };

  const togglePost = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        AI Insights & Tutorials
      </h1>

      <div className="mb-8">
        <SearchBar
          items={posts.map(post => ({
            id: post.id,
            name: post.title,
            description: post.excerpt
          }))}
          onSearch={handleSearch}
          placeholder="Search blog posts by title or content..."
        />
      </div>
      
      <div className="space-y-8">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">{post.title}</h2>
            
            <div className="flex items-center text-gray-400 text-sm mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            
            <div className="relative">
              <div className={`text-gray-300 whitespace-pre-line ${expandedPosts.has(post.id) ? '' : 'line-clamp-3'}`}>
                {post.content}
              </div>
              {post.content.length > 150 && (
                <button
                  onClick={() => togglePost(post.id)}
                  className="text-blue-400 hover:text-blue-300 flex items-center mt-2"
                >
                  {expandedPosts.has(post.id) ? (
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
          </article>
        ))}
      </div>
    </div>
  );
};

export default Blog;