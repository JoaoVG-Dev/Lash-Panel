export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      anamnesis_public_tokens: {
        Row: {
          client_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          revoked_at: string | null;
          token: string;
          updated_at: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          token?: string;
          updated_at?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          token?: string;
          updated_at?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anamnesis_public_tokens_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          appointment_type: string;
          client_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          scheduled_at: string;
          status: string;
          technical_record_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          appointment_type?: string;
          client_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          scheduled_at: string;
          status?: string;
          technical_record_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          appointment_type?: string;
          client_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          scheduled_at?: string;
          status?: string;
          technical_record_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_technical_record_id_fkey";
            columns: ["technical_record_id"];
            isOneToOne: false;
            referencedRelation: "client_technical_records";
            referencedColumns: ["id"];
          },
        ];
      };
      client_anamnesis: {
        Row: {
          answers: Json;
          client_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          client_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          answers?: Json;
          client_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_anamnesis_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      client_technical_records: {
        Row: {
          application_date: string;
          client_id: string;
          created_at: string;
          curl: string | null;
          glue_product_id: string | null;
          glue_used: string | null;
          id: string;
          lash_model: string | null;
          maintenance_days: number;
          notes: string | null;
          procedure_type: string;
          sizes_used: string[];
          thickness: string | null;
          updated_at: string;
          user_id: string;
          volume: string | null;
        };
        Insert: {
          application_date: string;
          client_id: string;
          created_at?: string;
          curl?: string | null;
          glue_product_id?: string | null;
          glue_used?: string | null;
          id?: string;
          lash_model?: string | null;
          maintenance_days?: number;
          notes?: string | null;
          procedure_type: string;
          sizes_used?: string[];
          thickness?: string | null;
          updated_at?: string;
          user_id?: string;
          volume?: string | null;
        };
        Update: {
          application_date?: string;
          client_id?: string;
          created_at?: string;
          curl?: string | null;
          glue_product_id?: string | null;
          glue_used?: string | null;
          id?: string;
          lash_model?: string | null;
          maintenance_days?: number;
          notes?: string | null;
          procedure_type?: string;
          sizes_used?: string[];
          thickness?: string | null;
          updated_at?: string;
          user_id?: string;
          volume?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_technical_records_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_technical_records_glue_product_id_fkey";
            columns: ["glue_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          birth_date: string | null;
          created_at: string;
          id: string;
          instagram: string | null;
          name: string;
          notes: string | null;
          phone: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          id?: string;
          instagram?: string | null;
          name: string;
          notes?: string | null;
          phone: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          id?: string;
          instagram?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      product_brands: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          normalized_name: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          normalized_name: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          normalized_name?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          alert_quantity: number | null;
          brand: string | null;
          brand_id: string | null;
          category: string | null;
          created_at: string;
          expiration_date: string | null;
          id: string;
          name: string;
          notes: string | null;
          product_type: string;
          quantity: number;
          status: string;
          unit: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          alert_quantity?: number | null;
          brand?: string | null;
          brand_id?: string | null;
          category?: string | null;
          created_at?: string;
          expiration_date?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          product_type?: string;
          quantity?: number;
          status?: string;
          unit?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          alert_quantity?: number | null;
          brand?: string | null;
          brand_id?: string | null;
          category?: string | null;
          created_at?: string;
          expiration_date?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          product_type?: string;
          quantity?: number;
          status?: string;
          unit?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "product_brands";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          anamnesis_link_message: string;
          appointment_confirmation_message: string;
          business_description: string | null;
          business_name: string | null;
          cancellation_message: string;
          closing_time: string;
          created_at: string;
          default_whatsapp_message: string;
          id: string;
          instagram: string | null;
          maintenance_days_default: number;
          onboarding_completed_at: string | null;
          opening_time: string;
          professional_name: string | null;
          reminder_days_before: number;
          schedule_reminder_message: string;
          updated_at: string;
          user_id: string;
          whatsapp_phone: string | null;
          working_days: string[];
        };
        Insert: {
          anamnesis_link_message?: string;
          appointment_confirmation_message?: string;
          business_description?: string | null;
          business_name?: string | null;
          cancellation_message?: string;
          closing_time?: string;
          created_at?: string;
          default_whatsapp_message?: string;
          id?: string;
          instagram?: string | null;
          maintenance_days_default?: number;
          onboarding_completed_at?: string | null;
          opening_time?: string;
          professional_name?: string | null;
          reminder_days_before?: number;
          schedule_reminder_message?: string;
          updated_at?: string;
          user_id?: string;
          whatsapp_phone?: string | null;
          working_days?: string[];
        };
        Update: {
          anamnesis_link_message?: string;
          appointment_confirmation_message?: string;
          business_description?: string | null;
          business_name?: string | null;
          cancellation_message?: string;
          closing_time?: string;
          created_at?: string;
          default_whatsapp_message?: string;
          id?: string;
          instagram?: string | null;
          maintenance_days_default?: number;
          onboarding_completed_at?: string | null;
          opening_time?: string;
          professional_name?: string | null;
          reminder_days_before?: number;
          schedule_reminder_message?: string;
          updated_at?: string;
          user_id?: string;
          whatsapp_phone?: string | null;
          working_days?: string[];
        };
        Relationships: [];
      };
      whatsapp_message_logs: {
        Row: {
          appointment_id: string | null;
          client_id: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          message: string;
          message_body: string | null;
          message_type: string;
          opened_at: string | null;
          phone: string;
          provider_message_id: string | null;
          scheduled_for: string | null;
          sent_at: string | null;
          status: string;
          template_id: string | null;
          template_type: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          appointment_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          message: string;
          message_body?: string | null;
          message_type: string;
          opened_at?: string | null;
          phone: string;
          provider_message_id?: string | null;
          scheduled_for?: string | null;
          sent_at?: string | null;
          status?: string;
          template_id?: string | null;
          template_type?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          appointment_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          message?: string;
          message_body?: string | null;
          message_type?: string;
          opened_at?: string | null;
          phone?: string;
          provider_message_id?: string | null;
          scheduled_for?: string | null;
          sent_at?: string | null;
          status?: string;
          template_id?: string | null;
          template_type?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_logs_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_message_logs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_message_logs_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "whatsapp_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_templates: {
        Row: {
          created_at: string;
          id: string;
          is_default: boolean;
          message: string;
          message_type: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          message: string;
          message_type: string;
          name: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          message?: string;
          message_type?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_public_anamnesis_token: {
        Args: { p_token: string };
        Returns: {
          business_name: string;
          client_name: string;
          expires_at: string;
          professional_name: string;
          revoked_at: string;
          token_id: string;
          used_at: string;
        }[];
      };
      submit_public_anamnesis: {
        Args: { p_answers: Json; p_token: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
