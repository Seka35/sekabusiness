export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'active' | 'inactive' | 'trialing'
          current_period_end: string
          created_at: string
          email: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status: 'active' | 'inactive' | 'trialing'
          current_period_end: string
          created_at?: string
          email?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'active' | 'inactive' | 'trialing'
          current_period_end?: string
          created_at?: string
          email?: string | null
        }
      }
      api_keys: {
        Row: {
          id: string
          key_name: string
          key_value: string
        }
        Insert: {
          id?: string
          key_name: string
          key_value: string
        }
        Update: {
          id?: string
          key_name?: string
          key_value?: string
        }
      }
    }
  }
} 