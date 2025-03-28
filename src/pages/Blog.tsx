import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  return (
    <div className="rounded-lg overflow-hidden my-4">
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          background: '#1e1e1e',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
  };

  const handleReadMore = (post: BlogPost) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">{t('blog.title')}</h1>
      
      <div className="grid gap-8">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
          >
            <h2 className="text-2xl font-semibold mb-4">{post.title}</h2>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 line-clamp-3 whitespace-pre-line mb-4">
                {post.excerpt}
              </div>
            </div>
            <button
              onClick={() => handleReadMore(post)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t('blog.readMore')}
            </button>
          </article>
        ))}
      </div>

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
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <CodeBlock
                          language={match[1]}
                          value={String(children).replace(/\n$/, '')}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
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