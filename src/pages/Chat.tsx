import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MessageSquare, CreditCard, Zap, Shield, Clock, Send, Copy, Check, Loader2, Download, Plus, Trash2, History } from 'lucide-react';
import { sendMessage, Message } from '../lib/chat';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiryDate: Date | null;
}

interface ChatHistory {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
}

const AVAILABLE_MODELS = [
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3' },
  { id: 'gryphe/mythomax-l2-13b:free', name: 'MythoMax' },
  { id: 'rekaai/reka-flash-3:free', name: 'Reka Flash 3' },
  { id: 'openchat/openchat-7b:free', name: 'OpenChat 3.5' },
  { id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free', name: 'Dolphin 3.0 R1' },
  { id: 'open-r1/olympiccoder-32b:free', name: 'OlympicCoder' },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen2.5 VL' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
] as const;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<typeof AVAILABLE_MODELS[number]['id']>('mistralai/mistral-small-3.1-24b-instruct:free');
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    expiryDate: null,
  });
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      if (id) {
        // Load existing chat
        const { data: chatData } = await supabase
          .from('chat_history')
          .select('messages')
          .eq('id', id)
          .single();

        if (chatData?.messages) {
          setMessages(JSON.parse(chatData.messages));
          setChatId(id);
        }
      } else {
        // Create new chat
        const newChatId = uuidv4();
        setChatId(newChatId);
        navigate(`/chat/${newChatId}`);
      }
    };

    initializeChat();
  }, [id, navigate]);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }

        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Subscription check error:', error);
          setSubscriptionStatus({
            isSubscribed: false,
            expiryDate: null,
          });
          setIsLoading(false);
          return;
        }

        if (!subscriptionData || subscriptionData.status !== 'active') {
          console.log('No active subscription found');
          setSubscriptionStatus({
            isSubscribed: false,
            expiryDate: null,
          });
        } else {
          console.log('Active subscription found:', subscriptionData);
          setSubscriptionStatus({
            isSubscribed: true,
            expiryDate: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null,
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus({
          isSubscribed: false,
          expiryDate: null,
        });
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [navigate]);

  useEffect(() => {
    const loadChatHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: chats, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading chat history:', error);
          return;
        }

        if (chats) {
          const formattedChats = chats.map(chat => ({
            id: chat.id,
            title: getFirstMessage(chat.messages) || 'New Chat',
            last_message: getLastMessage(chat.messages) || 'No messages yet',
            created_at: chat.created_at
          }));
          setChatHistory(formattedChats);
        }
      }
    };

    loadChatHistory();
  }, []);

  const getFirstMessage = (messages: string): string => {
    try {
      const parsedMessages = JSON.parse(messages);
      if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
        const firstUserMessage = parsedMessages.find(m => m.role === 'user');
        if (firstUserMessage) {
          const content = firstUserMessage.content.slice(0, 30);
          return content + (content.length > 30 ? '...' : '');
        }
      }
    } catch (e) {}
    return 'New Chat';
  };

  const getLastMessage = (messages: string): string => {
    try {
      const parsedMessages = JSON.parse(messages);
      if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
        const lastMessage = parsedMessages[parsedMessages.length - 1];
        const content = lastMessage.content.slice(0, 50);
        return content + (content.length > 50 ? '...' : '');
      }
    } catch (e) {}
    return 'No messages yet';
  };

  const handleNewChat = () => {
    // Réinitialiser les messages
    setMessages([]);
    // Créer un nouvel ID
    const newChatId = uuidv4();
    // Ajouter le nouveau chat à l'historique
    setChatHistory(prev => [{
      id: newChatId,
      title: 'New Chat',
      last_message: 'No messages yet',
      created_at: new Date().toISOString()
    }, ...prev]);
    // Mettre à jour l'ID du chat actuel
    setChatId(newChatId);
    // Naviguer vers le nouveau chat
    navigate(`/chat/${newChatId}`);
  };

  const handleDeleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', chatIdToDelete);

      if (error) throw error;

      setChatHistory(prev => prev.filter(chat => chat.id !== chatIdToDelete));
      if (chatId === chatIdToDelete) {
        // Si on supprime le chat actuel, créer un nouveau chat
        handleNewChat();
      }
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const saveChatHistory = async (updatedMessages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && chatId) {
      await supabase
        .from('chat_history')
        .upsert({ 
          id: chatId,
          user_id: session.user.id, 
          messages: JSON.stringify(updatedMessages)
        });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !subscriptionStatus.isSubscribed || !chatId) return;

    const newMessage: Message = {
      content: input,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    try {
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setInput('');
      setIsTyping(true);

      const response = await sendMessage(updatedMessages, selectedModel);
      if (response) {
        const assistantMessage: Message = {
          content: response,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        await saveChatHistory(finalMessages);

        // Update chat history
        setChatHistory(prev => {
          const updatedHistory = prev.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                title: getFirstMessage(JSON.stringify(finalMessages)),
                last_message: getLastMessage(JSON.stringify(finalMessages))
              };
            }
            return chat;
          });

          // If this is a new chat, add it to the history
          if (!prev.find(chat => chat.id === chatId)) {
            return [{
              id: chatId,
              title: getFirstMessage(JSON.stringify(finalMessages)),
              last_message: getLastMessage(JSON.stringify(finalMessages)),
              created_at: new Date().toISOString()
            }, ...updatedHistory];
          }

          return updatedHistory;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Sorry, an error occurred. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const downloadChatHistory = () => {
    const chatText = messages
      .map(m => `${m.role.toUpperCase()} (${new Date(m.timestamp!).toLocaleString()}): ${m.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const MessageContent: React.FC<{ content: string }> = ({ content }) => (
    <ReactMarkdown
      components={{
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={atomDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );

  // Gestion de l'état initial de la sidebar en fonction de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!subscriptionStatus.isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent">
              Unlock the Power of AI
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform your workflow with our advanced AI chat system. Get instant answers,
              creative solutions, and expert assistance 24/7.
            </p>
            <a
              href="/subscribe"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Now - Only $10/month
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 transform hover:scale-105 transition-all duration-300">
              <div className="h-14 w-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Lightning Fast Responses</h3>
              <p className="text-gray-300">
                Get instant, accurate answers to your questions with our optimized AI system.
              </p>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 transform hover:scale-105 transition-all duration-300">
              <div className="h-14 w-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Secure & Private</h3>
              <p className="text-gray-300">
                Your conversations are encrypted and never shared with third parties.
              </p>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 transform hover:scale-105 transition-all duration-300">
              <div className="h-14 w-14 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">24/7 Availability</h3>
              <p className="text-gray-300">
                Access our AI assistant whenever you need it, day or night.
              </p>
            </div>
          </div>

          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold mb-8 text-white">Why Choose Our AI Assistant?</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center space-x-4 bg-gray-800/20 rounded-lg p-4">
                <div className="text-blue-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-gray-300">Premium AI Models</span>
              </div>
              <div className="flex items-center space-x-4 bg-gray-800/20 rounded-lg p-4">
                <div className="text-purple-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-gray-300">Versatile Assistant</span>
              </div>
              <div className="flex items-center space-x-4 bg-gray-800/20 rounded-lg p-4">
                <div className="text-indigo-400">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-gray-300">No Limits</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-2xl p-12 text-center max-w-3xl mx-auto backdrop-blur-sm border border-gray-700/50">
            <h2 className="text-3xl font-bold mb-6 text-white">Premium Plan</h2>
            <div className="text-5xl font-bold mb-6">
              <span className="text-white">$10</span>
              <span className="text-gray-400 text-2xl">/month</span>
            </div>
            <p className="text-gray-300 mb-8">Everything you need for AI-powered productivity</p>
            <a
              href="/subscribe"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 min-h-screen flex flex-col">
      <div className="flex gap-6 max-w-[2000px] mx-auto flex-1 relative">
        {/* Bouton pour afficher/masquer l'historique sur mobile */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800/50 backdrop-blur-sm rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <History className="w-6 h-6" />
        </button>

        {/* Sidebar avec animation */}
        <div className={`
          fixed md:relative w-80 h-[calc(100vh-2rem)] bg-gray-800/50 backdrop-blur-sm rounded-lg
          transition-all duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'left-4' : '-left-full'}
          md:left-0 md:transform-none
        `}>
          <div className="flex flex-col h-full p-4">
            <button
              onClick={handleNewChat}
              className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {chatHistory.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className={`block p-3 rounded-lg transition-colors ${
                    chatId === chat.id
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white mb-1 truncate">{chat.title}</h3>
                      <p className="text-sm text-gray-400 truncate">{chat.last_message}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400 ml-2 shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 max-w-4xl flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              AI Chat Assistant
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
              >
                {AVAILABLE_MODELS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <button
                onClick={downloadChatHistory}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors whitespace-nowrap"
              >
                <Download className="w-5 h-5 mr-2" />
                Export Chat
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4 h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
            <div className="max-w-full">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="text-sm opacity-75 whitespace-nowrap">
                        {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="ml-2 p-1 hover:bg-gray-600 rounded shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none break-words">
                      <MessageContent content={message.content} />
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center text-gray-400 mb-4">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Zone de saisie */}
          <div className="sticky bottom-0 pt-4 pb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message... (Shift + Enter for new line)"
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 backdrop-blur-sm text-blue-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700/50 min-w-0"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 shrink-0 ${
                  !input.trim() || isTyping
                    ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-700/90 hover:to-purple-700/90 text-white'
                }`}
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 