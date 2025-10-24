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
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          is_global: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          updated_at: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          updated_at?: string | null
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string | null
          group: string | null
          id: string
          label: string
          monday_column_id: string | null
          name: string
          options: string[] | null
          order: number | null
          placeholder: string | null
          required: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group?: string | null
          id?: string
          label: string
          monday_column_id?: string | null
          name: string
          options?: string[] | null
          order?: number | null
          placeholder?: string | null
          required?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group?: string | null
          id?: string
          label?: string
          monday_column_id?: string | null
          name?: string
          options?: string[] | null
          order?: number | null
          placeholder?: string | null
          required?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      monday_settings: {
        Row: {
          api_key_set: boolean | null
          auto_sync_enabled: boolean | null
          board_id: string | null
          column_mapping: Json | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key_set?: boolean | null
          auto_sync_enabled?: boolean | null
          board_id?: string | null
          column_mapping?: Json | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key_set?: boolean | null
          auto_sync_enabled?: boolean | null
          board_id?: string | null
          column_mapping?: Json | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      monday_sync_logs: {
        Row: {
          action: string
          board_id: string | null
          completed_at: string | null
          direction: string
          error_details: Json | null
          id: string
          item_id: string | null
          started_at: string | null
          success: boolean
          sync_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          board_id?: string | null
          completed_at?: string | null
          direction: string
          error_details?: Json | null
          id?: string
          item_id?: string | null
          started_at?: string | null
          success: boolean
          sync_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          board_id?: string | null
          completed_at?: string | null
          direction?: string
          error_details?: Json | null
          id?: string
          item_id?: string | null
          started_at?: string | null
          success?: boolean
          sync_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monday_sync_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          berth_number: string | null
          berth_type: string | null
          beverage_chip_issue_date: string | null
          beverage_chip_number: string | null
          birth_date: string | null
          boat_length: number | null
          boat_name: string | null
          boat_type: string | null
          boat_width: number | null
          city: string | null
          contact_public_in_ksvl: boolean | null
          created_at: string | null
          data_public_in_ksvl: boolean | null
          dinghy_berth_number: string | null
          email: string
          emergency_contact: string | null
          entry_date: string | null
          first_name: string | null
          id: string
          is_role_user: boolean | null
          is_test_data: boolean | null
          last_name: string | null
          member_number: string | null
          monday_item_id: string | null
          name: string | null
          notes: string | null
          oesv_number: string | null
          parking_permit_issue_date: string | null
          parking_permit_number: string | null
          phone: string | null
          postal_code: string | null
          status: string | null
          street_address: string | null
          updated_at: string | null
          vorstand_funktion: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          berth_number?: string | null
          berth_type?: string | null
          beverage_chip_issue_date?: string | null
          beverage_chip_number?: string | null
          birth_date?: string | null
          boat_length?: number | null
          boat_name?: string | null
          boat_type?: string | null
          boat_width?: number | null
          city?: string | null
          contact_public_in_ksvl?: boolean | null
          created_at?: string | null
          data_public_in_ksvl?: boolean | null
          dinghy_berth_number?: string | null
          email: string
          emergency_contact?: string | null
          entry_date?: string | null
          first_name?: string | null
          id: string
          is_role_user?: boolean | null
          is_test_data?: boolean | null
          last_name?: string | null
          member_number?: string | null
          monday_item_id?: string | null
          name?: string | null
          notes?: string | null
          oesv_number?: string | null
          parking_permit_issue_date?: string | null
          parking_permit_number?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          street_address?: string | null
          updated_at?: string | null
          vorstand_funktion?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          berth_number?: string | null
          berth_type?: string | null
          beverage_chip_issue_date?: string | null
          beverage_chip_number?: string | null
          birth_date?: string | null
          boat_length?: number | null
          boat_name?: string | null
          boat_type?: string | null
          boat_width?: number | null
          city?: string | null
          contact_public_in_ksvl?: boolean | null
          created_at?: string | null
          data_public_in_ksvl?: boolean | null
          dinghy_berth_number?: string | null
          email?: string
          emergency_contact?: string | null
          entry_date?: string | null
          first_name?: string | null
          id?: string
          is_role_user?: boolean | null
          is_test_data?: boolean | null
          last_name?: string | null
          member_number?: string | null
          monday_item_id?: string | null
          name?: string | null
          notes?: string | null
          oesv_number?: string | null
          parking_permit_issue_date?: string | null
          parking_permit_number?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          street_address?: string | null
          updated_at?: string | null
          vorstand_funktion?: string | null
        }
        Relationships: []
      }
      role_badge_settings: {
        Row: {
          bg_color: string
          created_at: string | null
          id: string
          role: string
          text_color: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string
          created_at?: string | null
          id?: string
          role: string
          text_color?: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string
          created_at?: string | null
          id?: string
          role?: string
          text_color?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      slots: {
        Row: {
          block_id: string | null
          crane_operator_id: string
          created_at: string | null
          date: string
          duration: number
          id: string
          is_booked: boolean | null
          is_mini_slot: boolean | null
          is_test_data: boolean | null
          member_id: string | null
          mini_slot_count: number | null
          notes: string | null
          start_minute: number | null
          time: string
          updated_at: string | null
        }
        Insert: {
          block_id?: string | null
          crane_operator_id: string
          created_at?: string | null
          date: string
          duration: number
          id?: string
          is_booked?: boolean | null
          is_mini_slot?: boolean | null
          is_test_data?: boolean | null
          member_id?: string | null
          mini_slot_count?: number | null
          notes?: string | null
          start_minute?: number | null
          time: string
          updated_at?: string | null
        }
        Update: {
          block_id?: string | null
          crane_operator_id?: string
          created_at?: string | null
          date?: string
          duration?: number
          id?: string
          is_booked?: boolean | null
          is_mini_slot?: boolean | null
          is_test_data?: boolean | null
          member_id?: string | null
          mini_slot_count?: number | null
          notes?: string | null
          start_minute?: number | null
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          hsl_value: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          hsl_value: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          hsl_value?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
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
      get_email_for_login: { Args: { username: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "kranfuehrer"
        | "mitglied"
        | "gastmitglied"
        | "vorstand"
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
      app_role: [
        "admin",
        "kranfuehrer",
        "mitglied",
        "gastmitglied",
        "vorstand",
      ],
    },
  },
} as const
