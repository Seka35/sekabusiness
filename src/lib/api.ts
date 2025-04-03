import { Message } from '../types';
import { supabase } from './supabase';

const getOpenRouterKey = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('key_name', 'openrouter_api_key')
    .single();
  
  if (error || !data) {
    throw new Error('Failed to get OpenRouter API key');
  }
  
  return data.key_value;
};

export const generateTitle = async (messages: Message[]): Promise<string> => {
  try {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
    const prompt = `En tant qu'assistant, analyse cette conversation et génère un titre court (maximum 5 mots) qui résume le thème principal ou le sujet abordé. N'inclus pas de guillemets ou de ponctuation dans le titre.

Conversation:
${userMessages}

Titre:`;

    const apiKey = await getOpenRouterKey();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://seka.business',
        'X-Title': 'Seka Business'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.1-24b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate title');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating title:', error);
    // En cas d'erreur, utiliser le premier message comme titre
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.slice(0, 30);
      return content + (content.length > 30 ? '...' : '');
    }
    return 'Nouvelle conversation';
  }
}; 