import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching blog posts...');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setError(error.message);
        toast.error('Failed to load blog posts');
        return;
      }

      console.log('Fetched posts:', data);
      setPosts(data || []);
    } catch (err) {
      console.error('Error in fetchPosts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadMore = (post: BlogPost) => {
    setSelectedPost(post);
    setShowModal(true);
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
          onClick={fetchPosts}
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
        Blog
      </h1>
      
      {posts.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No blog posts available yet.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-semibold mb-4">{post.title}</h2>
              {post.categories && (
                <div className="mb-4">
                  <span className="text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    {post.categories.name}
                  </span>
                </div>
              )}
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 line-clamp-3 whitespace-pre-line mb-4">
                  {post.excerpt || post.description}
                </div>
              </div>
              <button
                onClick={() => handleReadMore(post)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Read More
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Article Modal */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedPost(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <article className="pt-8">
              <h2 className="text-3xl font-bold mb-6">{selectedPost.title}</h2>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    code({ className, children }) {
                      const language = className ? className.replace('language-', '') : '';
                      return (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={language}
                          className="rounded-lg my-4"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      );
                    },
                    p: ({ children }) => (
                      <p className="text-gray-300 whitespace-pre-line mb-4">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-white mt-8 mb-4">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-bold text-white mt-4 mb-2">{children}</h3>
                    ),
                  }}
                >
                  {selectedPost.content}
                </ReactMarkdown>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;