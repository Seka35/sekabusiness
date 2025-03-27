import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import { Calendar } from 'lucide-react';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

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
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Blog
      </h1>
      
      <div className="space-y-8">
        {posts.map((post) => (
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
            
            <p className="text-gray-300 mb-4">{post.excerpt}</p>
            
            <div className="prose prose-invert max-w-none">
              {post.content}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Blog;