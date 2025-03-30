import { supabase } from './supabase';

export type ApiKeyName = 'stripe_secret_key' | 'openai_api_key';

export async function getApiKey(keyName: ApiKeyName): Promise<string> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('key_name', keyName)
    .single();

  if (error) {
    console.error(`Error fetching ${keyName}:`, error);
    throw new Error(`Failed to fetch ${keyName}`);
  }

  if (!data?.key_value) {
    throw new Error(`${keyName} not found`);
  }

  return data.key_value;
} 