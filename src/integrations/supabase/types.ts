export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      journal_notes: {
        Row: {
          created_at: string
          direction: string | null
          emotional_state: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          lessons_learned: string | null
          notes: string | null
          outcome: string | null
          pair: string
          phase: string | null
          pnl: number | null
          screenshot_url: string | null
          system_used: string | null
          trade_date: string
          trade_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction?: string | null
          emotional_state?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          outcome?: string | null
          pair: string
          phase?: string | null
          pnl?: number | null
          screenshot_url?: string | null
          system_used?: string | null
          trade_date: string
          trade_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string | null
          emotional_state?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          outcome?: string | null
          pair?: string
          phase?: string | null
          pnl?: number | null
          screenshot_url?: string | null
          system_used?: string | null
          trade_date?: string
          trade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_notes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      ohlc_data: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          pair: string
          timeframe: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          pair: string
          timeframe: string
          timestamp: string
          volume?: number | null
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          pair?: string
          timeframe?: string
          timestamp?: string
          volume?: number | null
        }
        Relationships: []
      }
      poi_zones: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pair: string
          price_high: number
          price_low: number
          status: string | null
          timeframe: string
          timestamp: string
          user_id: string | null
          zone_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pair: string
          price_high: number
          price_low: number
          status?: string | null
          timeframe: string
          timestamp: string
          user_id?: string | null
          zone_type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pair?: string
          price_high?: number
          price_low?: number
          status?: string | null
          timeframe?: string
          timestamp?: string
          user_id?: string | null
          zone_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dark_mode: boolean | null
          default_pair: string | null
          default_timeframe: string | null
          display_name: string | null
          email: string | null
          id: string
          notifications_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dark_mode?: boolean | null
          default_pair?: string | null
          default_timeframe?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dark_mode?: boolean | null
          default_pair?: string | null
          default_timeframe?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      structure_events: {
        Row: {
          created_at: string
          direction: string
          event_type: string
          id: string
          notes: string | null
          pair: string
          price_level: number
          timeframe: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          event_type: string
          id?: string
          notes?: string | null
          pair: string
          price_level: number
          timeframe: string
          timestamp: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          event_type?: string
          id?: string
          notes?: string | null
          pair?: string
          price_level?: number
          timeframe?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          created_at: string
          direction: string
          entry_price: number
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          id: string
          lot_size: number
          pair: string
          phase: string | null
          pnl: number | null
          pnl_pips: number | null
          status: string | null
          stop_loss: number | null
          system_used: string | null
          take_profit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          entry_price: number
          entry_time: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          lot_size: number
          pair: string
          phase?: string | null
          pnl?: number | null
          pnl_pips?: number | null
          status?: string | null
          stop_loss?: number | null
          system_used?: string | null
          take_profit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          entry_price?: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          lot_size?: number
          pair?: string
          phase?: string | null
          pnl?: number | null
          pnl_pips?: number | null
          status?: string | null
          stop_loss?: number | null
          system_used?: string | null
          take_profit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
