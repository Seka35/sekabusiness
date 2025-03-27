import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tool, Prompt, BlogPost } from '../types';
import { PlusCircle, Edit, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Admin: React.FC = () => {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState<'tools' | 'prompts' | 'blog'>('tools');
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [toolForm, setToolForm] = useState({
    name: '',
    description: '',
    category_id: '',
    subcategory: '',
    logo_url: '',
    website_link: '',
    affiliate_link: '',
  });

  const [promptForm, setPromptForm] = useState({
    title: '',
    tool: '',
    description: '',
    prompt_text: '',
  });

  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (categoriesData) setCategories(categoriesData);

    // Fetch tools
    const { data: toolsData } = await supabase
      .from('tools')
      .select('*, categories(*)')
      .order('created_at', { ascending: false });
    if (toolsData) setTools(toolsData);

    // Fetch prompts
    const { data: promptsData } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });
    if (promptsData) setPrompts(promptsData);

    // Fetch blog posts
    const { data: postsData } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (postsData) setPosts(postsData);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully!');
    }
  };

  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('tools')
          .update(toolForm)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Tool updated successfully!');
      } else {
        const { error } = await supabase
          .from('tools')
          .insert([toolForm]);
        if (error) throw error;
        toast.success('Tool added successfully!');
      }
      setToolForm({
        name: '',
        description: '',
        category_id: '',
        subcategory: '',
        logo_url: '',
        website_link: '',
        affiliate_link: '',
      });
      setEditingId(null);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error('Error saving tool');
      console.error('Error:', error);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('prompts')
          .update(promptForm)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Prompt updated successfully!');
      } else {
        const { error } = await supabase
          .from('prompts')
          .insert([promptForm]);
        if (error) throw error;
        toast.success('Prompt added successfully!');
      }
      setPromptForm({
        title: '',
        tool: '',
        description: '',
        prompt_text: '',
      });
      setEditingId(null);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error('Error saving prompt');
      console.error('Error:', error);
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('blog_posts')
          .update({ ...blogForm, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Blog post updated successfully!');
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([blogForm]);
        if (error) throw error;
        toast.success('Blog post added successfully!');
      }
      setBlogForm({
        title: '',
        content: '',
        excerpt: '',
      });
      setEditingId(null);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error('Error saving blog post');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string, table: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('Item deleted successfully!');
        fetchData();
      } catch (error) {
        toast.error('Error deleting item');
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (item: any, type: 'tools' | 'prompts' | 'blog') => {
    setIsEditing(true);
    setEditingId(item.id);
    setActiveTab(type);

    if (type === 'tools') {
      setToolForm({
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        subcategory: item.subcategory,
        logo_url: item.logo_url,
        website_link: item.website_link,
        affiliate_link: item.affiliate_link || '',
      });
    } else if (type === 'prompts') {
      setPromptForm({
        title: item.title,
        tool: item.tool,
        description: item.description,
        prompt_text: item.prompt_text,
      });
    } else if (type === 'blog') {
      setBlogForm({
        title: item.title,
        content: item.content,
        excerpt: item.excerpt,
      });
    }
  };

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded ${
            activeTab === 'tools'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Tools
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-4 py-2 rounded ${
            activeTab === 'prompts'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Prompts
        </button>
        <button
          onClick={() => setActiveTab('blog')}
          className={`px-4 py-2 rounded ${
            activeTab === 'blog'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Blog
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        {/* Tools Management */}
        {activeTab === 'tools' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage Tools</h2>
            
            {/* Add/Edit Tool Form */}
            <form onSubmit={handleToolSubmit} className="mb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={toolForm.name}
                    onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={toolForm.category_id}
                    onChange={(e) => setToolForm({ ...toolForm, category_id: e.target.value })}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subcategory</label>
                  <input
                    type="text"
                    value={toolForm.subcategory}
                    onChange={(e) => setToolForm({ ...toolForm, subcategory: e.target.value })}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={toolForm.logo_url}
                    onChange={(e) => setToolForm({ ...toolForm, logo_url: e.target.value })}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website Link</label>
                  <input
                    type="url"
                    value={toolForm.website_link}
                    onChange={(e) => setToolForm({ ...toolForm, website_link: e.target.value })}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Affiliate Link (optional)</label>
                  <input
                    type="url"
                    value={toolForm.affiliate_link}
                    onChange={(e) => setToolForm({ ...toolForm, affiliate_link: e.target.value })}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={toolForm.description}
                  onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  rows={3}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Tool' : 'Add Tool'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      setToolForm({
                        name: '',
                        description: '',
                        category_id: '',
                        subcategory: '',
                        logo_url: '',
                        website_link: '',
                        affiliate_link: '',
                      });
                    }}
                    className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Tools List */}
            <div className="space-y-4">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-start"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{tool.name}</h3>
                    <p className="text-gray-300 text-sm">{tool.description}</p>
                    <div className="flex space-x-2 mt-2">
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        {categories.find(c => c.id === tool.category_id)?.name}
                      </span>
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        {tool.subcategory}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(tool, 'tools')}
                      className="p-2 hover:bg-gray-600 rounded transition-colors"
                      title="Edit tool"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tool.id, 'tools')}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                      title="Delete tool"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompts Management */}
        {activeTab === 'prompts' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage Prompts</h2>
            
            {/* Add/Edit Prompt Form */}
            <form onSubmit={handlePromptSubmit} className="mb-8 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={promptForm.title}
                  onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tool</label>
                <input
                  type="text"
                  value={promptForm.tool}
                  onChange={(e) => setPromptForm({ ...promptForm, tool: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={promptForm.description}
                  onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prompt Text</label>
                <textarea
                  value={promptForm.prompt_text}
                  onChange={(e) => setPromptForm({ ...promptForm, prompt_text: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  rows={5}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Prompt' : 'Add Prompt'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      setPromptForm({
                        title: '',
                        tool: '',
                        description: '',
                        prompt_text: '',
                      });
                    }}
                    className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Prompts List */}
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-start"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{prompt.title}</h3>
                    <span className="text-blue-400 text-sm">{prompt.tool}</span>
                    <p className="text-gray-300 text-sm mt-2">{prompt.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(prompt, 'prompts')}
                      className="p-2 hover:bg-gray-600 rounded transition-colors"
                      title="Edit prompt"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id, 'prompts')}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                      title="Delete prompt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blog Management */}
        {activeTab === 'blog' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage Blog Posts</h2>
            
            {/* Add/Edit Blog Post Form */}
            <form onSubmit={handleBlogSubmit} className="mb-8 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  rows={10}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Post' : 'Add Post'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      setBlogForm({
                        title: '',
                        content: '',
                        excerpt: '',
                      });
                    }}
                    className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Blog Posts List */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-start"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="text-gray-300 text-sm mt-2">{post.excerpt}</p>
                    <div className="text-sm text-gray-400 mt-2">
                      Last updated: {new Date(post.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(post, 'blog')}
                      className="p-2 hover:bg-gray-600 rounded transition-colors"
                      title="Edit post"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id, 'blog_posts')}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;