export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.15" }
  public: {
    Tables: {
      ibkr_settings: { Row: { created_at: string; default_account_id: string | null; gateway_base_url: string; updated_at: string; user_id: string }; Insert: { created_at?: string; default_account_id?: string | null; gateway_base_url?: string; updated_at?: string; user_id: string }; Update: { created_at?: string; default_account_id?: string | null; gateway_base_url?: string; updated_at?: string; user_id?: string }; Relationships: [] }
      kraken_credentials: { Row: { api_key_ciphertext: string; api_key_last4: string; created_at: string; private_key_ciphertext: string; trading_enabled: boolean; updated_at: string; user_id: string }; Insert: { api_key_ciphertext: string; api_key_last4: string; created_at?: string; private_key_ciphertext: string; trading_enabled?: boolean; updated_at?: string; user_id: string }; Update: { api_key_ciphertext?: string; api_key_last4?: string; created_at?: string; private_key_ciphertext?: string; trading_enabled?: boolean; updated_at?: string; user_id?: string }; Relationships: [] }
      mt5_credentials: { Row: { broker_server: string; connection_status: string; created_at: string; login: string; metaapi_account_id: string | null; password_ciphertext: string; region: string; trading_enabled: boolean; updated_at: string; user_id: string }; Insert: { broker_server: string; connection_status?: string; created_at?: string; login: string; metaapi_account_id?: string | null; password_ciphertext: string; region?: string; trading_enabled?: boolean; updated_at?: string; user_id: string }; Update: { broker_server?: string; connection_status?: string; created_at?: string; login?: string; metaapi_account_id?: string | null; password_ciphertext?: string; region?: string; trading_enabled?: boolean; updated_at?: string; user_id?: string }; Relationships: [] }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]
export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Row: infer R } ? R : never
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
export type CompositeTypes<T extends keyof DefaultSchema["CompositeTypes"]> = DefaultSchema["CompositeTypes"][T]
export const Constants = { public: { Enums: {} } } as const
