export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      comments: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          page_id: string;
          text_unit_id: string | null;
          type: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          page_id: string;
          text_unit_id?: string | null;
          type?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          page_id?: string;
          text_unit_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_character_id_page_id_fkey";
            columns: ["text_unit_id", "page_id"];
            isOneToOne: false;
            referencedRelation: "text_units";
            referencedColumns: ["id", "page_id"];
          },
          {
            foreignKeyName: "comments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          source_url: string | null;
          status: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          source_url?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          source_url?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      ocr_runs: {
        Row: {
          id: string;
          model_name: string | null;
          model_version: string | null;
          notes: string | null;
          page_id: string;
          raw_output_url: string | null;
          started_at: string;
          started_by: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          model_name?: string | null;
          model_version?: string | null;
          notes?: string | null;
          page_id: string;
          raw_output_url?: string | null;
          started_at?: string;
          started_by?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          model_name?: string | null;
          model_version?: string | null;
          notes?: string | null;
          page_id?: string;
          raw_output_url?: string | null;
          started_at?: string;
          started_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ocr_runs_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ocr_runs_started_by_fkey";
            columns: ["started_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      pages: {
        Row: {
          document_id: string;
          id: string;
          image_url: string | null;
          ocr_status: string;
          page_number: number;
        };
        Insert: {
          document_id: string;
          id?: string;
          image_url?: string | null;
          ocr_status?: string;
          page_number: number;
        };
        Update: {
          document_id?: string;
          id?: string;
          image_url?: string | null;
          ocr_status?: string;
          page_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pages_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      text_candidates: {
        Row: {
          id: string;
          rank: number;
          text: string;
          text_unit_id: string;
        };
        Insert: {
          id?: string;
          rank: number;
          text: string;
          text_unit_id: string;
        };
        Update: {
          id?: string;
          rank?: number;
          text?: string;
          text_unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_candidates_character_id_fkey";
            columns: ["text_unit_id"];
            isOneToOne: false;
            referencedRelation: "text_units";
            referencedColumns: ["id"];
          }
        ];
      };
      text_units: {
        Row: {
          bbox_x1: number | null;
          bbox_x2: number | null;
          bbox_x3: number | null;
          bbox_x4: number | null;
          bbox_y1: number | null;
          bbox_y2: number | null;
          bbox_y3: number | null;
          bbox_y4: number | null;
          id: string;
          layout_class: number | null;
          ocr_run_id: string;
          offset: number;
          page_id: string;
        };
        Insert: {
          bbox_x1?: number | null;
          bbox_x2?: number | null;
          bbox_x3?: number | null;
          bbox_x4?: number | null;
          bbox_y1?: number | null;
          bbox_y2?: number | null;
          bbox_y3?: number | null;
          bbox_y4?: number | null;
          id?: string;
          layout_class?: number | null;
          ocr_run_id: string;
          offset: number;
          page_id: string;
        };
        Update: {
          bbox_x1?: number | null;
          bbox_x2?: number | null;
          bbox_x3?: number | null;
          bbox_x4?: number | null;
          bbox_y1?: number | null;
          bbox_y2?: number | null;
          bbox_y3?: number | null;
          bbox_y4?: number | null;
          id?: string;
          layout_class?: number | null;
          ocr_run_id?: string;
          offset?: number;
          page_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "characters_ocr_run_id_page_id_fkey";
            columns: ["ocr_run_id", "page_id"];
            isOneToOne: false;
            referencedRelation: "ocr_runs";
            referencedColumns: ["id", "page_id"];
          },
          {
            foreignKeyName: "characters_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          }
        ];
      };
      text_versions: {
        Row: {
          confidence: number | null;
          correction_note: string | null;
          created_at: string;
          edited_by: string | null;
          id: string;
          ocr_run_id: string;
          source: string;
          text: string;
          text_unit_id: string;
        };
        Insert: {
          confidence?: number | null;
          correction_note?: string | null;
          created_at?: string;
          edited_by?: string | null;
          id?: string;
          ocr_run_id: string;
          source: string;
          text: string;
          text_unit_id: string;
        };
        Update: {
          confidence?: number | null;
          correction_note?: string | null;
          created_at?: string;
          edited_by?: string | null;
          id?: string;
          ocr_run_id?: string;
          source?: string;
          text?: string;
          text_unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_versions_character_id_ocr_run_id_fkey";
            columns: ["text_unit_id", "ocr_run_id"];
            isOneToOne: false;
            referencedRelation: "text_units";
            referencedColumns: ["id", "ocr_run_id"];
          },
          {
            foreignKeyName: "character_versions_edited_by_fkey";
            columns: ["edited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
          role: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string | null;
          role?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          role?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  ocr: {
    Tables: {
      comments: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          page_id: string;
          text_unit_id: string | null;
          type: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          page_id: string;
          text_unit_id?: string | null;
          type?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          page_id?: string;
          text_unit_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_character_id_page_id_fkey";
            columns: ["text_unit_id", "page_id"];
            isOneToOne: false;
            referencedRelation: "text_units";
            referencedColumns: ["id", "page_id"];
          },
          {
            foreignKeyName: "comments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          manifest_url: string | null;
          preprocessing: Json | null;
          reference: Json | null;
          slug: string;
          source_type: string;
          source_url: string | null;
          status: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          manifest_url?: string | null;
          preprocessing?: Json | null;
          reference?: Json | null;
          slug: string;
          source_type?: string;
          source_url?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          manifest_url?: string | null;
          preprocessing?: Json | null;
          reference?: Json | null;
          slug?: string;
          source_type?: string;
          source_url?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      ocr_runs: {
        Row: {
          id: string;
          model_name: string | null;
          model_version: string | null;
          notes: string | null;
          page_id: string;
          preprocessing: Json | null;
          raw_output_url: string | null;
          started_at: string;
          started_by: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          model_name?: string | null;
          model_version?: string | null;
          notes?: string | null;
          page_id: string;
          preprocessing?: Json | null;
          raw_output_url?: string | null;
          started_at?: string;
          started_by?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          model_name?: string | null;
          model_version?: string | null;
          notes?: string | null;
          page_id?: string;
          preprocessing?: Json | null;
          raw_output_url?: string | null;
          started_at?: string;
          started_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ocr_runs_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ocr_runs_started_by_fkey";
            columns: ["started_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      pages: {
        Row: {
          aligned_syllable_indices: Json | null;
          chars_confirmed_at: string | null;
          columns_confirmed_at: string | null;
          document_id: string;
          id: string;
          image_height: number | null;
          image_url: string | null;
          image_width: number | null;
          manual_order_locked: boolean;
          nnv_completed_at: string | null;
          ocr_status: string;
          page_number: number;
          quocngu_confirmed_at: string | null;
          skipped_at: string | null;
        };
        Insert: {
          aligned_syllable_indices?: Json | null;
          chars_confirmed_at?: string | null;
          columns_confirmed_at?: string | null;
          document_id: string;
          id?: string;
          image_height?: number | null;
          image_url?: string | null;
          image_width?: number | null;
          manual_order_locked?: boolean;
          nnv_completed_at?: string | null;
          ocr_status?: string;
          page_number: number;
          quocngu_confirmed_at?: string | null;
          skipped_at?: string | null;
        };
        Update: {
          aligned_syllable_indices?: Json | null;
          chars_confirmed_at?: string | null;
          columns_confirmed_at?: string | null;
          document_id?: string;
          id?: string;
          image_height?: number | null;
          image_url?: string | null;
          image_width?: number | null;
          manual_order_locked?: boolean;
          nnv_completed_at?: string | null;
          ocr_status?: string;
          page_number?: number;
          quocngu_confirmed_at?: string | null;
          skipped_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pages_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      text_candidates: {
        Row: {
          id: string;
          rank: number;
          source: string;
          text: string;
          text_unit_id: string;
        };
        Insert: {
          id?: string;
          rank: number;
          source?: string;
          text: string;
          text_unit_id: string;
        };
        Update: {
          id?: string;
          rank?: number;
          source?: string;
          text?: string;
          text_unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_candidates_character_id_fkey";
            columns: ["text_unit_id"];
            isOneToOne: false;
            referencedRelation: "text_units";
            referencedColumns: ["id"];
          }
        ];
      };
      text_units: {
        Row: {
          bbox_x1: number | null;
          bbox_x2: number | null;
          bbox_x3: number | null;
          bbox_x4: number | null;
          bbox_y1: number | null;
          bbox_y2: number | null;
          bbox_y3: number | null;
          bbox_y4: number | null;
          corrected_text: string | null;
          current_note: string | null;
          current_text: string | null;
          id: string;
          ids: Json | null;
          layout_class: number | null;
          nnv_processed_at: string | null;
          no_reading_form: boolean;
          ocr_confidence: number | null;
          ocr_run_id: string;
          ocr_text: string | null;
          offset: number;
          page_id: string;
          qn_uncertain: boolean;
          quocngu_flag: string | null;
          uncertain: boolean;
        };
        Insert: {
          bbox_x1?: number | null;
          bbox_x2?: number | null;
          bbox_x3?: number | null;
          bbox_x4?: number | null;
          bbox_y1?: number | null;
          bbox_y2?: number | null;
          bbox_y3?: number | null;
          bbox_y4?: number | null;
          corrected_text?: string | null;
          current_note?: string | null;
          current_text?: string | null;
          id?: string;
          ids?: Json | null;
          layout_class?: number | null;
          nnv_processed_at?: string | null;
          no_reading_form?: boolean;
          ocr_confidence?: number | null;
          ocr_run_id: string;
          ocr_text?: string | null;
          offset: number;
          page_id: string;
          qn_uncertain?: boolean;
          quocngu_flag?: string | null;
          uncertain?: boolean;
        };
        Update: {
          bbox_x1?: number | null;
          bbox_x2?: number | null;
          bbox_x3?: number | null;
          bbox_x4?: number | null;
          bbox_y1?: number | null;
          bbox_y2?: number | null;
          bbox_y3?: number | null;
          bbox_y4?: number | null;
          corrected_text?: string | null;
          current_note?: string | null;
          current_text?: string | null;
          id?: string;
          ids?: Json | null;
          layout_class?: number | null;
          nnv_processed_at?: string | null;
          no_reading_form?: boolean;
          ocr_confidence?: number | null;
          ocr_run_id?: string;
          ocr_text?: string | null;
          offset?: number;
          page_id?: string;
          qn_uncertain?: boolean;
          quocngu_flag?: string | null;
          uncertain?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "characters_ocr_run_id_page_id_fkey";
            columns: ["ocr_run_id", "page_id"];
            isOneToOne: false;
            referencedRelation: "ocr_runs";
            referencedColumns: ["id", "page_id"];
          },
          {
            foreignKeyName: "characters_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          }
        ];
      };
      text_versions: {
        Row: {
          confidence: number | null;
          correction_note: string | null;
          created_at: string;
          edited_by: string | null;
          id: string;
          ocr_run_id: string;
          source: string;
          text: string;
          text_unit_id: string;
        };
        Insert: {
          confidence?: number | null;
          correction_note?: string | null;
          created_at?: string;
          edited_by?: string | null;
          id?: string;
          ocr_run_id: string;
          source: string;
          text: string;
          text_unit_id: string;
        };
        Update: {
          confidence?: number | null;
          correction_note?: string | null;
          created_at?: string;
          edited_by?: string | null;
          id?: string;
          ocr_run_id?: string;
          source?: string;
          text?: string;
          text_unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_versions_character_id_ocr_run_id_fkey";
            columns: ["text_unit_id", "ocr_run_id"];
            isOneToOne: false;
            referencedRelation: "text_units";
            referencedColumns: ["id", "ocr_run_id"];
          },
          {
            foreignKeyName: "character_versions_edited_by_fkey";
            columns: ["edited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
          role: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string | null;
          role?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          role?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type OcrSchema = DatabaseWithoutInternals["ocr"];
export type OcrTableName = keyof OcrSchema["Tables"];
export type OcrTableRows<TableName extends OcrTableName> =
  OcrSchema["Tables"][TableName]["Row"];
export type OcrTableInserts<TableName extends OcrTableName> =
  OcrSchema["Tables"][TableName]["Insert"];
export type OcrTableUpdates<TableName extends OcrTableName> =
  OcrSchema["Tables"][TableName]["Update"];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
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
    : never = never
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
    : never = never
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
