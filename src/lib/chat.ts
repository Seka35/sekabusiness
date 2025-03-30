import { generateChatCompletion } from './openai';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export async function sendMessage(messages: Message[]) {
  try {
    const response = await generateChatCompletion(
      messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    );

    return response;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to get response from ChatGPT');
  }
} 