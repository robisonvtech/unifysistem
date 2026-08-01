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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          completion_tokens: number
          conversation_id: string | null
          cost_usd: number | null
          created_at: string
          error_message: string | null
          fallback_used: boolean
          id: string
          latency_ms: number
          model: string
          operation: string
          prompt_tokens: number
          provider: string
          status: string
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          fallback_used?: boolean
          id?: string
          latency_ms?: number
          model: string
          operation: string
          prompt_tokens?: number
          provider: string
          status?: string
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          fallback_used?: boolean
          id?: string
          latency_ms?: number
          model?: string
          operation?: string
          prompt_tokens?: number
          provider?: string
          status?: string
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          doc: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          doc?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          doc?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          accessories: Json
          battery_pct: number | null
          brand: string
          color: string | null
          condition: string | null
          created_at: string
          customer_id: string
          device_password: string | null
          id: string
          imei: string | null
          model: string
          notes: string | null
          owner_id: string
          photos: Json
          serial: string | null
          updated_at: string
        }
        Insert: {
          accessories?: Json
          battery_pct?: number | null
          brand: string
          color?: string | null
          condition?: string | null
          created_at?: string
          customer_id: string
          device_password?: string | null
          id?: string
          imei?: string | null
          model: string
          notes?: string | null
          owner_id: string
          photos?: Json
          serial?: string | null
          updated_at?: string
        }
        Update: {
          accessories?: Json
          battery_pct?: number | null
          brand?: string
          color?: string | null
          condition?: string | null
          created_at?: string
          customer_id?: string
          device_password?: string | null
          id?: string
          imei?: string | null
          model?: string
          notes?: string | null
          owner_id?: string
          photos?: Json
          serial?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          order_id: string | null
          owner_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          category?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          order_id?: string | null
          owner_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          order_id?: string | null
          owner_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_posts: {
        Row: {
          author_id: string
          body: string
          category: string | null
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          category?: string | null
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_parts: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          owner_id: string
          part_id: string | null
          qty: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_id: string
          owner_id: string
          part_id?: string | null
          qty?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          owner_id?: string
          part_id?: string | null
          qty?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_parts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          brand: string | null
          category: string | null
          cost_cents: number
          created_at: string
          id: string
          min_stock: number
          model: string | null
          name: string
          notes: string | null
          owner_id: string
          price_cents: number
          sku: string | null
          stock_qty: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_cents?: number
          created_at?: string
          id?: string
          min_stock?: number
          model?: string | null
          name: string
          notes?: string | null
          owner_id: string
          price_cents?: number
          sku?: string | null
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_cents?: number
          created_at?: string
          id?: string
          min_stock?: number
          model?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          price_cents?: number
          sku?: string | null
          stock_qty?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          skill_level: string
          subscription_status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          skill_level?: string
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          skill_level?: string
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          order_id: string
          owner_id: string
          payload: Json
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          order_id: string
          owner_id: string
          payload?: Json
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          order_id?: string
          owner_id?: string
          payload?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          created_at: string
          customer_id: string
          customer_notes: string | null
          delivered_at: string | null
          delivery_checklist: Json
          device_id: string
          diagnosis: string | null
          estimated_delivery: string | null
          id: string
          intake_checklist: Json
          internal_notes: string | null
          number: number
          owner_id: string
          parts: Json
          price_cents: number
          public_token: string
          reported_issue: string
          services: Json
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          warranty_days: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_checklist?: Json
          device_id: string
          diagnosis?: string | null
          estimated_delivery?: string | null
          id?: string
          intake_checklist?: Json
          internal_notes?: string | null
          number?: number
          owner_id: string
          parts?: Json
          price_cents?: number
          public_token?: string
          reported_issue: string
          services?: Json
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          warranty_days?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_checklist?: Json
          device_id?: string
          diagnosis?: string | null
          estimated_delivery?: string | null
          id?: string
          intake_checklist?: Json
          internal_notes?: string | null
          number?: number
          owner_id?: string
          parts?: Json
          price_cents?: number
          public_token?: string
          reported_issue?: string
          services?: Json
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          owner_id: string
          part_id: string
          qty: number
          reason: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          owner_id: string
          part_id: string
          qty: number
          reason?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          owner_id?: string
          part_id?: string
          qty?: number
          reason?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_tracking: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "awaiting_diagnosis"
        | "awaiting_approval"
        | "awaiting_part"
        | "in_repair"
        | "ready"
        | "delivered"
        | "warranty"
        | "cancelled"
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
      order_status: [
        "awaiting_diagnosis",
        "awaiting_approval",
        "awaiting_part",
        "in_repair",
        "ready",
        "delivered",
        "warranty",
        "cancelled",
      ],
    },
  },
} as const
