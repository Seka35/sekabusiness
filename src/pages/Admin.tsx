import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tool, Prompt, BlogPost, Category, User, ChatMessage, ParsedMessage, N8nScript } from '../types';
import { Edit, Trash2, Save, X, ChevronUp, ChevronDown, Code, Users as UsersIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar';
import { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import TextEditor from '../components/TextEditor';
import ChatHistory from '../components/ChatHistory';

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'tools' | 'prompts' | 'blog' | 'users' | 'chat' | 'n8n'>('tools');
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showToolForm, setShowToolForm] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeForm, setCodeForm] = useState({
    language: 'bash',
    content: ''
  });

  // Form states
  const [toolForm, setToolForm] = useState({
    name: '',
    description: '',
    category_id: '',
    subcategory: '',
    logo_url: '',
    website_link: '',
    affiliate_link: '',
    price_type: 'free',
    price: '',
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

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  const [n8nForm, setN8nForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  const [n8nScripts, setN8nScripts] = useState<N8nScript[]>([]);

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

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatHistory();
    }
  }, [activeTab]);

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
    if (toolsData) {
      setTools(toolsData);
      setFilteredTools(toolsData);
    }

    // Fetch prompts
    const { data: promptsData } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });
    if (promptsData) {
      setPrompts(promptsData);
      setFilteredPrompts(promptsData);
    }

    // Fetch blog posts
    const { data: postsData } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (postsData) {
      setPosts(postsData);
      setFilteredPosts(postsData);
    }

    // Fetch n8n scripts
    const { data: scriptsData } = await supabase
      .from('n8n_scripts')
      .select('*')
      .order('created_at', { ascending: false });
    if (scriptsData) {
      setN8nScripts(scriptsData);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('Fetching users...');
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('user_id, email, status, created_at, current_period_end');

      console.log('Subscriptions data:', subscriptions);
      console.log('Error:', error);

      if (error) throw error;

      // Transform the data to match our User interface
      const users: User[] = subscriptions.map(sub => ({
        id: sub.user_id,
        email: sub.email,
        created_at: sub.created_at,
        last_login: null,
        subscription_status: sub.status as 'active' | 'inactive' | 'cancelled'
      }));

      console.log('Transformed users:', users);
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchChatHistory = async () => {
    setIsLoadingChat(true);
    try {
      // First get all chat messages
      const { data: chats, error: chatError } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (chatError) throw chatError;

      // Then get all subscriptions to map emails
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, email');

      if (subError) throw subError;

      // Combine the data
      const formattedChats: ChatMessage[] = chats.map(chat => ({
        id: chat.id,
        user_id: chat.user_id,
        messages: chat.messages,
        created_at: chat.created_at,
        email: subscriptions.find(sub => sub.user_id === chat.user_id)?.email || 'Unknown'
      }));

      setChatHistory(formattedChats);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(t('admin.error.login'));
    } else {
      toast.success(t('admin.success.login'));
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('admin.success.logout'));
    }
  };

  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { data, error } = await supabase
          .from('tools')
          .update(toolForm)
          .eq('id', editingId);
        
        if (error) {
          console.error('Update error:', error);
          toast.error(`Error: ${error.message}`);
          return;
        }
        toast.success(t('admin.success.toolUpdate'));
      } else {
        const { data, error } = await supabase
          .from('tools')
          .insert([toolForm]);
        
        if (error) {
          console.error('Insert error:', error);
          toast.error(`Error: ${error.message}`);
          return;
        }
        toast.success(t('admin.success.toolAdd'));
      }
      
      setToolForm({
        name: '',
        description: '',
        category_id: '',
        subcategory: '',
        logo_url: '',
        website_link: '',
        affiliate_link: '',
        price_type: 'free',
        price: '',
      });
      setEditingId(null);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        toast.success(t('admin.success.promptUpdate'));
      } else {
        const { error } = await supabase
          .from('prompts')
          .insert([promptForm]);
        if (error) throw error;
        toast.success(t('admin.success.promptAdd'));
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
      toast.error(t('admin.error.savePrompt'));
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
        toast.success(t('admin.success.postUpdate'));
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([blogForm]);
        if (error) throw error;
        toast.success(t('admin.success.postAdd'));
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
      toast.error(t('admin.error.savePost'));
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string, table: string) => {
    if (window.confirm(t('admin.tools.confirmDelete'))) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success(t('admin.success.delete'));
        fetchData();
      } catch (error) {
        toast.error(t('admin.error.delete'));
        console.error('Error:', error);
      }
    }
  };

  const handleAddTool = () => {
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
      price_type: 'free',
      price: '',
    });
    setShowToolForm(true);
  };

  const handleEdit = (item: any, type: 'tools' | 'prompts' | 'blog' | 'n8n') => {
    setIsEditing(true);
    setEditingId(item.id);
    setActiveTab(type);
    setShowToolForm(true);

    if (type === 'tools') {
      setToolForm({
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        subcategory: item.subcategory,
        logo_url: item.logo_url,
        website_link: item.website_link,
        affiliate_link: item.affiliate_link || '',
        price_type: item.price_type || 'free',
        price: item.price || '',
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
    } else if (type === 'n8n') {
      setN8nForm({
        title: item.title,
        description: item.description,
        file: null,
      });
    }
  };

  const handleToolSearch = (query: string) => {
    if (!query.trim()) {
      if (selectedCategory === 'all') {
        setFilteredTools(tools);
      } else {
        setFilteredTools(tools.filter(tool => tool.category_id === selectedCategory));
      }
      return;
    }

    const filtered = tools.filter(tool =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase()) ||
      categories.find(c => c.id === tool.category_id)?.name.toLowerCase().includes(query.toLowerCase())
    );

    if (selectedCategory === 'all') {
      setFilteredTools(filtered);
    } else {
      setFilteredTools(filtered.filter(tool => tool.category_id === selectedCategory));
    }
  };

  const handlePromptSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredPrompts(prompts);
      return;
    }

    const filtered = prompts.filter(prompt =>
      prompt.title.toLowerCase().includes(query.toLowerCase()) ||
      prompt.description.toLowerCase().includes(query.toLowerCase()) ||
      prompt.tool.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPrompts(filtered);
  };

  const handlePostSearch = (query: string) => {
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

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setFilteredTools(tools);
    } else {
      setFilteredTools(tools.filter(tool => tool.category_id === categoryId));
    }
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

  const handleInsertCode = () => {
    const codeBlock = `\`\`\`${codeForm.language}\n${codeForm.content}\n\`\`\``;
    setBlogForm(prev => ({
      ...prev,
      content: prev.content + (prev.content ? '\n\n' : '') + codeBlock
    }));
    setCodeForm({ language: 'bash', content: '' });
    setShowCodeModal(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, subscription_status: newStatus as 'active' | 'inactive' | 'cancelled' }
          : user
      ));
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const parseMessages = (messagesStr: string): ParsedMessage[] => {
    try {
      return JSON.parse(messagesStr);
    } catch (e) {
      return [];
    }
  };

  const getLastMessage = (messagesStr: string): string => {
    const messages = parseMessages(messagesStr);
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.content?.slice(0, 100) + '...' || 'No message content';
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      
      setChatHistory(chatHistory.filter(chat => chat.id !== chatId));
      toast.success('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const handleN8nSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing script
        const updates: any = {
          title: n8nForm.title,
          description: n8nForm.description,
          updated_at: new Date().toISOString(),
        };

        if (n8nForm.file) {
          // Upload new file if provided
          const fileExt = n8nForm.file.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('n8n')
            .upload(fileName, n8nForm.file);

          if (uploadError) throw uploadError;
          updates.file_url = fileName;
        }

        const { error } = await supabase
          .from('n8n_scripts')
          .update(updates)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Script updated successfully');
      } else {
        // Add new script
        if (!n8nForm.file) {
          toast.error('Please select a file');
          return;
        }

        const fileExt = n8nForm.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('n8n')
          .upload(fileName, n8nForm.file);

        if (uploadError) throw uploadError;

        // Create database entry
        const { error } = await supabase
          .from('n8n_scripts')
          .insert([{
            title: n8nForm.title,
            description: n8nForm.description,
            file_url: fileName,
          }]);

        if (error) throw error;
        toast.success('Script added successfully');
      }

      setN8nForm({
        title: '',
        description: '',
        file: null,
      });
      setEditingId(null);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save script');
      console.error('Error:', error);
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
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded ${
            activeTab === 'users'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded ${
            activeTab === 'chat'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Chat History
        </button>
        <button
          onClick={() => setActiveTab('n8n')}
          className={`px-4 py-2 rounded ${
            activeTab === 'n8n'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          N8n Scripts
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        {/* Tools Management */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Tools</h2>
            </div>

            <div className="mb-6 space-y-4">
              <SearchBar
                items={tools.map(tool => ({
                  id: tool.id,
                  name: tool.name,
                  description: tool.description,
                  category: categories.find(c => c.id === tool.category_id)?.name
                }))}
                onSearch={handleToolSearch}
                placeholder="Search tools by name, description, or category..."
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full md:w-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Add/Edit Tool Form */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 mb-8">
              <h3 className="text-xl font-semibold text-white mb-6">
                {isEditing ? 'Edit Tool' : 'Add New Tool'}
              </h3>
              <form onSubmit={handleToolSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={toolForm.name}
                      onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={toolForm.category_id}
                      onChange={(e) => setToolForm({ ...toolForm, category_id: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subcategory</label>
                    <input
                      type="text"
                      value={toolForm.subcategory}
                      onChange={(e) => setToolForm({ ...toolForm, subcategory: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={toolForm.logo_url}
                      onChange={(e) => setToolForm({ ...toolForm, logo_url: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website Link</label>
                    <input
                      type="url"
                      value={toolForm.website_link}
                      onChange={(e) => setToolForm({ ...toolForm, website_link: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Affiliate Link (optional)</label>
                    <input
                      type="url"
                      value={toolForm.affiliate_link}
                      onChange={(e) => setToolForm({ ...toolForm, affiliate_link: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price Type</label>
                    <select
                      value={toolForm.price_type}
                      onChange={(e) => setToolForm({ ...toolForm, price_type: e.target.value as 'free' | 'paid' | 'freemium' })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                      required
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                      <option value="freemium">Freemium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price (optional)</label>
                    <input
                      type="text"
                      value={toolForm.price}
                      onChange={(e) => setToolForm({ ...toolForm, price: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                      placeholder="e.g. $10/month, Free trial available"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={toolForm.description}
                    onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
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
                          price_type: 'free',
                          price: '',
                        });
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Tools List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
                >
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
                      <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        {categories.find(c => c.id === tool.category_id)?.name}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{tool.subcategory}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(tool, 'tools')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit tool"
                      >
                        <Edit className="w-5 h-5 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id, 'tools')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete tool"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
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
            
            <div className="mb-6">
              <SearchBar
                items={prompts.map(prompt => ({
                  id: prompt.id,
                  name: prompt.title,
                  description: prompt.description,
                  category: prompt.tool
                }))}
                onSearch={handlePromptSearch}
                placeholder="Search prompts by title, description, or tool..."
              />
            </div>
            
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
              {filteredPrompts.map((prompt) => (
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
            
            <div className="mb-6">
              <SearchBar
                items={posts.map(post => ({
                  id: post.id,
                  name: post.title,
                  description: post.excerpt
                }))}
                onSearch={handlePostSearch}
                placeholder="Search blog posts by title or content..."
              />
            </div>
            
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
                <label className="block text-sm font-medium mb-2">{t('admin.blog.content')}</label>
                <TextEditor
                  value={blogForm.content}
                  onChange={(value) => setBlogForm({ ...blogForm, content: value })}
                  onAddCode={() => setShowCodeModal(true)}
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
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 cursor-pointer hover:border-blue-500/50 transition-all duration-300"
                  onClick={() => {
                    setSelectedPost(post);
                    setShowPostModal(true);
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(post, 'blog')}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit post"
                          >
                            <Edit className="w-5 h-5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id, 'blog_posts')}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <p className="text-gray-400 text-sm line-clamp-3 whitespace-pre-line">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        Last updated: {formatDate(post.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Management */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <UsersIcon className="w-6 h-6 mr-2" />
                User Management
              </h2>
            </div>

            {isLoadingUsers ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-700">
                      <th className="pb-3 px-4">Email</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Created At</th>
                      <th className="pb-3 px-4">Last Login</th>
                      <th className="pb-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-700">
                        <td className="py-4 px-4">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.subscription_status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.subscription_status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          {formatDate(user.last_login)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.subscription_status)}
                              className="p-1 hover:bg-gray-700 rounded"
                              title={user.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {user.subscription_status === 'active' 
                                ? <ToggleRight className="w-5 h-5 text-green-500" />
                                : <ToggleLeft className="w-5 h-5 text-red-500" />
                              }
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 hover:bg-gray-700 rounded text-red-500"
                              title="Delete user"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Chat History Management */}
        {activeTab === 'chat' && (
          <ChatHistory
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            isLoading={isLoadingChat}
          />
        )}

        {/* N8n Scripts Management */}
        {activeTab === 'n8n' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage N8n Scripts</h2>
            
            {/* Add/Edit N8n Script Form */}
            <form onSubmit={handleN8nSubmit} className="mb-8 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={n8nForm.title}
                  onChange={(e) => setN8nForm({ ...n8nForm, title: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={n8nForm.description}
                  onChange={(e) => setN8nForm({ ...n8nForm, description: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  type="file"
                  onChange={(e) => setN8nForm({ ...n8nForm, file: e.target.files?.[0] || null })}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                  accept=".json"
                  required={!editingId}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Script' : 'Add Script'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      setN8nForm({
                        title: '',
                        description: '',
                        file: null,
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

            {/* N8n Scripts List */}
            <div className="space-y-4">
              {n8nScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{script.title}</h3>
                      <p className="text-gray-300 mt-2">{script.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(script, 'n8n')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit script"
                      >
                        <Edit className="w-5 h-5 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(script.id, 'n8n_scripts')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete script"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Blog Post Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-white">{selectedPost.title}</h3>
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setSelectedPost(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 whitespace-pre-line">
                {selectedPost.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Block Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">{t('blog.addCode')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('blog.codeLanguage')}</label>
                <select
                  value={codeForm.language}
                  onChange={(e) => setCodeForm({ ...codeForm, language: e.target.value })}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                >
                  <option value="bash">Bash</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('blog.codeContent')}</label>
                <textarea
                  value={codeForm.content}
                  onChange={(e) => setCodeForm({ ...codeForm, content: e.target.value })}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none font-mono"
                  rows={8}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleInsertCode}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  {t('common.insert')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;