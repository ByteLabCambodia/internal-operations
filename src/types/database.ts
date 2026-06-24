export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount_usd: number
          category: string | null
          created_at: string
          department_id: string | null
          id: string
          period: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          amount_usd?: number
          category?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          period: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_usd?: number
          category?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          period?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency"]
          id: string
          rate_date: string
          rate_to_usd: number
          source: Database["public"]["Enums"]["rate_source"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: Database["public"]["Enums"]["currency"]
          id?: string
          rate_date: string
          rate_to_usd: number
          source?: Database["public"]["Enums"]["rate_source"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          id?: string
          rate_date?: string
          rate_to_usd?: number
          source?: Database["public"]["Enums"]["rate_source"]
          updated_at?: string
        }
        Relationships: []
      }
      inventory_claims: {
        Row: {
          claimed_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          inventory_item_id: string
          po_id: string | null
          po_item_id: string | null
          qty_claimed: number
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
        }
        Insert: {
          claimed_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          inventory_item_id: string
          po_id?: string | null
          po_item_id?: string | null
          qty_claimed: number
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Update: {
          claimed_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          inventory_item_id?: string
          po_id?: string | null
          po_item_id?: string | null
          qty_claimed?: number
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_claims_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          id: string
          name: string
          reorder_point: number
          reorder_qty: number
          sku: string
          stock_qty: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          name: string
          reorder_point?: number
          reorder_qty?: number
          sku: string
          stock_qty?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          reorder_point?: number
          reorder_qty?: number
          sku?: string
          stock_qty?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency"]
          entry_date: string
          exchange_rate: number
          id: string
          memo: string | null
          source: Database["public"]["Enums"]["journal_source"]
          source_ref: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          entry_date?: string
          exchange_rate?: number
          id?: string
          memo?: string | null
          source: Database["public"]["Enums"]["journal_source"]
          source_ref?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          entry_date?: string
          exchange_rate?: number
          id?: string
          memo?: string | null
          source?: Database["public"]["Enums"]["journal_source"]
          source_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit_usd: number
          debit_usd: number
          dimension_department_id: string | null
          dimension_project_id: string | null
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_usd?: number
          debit_usd?: number
          dimension_department_id?: string | null
          dimension_project_id?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_usd?: number
          debit_usd?: number
          dimension_department_id?: string | null
          dimension_project_id?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_dimension_department_id_fkey"
            columns: ["dimension_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_dimension_project_id_fkey"
            columns: ["dimension_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          event: string
          id: string
          payload: Json
          read: boolean
          telegram_sent: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          payload?: Json
          read?: boolean
          telegram_sent?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          payload?: Json
          read?: boolean
          telegram_sent?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_original: number
          amount_usd: number
          created_at: string
          currency: Database["public"]["Enums"]["currency"]
          exchange_rate: number
          id: string
          journal_entry_id: string | null
          paid_at: string
          po_id: string | null
          receipt_object_key: string | null
          recorded_by: string | null
          updated_at: string
        }
        Insert: {
          amount_original: number
          amount_usd?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          exchange_rate?: number
          id?: string
          journal_entry_id?: string | null
          paid_at?: string
          po_id?: string | null
          receipt_object_key?: string | null
          recorded_by?: string | null
          updated_at?: string
        }
        Update: {
          amount_original?: number
          amount_usd?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          exchange_rate?: number
          id?: string
          journal_entry_id?: string | null
          paid_at?: string
          po_id?: string | null
          receipt_object_key?: string | null
          recorded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          telegram_id: number | null
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          telegram_id?: number | null
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          telegram_id?: number | null
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string | null
          name: string
          po_id: string
          qty_claimed: number
          qty_ordered: number
          unit_price_original: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          name: string
          po_id: string
          qty_claimed?: number
          qty_ordered?: number
          unit_price_original?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          name?: string
          po_id?: string
          qty_claimed?: number
          qty_ordered?: number
          unit_price_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency"]
          department_id: string | null
          exchange_rate: number
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          pr_id: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["po_status"]
          supplier: string | null
          total_original: number
          total_usd: number
          type: Database["public"]["Enums"]["po_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          department_id?: string | null
          exchange_rate?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pr_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier?: string | null
          total_original?: number
          total_usd?: number
          type?: Database["public"]["Enums"]["po_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          department_id?: string | null
          exchange_rate?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pr_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier?: string | null
          total_original?: number
          total_usd?: number
          type?: Database["public"]["Enums"]["po_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          inventory_item_id: string | null
          name: string
          pr_id: string
          qty: number
          unit_price_original: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          name: string
          pr_id: string
          qty?: number
          unit_price_original?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          name?: string
          pr_id?: string
          qty?: number
          unit_price_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          approver_id: string | null
          auto_generated: boolean
          created_at: string
          currency: Database["public"]["Enums"]["currency"]
          decided_at: string | null
          department_id: string | null
          exchange_rate: number
          id: string
          note: string | null
          project_id: string | null
          requester_id: string
          status: Database["public"]["Enums"]["pr_status"]
          telegram_chat_id: number | null
          telegram_message_id: number | null
          total_original: number
          total_usd: number
          updated_at: string
        }
        Insert: {
          approver_id?: string | null
          auto_generated?: boolean
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          decided_at?: string | null
          department_id?: string | null
          exchange_rate?: number
          id?: string
          note?: string | null
          project_id?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["pr_status"]
          telegram_chat_id?: number | null
          telegram_message_id?: number | null
          total_original?: number
          total_usd?: number
          updated_at?: string
        }
        Update: {
          approver_id?: string | null
          auto_generated?: boolean
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          decided_at?: string | null
          department_id?: string | null
          exchange_rate?: number
          id?: string
          note?: string | null
          project_id?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["pr_status"]
          telegram_chat_id?: number | null
          telegram_message_id?: number | null
          total_original?: number
          total_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          delta: number
          id: string
          inventory_item_id: string
          reason: Database["public"]["Enums"]["movement_reason"]
          ref_id: string | null
          ref_table: string | null
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          delta: number
          id?: string
          inventory_item_id: string
          reason: Database["public"]["Enums"]["movement_reason"]
          ref_id?: string | null
          ref_table?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          delta?: number
          id?: string
          inventory_item_id?: string
          reason?: Database["public"]["Enums"]["movement_reason"]
          ref_id?: string | null
          ref_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_requests: {
        Row: {
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          inventory_item_id: string
          note: string | null
          qty: number
          requester_id: string
          status: Database["public"]["Enums"]["stock_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          inventory_item_id: string
          note?: string | null
          qty: number
          requester_id: string
          status?: Database["public"]["Enums"]["stock_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          inventory_item_id?: string
          note?: string | null
          qty?: number
          requester_id?: string
          status?: Database["public"]["Enums"]["stock_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_updates: {
        Row: {
          processed_at: string
          update_id: number
        }
        Insert: {
          processed_at?: string
          update_id: number
        }
        Update: {
          processed_at?: string
          update_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: { p_delta: number; p_item: string; p_note?: string }
        Returns: number
      }
      has_role: {
        Args: { roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "income" | "expense"
      claim_status: "pending" | "confirmed" | "rejected"
      currency: "USD" | "KHR" | "CNY"
      journal_source: "po_payment" | "manual_income" | "manual"
      movement_reason: "claim" | "stock_request" | "adjustment"
      payment_status: "unpaid" | "partial" | "paid"
      po_status: "open" | "partial" | "complete" | "cancelled"
      po_type: "online" | "physical"
      pr_status: "draft" | "pending" | "approved" | "rejected" | "cancelled"
      rate_source: "api" | "manual"
      stock_request_status: "pending" | "fulfilled" | "rejected"
      user_role: "employee" | "manager" | "finance" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["asset", "liability", "equity", "income", "expense"],
      claim_status: ["pending", "confirmed", "rejected"],
      currency: ["USD", "KHR", "CNY"],
      journal_source: ["po_payment", "manual_income", "manual"],
      movement_reason: ["claim", "stock_request", "adjustment"],
      payment_status: ["unpaid", "partial", "paid"],
      po_status: ["open", "partial", "complete", "cancelled"],
      po_type: ["online", "physical"],
      pr_status: ["draft", "pending", "approved", "rejected", "cancelled"],
      rate_source: ["api", "manual"],
      stock_request_status: ["pending", "fulfilled", "rejected"],
      user_role: ["employee", "manager", "finance", "admin"],
    },
  },
} as const

