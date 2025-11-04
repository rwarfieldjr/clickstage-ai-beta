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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      abandoned_checkouts: {
        Row: {
          bundle_name: string | null
          bundle_photos: number | null
          bundle_price: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string
          email: string
          files: Json | null
          first_name: string
          id: string
          last_name: string
          marketing_consent: boolean | null
          phone_number: string
          photos_count: number | null
          session_id: string | null
          staging_style: string | null
          transactional_consent: boolean | null
          updated_at: string
        }
        Insert: {
          bundle_name?: string | null
          bundle_photos?: number | null
          bundle_price?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          email: string
          files?: Json | null
          first_name: string
          id?: string
          last_name: string
          marketing_consent?: boolean | null
          phone_number: string
          photos_count?: number | null
          session_id?: string | null
          staging_style?: string | null
          transactional_consent?: boolean | null
          updated_at?: string
        }
        Update: {
          bundle_name?: string | null
          bundle_photos?: number | null
          bundle_price?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          email?: string
          files?: Json | null
          first_name?: string
          id?: string
          last_name?: string
          marketing_consent?: boolean | null
          phone_number?: string
          photos_count?: number | null
          session_id?: string | null
          staging_style?: string | null
          transactional_consent?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      checkout_health_log: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          response_time_ms: number
          status: string
          success: boolean
          timestamp: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          response_time_ms: number
          status: string
          success: boolean
          timestamp?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number
          status?: string
          success?: boolean
          timestamp?: string
        }
        Relationships: []
      }
      checkout_rate_limits: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          ip_address: string
          window_start: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_address: string
          window_start?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_address?: string
          window_start?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          order_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          order_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          order_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      credits_transactions_old: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          order_id: string | null
          stripe_payment_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          stripe_payment_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          stripe_payment_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_events: {
        Row: {
          code: number | null
          created_at: string
          details: Json | null
          hostname: string | null
          id: string
          path: string | null
          subject: string
        }
        Insert: {
          code?: number | null
          created_at?: string
          details?: Json | null
          hostname?: string | null
          id?: string
          path?: string | null
          subject: string
        }
        Update: {
          code?: number | null
          created_at?: string
          details?: Json | null
          hostname?: string | null
          id?: string
          path?: string | null
          subject?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          archived: boolean
          created_at: string
          credits_used: number | null
          id: string
          order_number: string
          original_image_url: string
          processing_started: string | null
          staged_image_url: string | null
          staging_style: string
          status: string
          stripe_payment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          credits_used?: number | null
          id?: string
          order_number?: string
          original_image_url: string
          processing_started?: string | null
          staged_image_url?: string | null
          staging_style: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          credits_used?: number | null
          id?: string
          order_number?: string
          original_image_url?: string
          processing_started?: string | null
          staged_image_url?: string | null
          staging_style?: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credits_purchased: number
          id: string
          stripe_payment_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_purchased: number
          id?: string
          stripe_payment_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_purchased?: number
          id?: string
          stripe_payment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_stripe_sessions: {
        Row: {
          credits_added: number
          id: string
          payment_intent_id: string | null
          processed_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          credits_added: number
          id?: string
          payment_intent_id?: string | null
          processed_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          credits_added?: number
          id?: string
          payment_intent_id?: string | null
          processed_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          status: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stripe_event_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id: string
          payload?: Json | null
          processed_at?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          event: string
          id: string
          path: string | null
          payload: Json | null
          severity: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          path?: string | null
          payload?: Json | null
          severity: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          path?: string | null
          payload?: Json | null
          severity?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits_archived_20251104: {
        Row: {
          credits: number
          email: string
          id: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          credits?: number
          email: string
          id?: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          credits?: number
          email?: string
          id?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_checkout_lock: {
        Args: { p_email: string; p_lock_duration_seconds?: number }
        Returns: boolean
      }
      cleanup_abandoned_checkouts: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_system_logs: { Args: never; Returns: undefined }
      generate_order_number: { Args: never; Returns: string }
      get_auth_user_email: { Args: never; Returns: string }
      get_user_credit_balance: { Args: { p_user_id: string }; Returns: number }
      get_user_credit_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          balance_after: number
          created_at: string
          delta: number
          order_id: string
          reason: string
          transaction_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_checkout_lock: { Args: { p_email: string }; Returns: undefined }
      update_user_credits_atomic:
        | {
            Args: {
              p_delta: number
              p_email: string
              p_order_id?: string
              p_reason: string
              p_stripe_payment_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_delta: number
              p_order_id?: string
              p_reason: string
              p_user_id: string
            }
            Returns: {
              balance: number
              message: string
              ok: boolean
            }[]
          }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
