import OpenAI from 'openai';
import { supabase } from './supabase';

let openaiInstance: OpenAI | null = null;

async function getOpenAIKey(): Promise<string> {
  console.log('Fetching OpenAI API key from Supabase...');
  const { data, error } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('key_name', 'openai_api_key')
    .single();

  if (error) {
    console.error('Error fetching API key:', error);
    throw new Error('Failed to fetch OpenAI API key');
  }

  if (!data?.key_value) {
    console.error('API key is null or undefined in database');
    throw new Error('OpenAI API key not found in database');
  }

  console.log('Successfully retrieved API key from database');
  return data.key_value;
}

export async function getOpenAIInstance(): Promise<OpenAI> {
  if (!openaiInstance) {
    try {
      console.log('Creating new OpenAI instance...');
      const apiKey = await getOpenAIKey();
      openaiInstance = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      console.log('OpenAI instance created successfully');
    } catch (error) {
      console.error('Error creating OpenAI instance:', error);
      throw error;
    }
  }
  return openaiInstance;
}

export async function generateChatCompletion(messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>) {
  try {
    const openai = await getOpenAIInstance();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
}

export async function generateImage(prompt: string) {
  try {
    const openai = await getOpenAIInstance();
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    return response.data[0]?.url || null;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
} 