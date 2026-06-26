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
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          password: string
          username: string
        }[]
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
      activity_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_actor_id_fkey"
            columns: ["actor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_confirmed_by_fkey"
            columns: ["confirmed_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_po_id_fkey"
            columns: ["po_id"]
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_claims_po_item_id_fkey"
            columns: ["po_item_id"]
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
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_dimension_department_id_fkey"
            columns: ["dimension_department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_dimension_project_id_fkey"
            columns: ["dimension_project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_original: number
          amount_usd: number
          bank_account: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency"]
          exchange_rate: number
          id: string
          journal_entry_id: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string
          po_id: string | null
          receipt_object_key: string | null
          recorded_by: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount_original: number
          amount_usd?: number
          bank_account?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          exchange_rate?: number
          id?: string
          journal_entry_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string
          po_id?: string | null
          receipt_object_key?: string | null
          recorded_by?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount_original?: number
          amount_usd?: number
          bank_account?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          exchange_rate?: number
          id?: string
          journal_entry_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string
          po_id?: string | null
          receipt_object_key?: string | null
          recorded_by?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_po_id_fkey"
            columns: ["po_id"]
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
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
          telegram_link_expires_at: string | null
          telegram_link_token: string | null
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
          telegram_link_expires_at?: string | null
          telegram_link_token?: string | null
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
          telegram_link_expires_at?: string | null
          telegram_link_token?: string | null
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
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
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
          po_number: string
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
          po_number?: string
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
          po_number?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_pr_id_fkey"
            columns: ["pr_id"]
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
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
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_pr_id_fkey"
            columns: ["pr_id"]
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
          pr_number: string
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
          pr_number?: string
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
          pr_number?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_requester_id_fkey"
            columns: ["requester_id"]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          department: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          inventory_item_id: string
          note: string | null
          priority: Database["public"]["Enums"]["stock_priority"]
          qty: number
          requester_id: string
          status: Database["public"]["Enums"]["stock_request_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          inventory_item_id: string
          note?: string | null
          priority?: Database["public"]["Enums"]["stock_priority"]
          qty: number
          requester_id: string
          status?: Database["public"]["Enums"]["stock_request_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          inventory_item_id?: string
          note?: string | null
          priority?: Database["public"]["Enums"]["stock_priority"]
          qty?: number
          requester_id?: string
          status?: Database["public"]["Enums"]["stock_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_requests_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_requester_id_fkey"
            columns: ["requester_id"]
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
      payment_method: "bank_transfer" | "cash" | "card" | "mobile" | "other"
      payment_status: "unpaid" | "partial" | "paid"
      po_status: "open" | "partial" | "complete" | "cancelled"
      po_type: "online" | "physical"
      pr_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "converted"
      rate_source: "api" | "manual"
      stock_priority: "low" | "medium" | "high" | "urgent"
      stock_request_status: "pending" | "fulfilled" | "rejected" | "approved"
      user_role: "employee" | "manager" | "finance" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  pgbouncer: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["asset", "liability", "equity", "income", "expense"],
      claim_status: ["pending", "confirmed", "rejected"],
      currency: ["USD", "KHR", "CNY"],
      journal_source: ["po_payment", "manual_income", "manual"],
      movement_reason: ["claim", "stock_request", "adjustment"],
      payment_method: ["bank_transfer", "cash", "card", "mobile", "other"],
      payment_status: ["unpaid", "partial", "paid"],
      po_status: ["open", "partial", "complete", "cancelled"],
      po_type: ["online", "physical"],
      pr_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "converted",
      ],
      rate_source: ["api", "manual"],
      stock_priority: ["low", "medium", "high", "urgent"],
      stock_request_status: ["pending", "fulfilled", "rejected", "approved"],
      user_role: ["employee", "manager", "finance", "admin"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
