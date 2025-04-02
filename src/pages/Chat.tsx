import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, CreditCard, Zap, Shield, Clock, Send, Copy, Check, Loader2, Download } from 'lucide-react';
import { sendMessage, Message } from '../lib/chat';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiryDate: Date | null;
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3' },
  { id: 'google/gemini-2.5-pro-exp-03-25:free', name: 'Gemini Pro 2.5' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1' },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen2.5 VL' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3' },
  { id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free', name: 'Dolphin 3.0 R1' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3' },
  { id: 'open-r1/olympiccoder-32b:free', name: 'OlympicCoder' },
  { id: 'openchat/openchat-7b:free', name: 'OpenChat 3.5' },
  { id: 'rekaai/reka-flash-3:free', name: 'Reka Flash 3' },
  { id: 'gryphe/mythomax-l2-13b:free', name: 'MythoMax' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' }
] as const;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<typeof AVAILABLE_MODELS[number]['id']>('gpt-4o-mini');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    expiryDate: null,
  });
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChatHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('chat_history')
          .select('messages')
          .eq('user_id', session.user.id)
          .single();
        
        if (data?.messages) {
          setMessages(data.messages);
        }
      }
    };

    loadChatHistory();
  }, []);

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

  const saveChatHistory = async (updatedMessages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('chat_history')
        .upsert({ 
          user_id: session.user.id, 
          messages: updatedMessages 
        });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !subscriptionStatus.isSubscribed) return;

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
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            AI Chat Assistant
          </h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <button
              onClick={downloadChatHistory}
              className="flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Chat
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4 h-[60vh] overflow-y-auto">
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
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm opacity-75">
                    {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="ml-2 p-1 hover:bg-gray-600 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="prose prose-invert max-w-none">
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
        
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type your message... (Shift + Enter for new line)"
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              !input.trim() || isTyping
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
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
  );
};

export default Chat; 