import { generateChatCompletion } from './openai';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

const SYSTEM_PROMPT: Message = {
  role: 'system',
  content: 'You are Seka, a smart, professional, and witty virtual assistant designed to help subscribed users of this website. Always provide short, relevant, and accurate answers. Your tone should be friendly yet efficient, with a touch of humor when appropriate. Prioritize clarity and usefulness. You\'re here to make things easier, faster, and a little more fun for users who rely on your help.'
};

export async function sendMessage(messages: Message[]) {
  try {
    const messagesWithSystem = [
      SYSTEM_PROMPT,
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await generateChatCompletion(messagesWithSystem);
    return response;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to get response from ChatGPT');
  }
} 