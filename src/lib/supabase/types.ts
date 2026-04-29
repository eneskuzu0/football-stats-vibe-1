// Matches Supabase's JSONB wire type exactly.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      api_cache: {
        Row: {
          key: string;
          value: Json;
          fetched_at: string;
          expires_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          fetched_at?: string;
          expires_at: string;
        };
        Update: {
          key?: string;
          value?: Json;
          fetched_at?: string;
          expires_at?: string;
        };
      };
    };
  };
}
