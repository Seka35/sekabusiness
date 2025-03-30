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

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
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

      const response = await sendMessage(updatedMessages);
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
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-6 text-blue-500" />
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Unlock the Power of AI Chat
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Experience seamless AI conversations with our advanced GPT-powered chat system
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Zap className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-300">Get instant responses to your questions with our optimized AI system</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Shield className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-300">Your conversations are encrypted and never shared with third parties</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Clock className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">24/7 Access</h3>
              <p className="text-gray-300">Get help whenever you need it with unlimited access to our AI chat</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Start Chatting Today</h2>
            <p className="text-xl mb-8">
              Subscribe now for only $10/month and get unlimited access to our AI chat system
            </p>
            <button
              onClick={() => window.location.href = 'https://buy.stripe.com/5kA3fl5SAeEA5J6bII'}
              className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors text-lg font-semibold"
            >
              <CreditCard className="w-6 h-6 mr-2" />
              Subscribe Now
            </button>
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
          <button
            onClick={downloadChatHistory}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Chat
          </button>
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