import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id: string;
  user_id: string;
  messages: string;
  created_at: string;
  email: string;
}

interface ParsedMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface MessageInput {
  role?: string;
  content?: string;
  timestamp?: string;
}

interface ChatHistoryProps {
  chatHistory: ChatMessage[];
  setChatHistory: (chats: ChatMessage[]) => void;
  isLoading: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ chatHistory, setChatHistory, isLoading }) => {
  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  const parseMessages = (messagesStr: string | any): ParsedMessage[] => {
    try {
      // If the input is already an array of messages
      if (Array.isArray(messagesStr)) {
        return messagesStr.map((msg: MessageInput) => ({
          role: msg.role || 'user',
          content: msg.content || '',
          timestamp: msg.timestamp || new Date().toISOString()
        }));
      }

      // Try to parse as JSON if it's a string
      if (typeof messagesStr === 'string') {
        try {
          const parsed = JSON.parse(messagesStr);
          
          // If parsed result is an array
          if (Array.isArray(parsed)) {
            return parsed.map((msg: MessageInput) => ({
              role: msg.role || 'user',
              content: msg.content || '',
              timestamp: msg.timestamp || new Date().toISOString()
            }));
          }
          
          // If parsed result is a single message object
          if (parsed.role && parsed.content) {
            return [{
              role: parsed.role,
              content: parsed.content,
              timestamp: parsed.timestamp || new Date().toISOString()
            }];
          }
        } catch (e) {
          // If JSON parsing fails, treat the entire string as a single message
          return [{
            role: 'user',
            content: messagesStr,
            timestamp: new Date().toISOString()
          }];
        }
      }

      // If it's an object but not an array
      if (typeof messagesStr === 'object' && messagesStr !== null) {
        const messages = Object.values(messagesStr) as MessageInput[];
        if (messages.length > 0) {
          return messages.map(msg => ({
            role: msg.role || 'user',
            content: msg.content || JSON.stringify(msg),
            timestamp: msg.timestamp || new Date().toISOString()
          }));
        }
      }

      console.error('Could not parse messages:', messagesStr);
      return [{
        role: 'system',
        content: 'Error: Could not parse message content',
        timestamp: new Date().toISOString()
      }];
    } catch (e) {
      console.error('Error parsing messages:', e);
      console.log('Original message data:', messagesStr);
      return [{
        role: 'system',
        content: 'Error: Could not parse message content',
        timestamp: new Date().toISOString()
      }];
    }
  };

  const getLastMessage = (messagesStr: string): string => {
    try {
      const messages = parseMessages(messagesStr);
      if (messages.length === 0) return 'No message content';
      
      const lastMessage = messages[messages.length - 1];
      const content = typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : JSON.stringify(lastMessage.content);
      return content.length > 100 ? content.slice(0, 100) + '...' : content;
    } catch (e) {
      console.error('Error getting last message:', e);
      return 'Error displaying message';
    }
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

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Chat History</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {chatHistory.map(chat => (
            <div 
              key={chat.id} 
              className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => {
                    setSelectedChat(chat);
                    setShowChatModal(true);
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-blue-400">{chat.email}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(chat.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {getLastMessage(chat.messages)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400 ml-4"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Detail Modal */}
      {showChatModal && selectedChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Conversation with {selectedChat.email}
                </h3>
                <p className="text-sm text-gray-400">
                  {new Date(selectedChat.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowChatModal(false);
                  setSelectedChat(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              {parseMessages(selectedChat.messages).map((message, index) => {
                // Skip empty messages
                if (!message.content) return null;

                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500/20 ml-auto' 
                        : 'bg-gray-700/50'
                    } max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">
                        {message.role === 'user' ? selectedChat.email : 'Assistant'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-gray-200 whitespace-pre-wrap">
                      {typeof message.content === 'string' 
                        ? message.content 
                        : JSON.stringify(message.content, null, 2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory; 