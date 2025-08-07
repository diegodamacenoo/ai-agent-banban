export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      _backup_alert_digest: {
        Row: {
          alert_ts: string | null
          created_at: string | null
          description: string | null
          id: string | null
          resolved: boolean | null
          severity: string | null
          title: string | null
        }
        Insert: {
          alert_ts?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          resolved?: boolean | null
          severity?: string | null
          title?: string | null
        }
        Update: {
          alert_ts?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          resolved?: boolean | null
          severity?: string | null
          title?: string | null
        }
        Relationships: []
      }
      _backup_alert_thresholds: {
        Row: {
          alert_type: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          is_active: boolean | null
          organization_id: string | null
          threshold_config: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alert_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_active?: boolean | null
          organization_id?: string | null
          threshold_config?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alert_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_active?: boolean | null
          organization_id?: string | null
          threshold_config?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      _backup_core_document_items: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string | null
          item_seq: number | null
          qty: number | null
          qty_expected: number | null
          qty_scanned_diff: number | null
          qty_scanned_ok: number | null
          unit_price: number | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string | null
          item_seq?: number | null
          qty?: number | null
          qty_expected?: number | null
          qty_scanned_diff?: number | null
          qty_scanned_ok?: number | null
          unit_price?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string | null
          item_seq?: number | null
          qty?: number | null
          qty_expected?: number | null
          qty_scanned_diff?: number | null
          qty_scanned_ok?: number | null
          unit_price?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      _backup_core_documents: {
        Row: {
          created_at: string | null
          dest_location_id: string | null
          doc_type: Database["public"]["Enums"]["doc_type_enum"] | null
          external_id: string | null
          id: string | null
          issue_date: string | null
          order_id: string | null
          origin_location_id: string | null
          status: Database["public"]["Enums"]["doc_status_enum"] | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dest_location_id?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type_enum"] | null
          external_id?: string | null
          id?: string | null
          issue_date?: string | null
          order_id?: string | null
          origin_location_id?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"] | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dest_location_id?: string | null
          doc_type?: Database["public"]["Enums"]["doc_type_enum"] | null
          external_id?: string | null
          id?: string | null
          issue_date?: string | null
          order_id?: string | null
          origin_location_id?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"] | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_core_events: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["entity_type_enum"] | null
          event_code: Database["public"]["Enums"]["event_code_enum"] | null
          event_ts: string | null
          id: string | null
          payload: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type_enum"] | null
          event_code?: Database["public"]["Enums"]["event_code_enum"] | null
          event_ts?: string | null
          id?: string | null
          payload?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type_enum"] | null
          event_code?: Database["public"]["Enums"]["event_code_enum"] | null
          event_ts?: string | null
          id?: string | null
          payload?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_core_inventory_snapshots: {
        Row: {
          created_at: string | null
          id: string | null
          last_update_ts: string | null
          location_id: string | null
          product_id: string | null
          qty_on_hand: number | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          last_update_ts?: string | null
          location_id?: string | null
          product_id?: string | null
          qty_on_hand?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          last_update_ts?: string | null
          location_id?: string | null
          product_id?: string | null
          qty_on_hand?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      _backup_core_movements: {
        Row: {
          created_at: string | null
          id: string | null
          location_id: string | null
          movement_ts: string | null
          movement_type:
            | Database["public"]["Enums"]["movement_type_enum"]
            | null
          product_id: string | null
          qty_change: number | null
          reference_id: string | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          location_id?: string | null
          movement_ts?: string | null
          movement_type?:
            | Database["public"]["Enums"]["movement_type_enum"]
            | null
          product_id?: string | null
          qty_change?: number | null
          reference_id?: string | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          location_id?: string | null
          movement_ts?: string | null
          movement_type?:
            | Database["public"]["Enums"]["movement_type_enum"]
            | null
          product_id?: string | null
          qty_change?: number | null
          reference_id?: string | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      _backup_core_order_items: {
        Row: {
          created_at: string | null
          id: string | null
          item_seq: number | null
          notes: string | null
          order_id: string | null
          qty_ordered: number | null
          unit_cost_est: number | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          item_seq?: number | null
          notes?: string | null
          order_id?: string | null
          qty_ordered?: number | null
          unit_cost_est?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          item_seq?: number | null
          notes?: string | null
          order_id?: string | null
          qty_ordered?: number | null
          unit_cost_est?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      _backup_core_orders: {
        Row: {
          created_at: string | null
          dest_location_id: string | null
          external_id: string | null
          id: string | null
          issue_timestamp: string | null
          order_type: Database["public"]["Enums"]["order_type_enum"] | null
          origin_location_id: string | null
          status: Database["public"]["Enums"]["order_status_enum"] | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dest_location_id?: string | null
          external_id?: string | null
          id?: string | null
          issue_timestamp?: string | null
          order_type?: Database["public"]["Enums"]["order_type_enum"] | null
          origin_location_id?: string | null
          status?: Database["public"]["Enums"]["order_status_enum"] | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dest_location_id?: string | null
          external_id?: string | null
          id?: string | null
          issue_timestamp?: string | null
          order_type?: Database["public"]["Enums"]["order_type_enum"] | null
          origin_location_id?: string | null
          status?: Database["public"]["Enums"]["order_status_enum"] | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_core_product_pricing: {
        Row: {
          change_reason: string | null
          cost_price: number | null
          created_at: string | null
          id: string | null
          margin_percentage: number | null
          markup_percentage: number | null
          price_type: string | null
          price_value: number | null
          product_id: string | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
          variant_id: string | null
        }
        Insert: {
          change_reason?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string | null
          margin_percentage?: number | null
          markup_percentage?: number | null
          price_type?: string | null
          price_value?: number | null
          product_id?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          variant_id?: string | null
        }
        Update: {
          change_reason?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string | null
          margin_percentage?: number | null
          markup_percentage?: number | null
          price_type?: string | null
          price_value?: number | null
          product_id?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      _backup_security_alert_settings: {
        Row: {
          alert_failed_attempts: boolean | null
          alert_new_device: boolean | null
          alert_user_deletion: boolean | null
          created_at: string | null
          failed_attempts_threshold: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_failed_attempts?: boolean | null
          alert_new_device?: boolean | null
          alert_user_deletion?: boolean | null
          created_at?: string | null
          failed_attempts_threshold?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_failed_attempts?: boolean | null
          alert_new_device?: boolean | null
          alert_user_deletion?: boolean | null
          created_at?: string | null
          failed_attempts_threshold?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      _backup_tenant_dashboard_widgets: {
        Row: {
          created_at: string | null
          custom_params: Json | null
          display_order: number | null
          enabled: boolean | null
          height: number | null
          id: string | null
          position_x: number | null
          position_y: number | null
          tenant_id: string | null
          updated_at: string | null
          widget_id: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          custom_params?: Json | null
          display_order?: number | null
          enabled?: boolean | null
          height?: number | null
          id?: string | null
          position_x?: number | null
          position_y?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          widget_id?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          custom_params?: Json | null
          display_order?: number | null
          enabled?: boolean | null
          height?: number | null
          id?: string | null
          position_x?: number | null
          position_y?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          widget_id?: string | null
          width?: number | null
        }
        Relationships: []
      }
      _backup_tenant_module_settings: {
        Row: {
          created_at: string | null
          id: string | null
          module_id: string | null
          organization_id: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          module_id?: string | null
          organization_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          module_id?: string | null
          organization_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _backup_tenant_modules: {
        Row: {
          activated_at: string | null
          approval_requested_at: string | null
          approved_at: string | null
          approved_by: string | null
          auto_upgrade: boolean | null
          billing_enabled: boolean | null
          current_usage: Json | null
          error_details: Json | null
          health_status: string | null
          is_visible: boolean | null
          last_health_check: string | null
          last_status_change: string | null
          locked_version: boolean | null
          module_id: string | null
          operational_status:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id: string | null
          provisioning_completed_at: string | null
          provisioning_started_at: string | null
          retry_count: number | null
          status_change_reason: string | null
          updated_at: string | null
          usage_limits: Json | null
          version_id: string | null
        }
        Insert: {
          activated_at?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_upgrade?: boolean | null
          billing_enabled?: boolean | null
          current_usage?: Json | null
          error_details?: Json | null
          health_status?: string | null
          is_visible?: boolean | null
          last_health_check?: string | null
          last_status_change?: string | null
          locked_version?: boolean | null
          module_id?: string | null
          operational_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id?: string | null
          provisioning_completed_at?: string | null
          provisioning_started_at?: string | null
          retry_count?: number | null
          status_change_reason?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
          version_id?: string | null
        }
        Update: {
          activated_at?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_upgrade?: boolean | null
          billing_enabled?: boolean | null
          current_usage?: Json | null
          error_details?: Json | null
          health_status?: string | null
          is_visible?: boolean | null
          last_health_check?: string | null
          last_status_change?: string | null
          locked_version?: boolean | null
          module_id?: string | null
          operational_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id?: string | null
          provisioning_completed_at?: string | null
          provisioning_started_at?: string | null
          retry_count?: number | null
          status_change_reason?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
          version_id?: string | null
        }
        Relationships: []
      }
      _backup_tenant_modules_before_refactor: {
        Row: {
          activated_at: string | null
          approval_requested_at: string | null
          approved_at: string | null
          approved_by: string | null
          auto_upgrade: boolean | null
          billing_enabled: boolean | null
          current_usage: Json | null
          custom_config: Json | null
          error_details: Json | null
          health_status: string | null
          implementation_id: string | null
          installed_at: string | null
          is_visible: boolean | null
          last_accessed_at: string | null
          last_health_check: string | null
          last_status_change: string | null
          locked_version: boolean | null
          module_id: string | null
          operational_status:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id: string | null
          provisioning_completed_at: string | null
          provisioning_started_at: string | null
          retry_count: number | null
          status_change_reason: string | null
          updated_at: string | null
          usage_limits: Json | null
          version_id: string | null
        }
        Insert: {
          activated_at?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_upgrade?: boolean | null
          billing_enabled?: boolean | null
          current_usage?: Json | null
          custom_config?: Json | null
          error_details?: Json | null
          health_status?: string | null
          implementation_id?: string | null
          installed_at?: string | null
          is_visible?: boolean | null
          last_accessed_at?: string | null
          last_health_check?: string | null
          last_status_change?: string | null
          locked_version?: boolean | null
          module_id?: string | null
          operational_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id?: string | null
          provisioning_completed_at?: string | null
          provisioning_started_at?: string | null
          retry_count?: number | null
          status_change_reason?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
          version_id?: string | null
        }
        Update: {
          activated_at?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_upgrade?: boolean | null
          billing_enabled?: boolean | null
          current_usage?: Json | null
          custom_config?: Json | null
          error_details?: Json | null
          health_status?: string | null
          implementation_id?: string | null
          installed_at?: string | null
          is_visible?: boolean | null
          last_accessed_at?: string | null
          last_health_check?: string | null
          last_status_change?: string | null
          locked_version?: boolean | null
          module_id?: string | null
          operational_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id?: string | null
          provisioning_completed_at?: string | null
          provisioning_started_at?: string | null
          retry_count?: number | null
          status_change_reason?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
          version_id?: string | null
        }
        Relationships: []
      }
      alert_digest: {
        Row: {
          alert_ts: string
          created_at: string | null
          description: string
          id: string
          resolved: boolean | null
          severity: string
          title: string
        }
        Insert: {
          alert_ts?: string
          created_at?: string | null
          description: string
          id?: string
          resolved?: boolean | null
          severity: string
          title: string
        }
        Update: {
          alert_ts?: string
          created_at?: string | null
          description?: string
          id?: string
          resolved?: boolean | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      alert_thresholds: {
        Row: {
          alert_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_id: string
          threshold_config: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          threshold_config: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          threshold_config?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_thresholds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "alert_thresholds_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      api_key_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown | null
          method: string
          organization_id: string
          processing_time_ms: number | null
          response_status: number
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: unknown | null
          method: string
          organization_id: string
          processing_time_ms?: number | null
          response_status: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          method?: string
          organization_id?: string
          processing_time_ms?: number | null
          response_status?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string
          organization_id: string
          permissions: Database["public"]["Enums"]["api_key_permission"][]
          prefix: string
          rate_limit: number | null
          revoked_at: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name: string
          organization_id: string
          permissions: Database["public"]["Enums"]["api_key_permission"][]
          prefix: string
          rate_limit?: number | null
          revoked_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          permissions?: Database["public"]["Enums"]["api_key_permission"][]
          prefix?: string
          rate_limit?: number | null
          revoked_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_timestamp: string | null
          action_type: string
          actor_user_id: string
          created_at: string | null
          details: Json | null
          id: number
          ip_address: string | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_timestamp?: string | null
          action_type: string
          actor_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: never
          ip_address?: string | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_timestamp?: string | null
          action_type?: string
          actor_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: never
          ip_address?: string | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      base_modules: {
        Row: {
          archived_at: string | null
          category: string
          config_schema: Json | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          dependencies: string | null
          description: string | null
          exclusive_tenant_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          permissions_required: string[] | null
          route_pattern: string | null
          slug: string
          status: string | null
          supports_multi_tenant: boolean | null
          tags: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          category: string
          config_schema?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dependencies?: string | null
          description?: string | null
          exclusive_tenant_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          permissions_required?: string[] | null
          route_pattern?: string | null
          slug: string
          status?: string | null
          supports_multi_tenant?: boolean | null
          tags?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: string
          config_schema?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dependencies?: string | null
          description?: string | null
          exclusive_tenant_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          permissions_required?: string[] | null
          route_pattern?: string | null
          slug?: string
          status?: string | null
          supports_multi_tenant?: boolean | null
          tags?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_modules_exclusive_tenant_id_fkey"
            columns: ["exclusive_tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_modules_exclusive_tenant_id_fkey"
            columns: ["exclusive_tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      business_entities: {
        Row: {
          business_domain: string
          code: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          description: string | null
          entity_type: string
          id: string
          metadata: Json
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          business_domain?: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          business_domain?: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          description?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      business_relationships: {
        Row: {
          business_domain: string
          created_at: string
          created_by: string | null
          custom_fields: Json
          id: string
          is_active: boolean
          metadata: Json
          organization_id: string
          relationship_type: string
          source_entity_id: string
          target_entity_id: string
          updated_at: string
        }
        Insert: {
          business_domain?: string
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          organization_id: string
          relationship_type: string
          source_entity_id: string
          target_entity_id: string
          updated_at?: string
        }
        Update: {
          business_domain?: string
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          organization_id?: string
          relationship_type?: string
          source_entity_id?: string
          target_entity_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_source_entity"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_target_entity"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      business_transaction_items: {
        Row: {
          created_at: string
          custom_fields: Json
          entity_id: string | null
          id: string
          item_sequence: number
          metadata: Json
          organization_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_fields?: Json
          entity_id?: string | null
          id?: string
          item_sequence: number
          metadata?: Json
          organization_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_fields?: Json
          entity_id?: string | null
          id?: string
          item_sequence?: number
          metadata?: Json
          organization_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_transaction_items_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_transaction_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_transaction_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "business_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "business_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_transactions: {
        Row: {
          business_domain: string
          created_at: string
          created_by: string | null
          custom_fields: Json
          id: string
          metadata: Json
          organization_id: string
          reference_code: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_number: string | null
          transaction_type: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          business_domain?: string
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          id?: string
          metadata?: Json
          organization_id: string
          reference_code?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_number?: string | null
          transaction_type: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          business_domain?: string
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          id?: string
          metadata?: Json
          organization_id?: string
          reference_code?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_number?: string | null
          transaction_type?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      custom_modules: {
        Row: {
          api_endpoints: Json | null
          configuration: Json | null
          created_at: string | null
          custom_code_path: string | null
          deployed_at: string | null
          id: string
          is_active: boolean | null
          module_name: string
          module_version: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoints?: Json | null
          configuration?: Json | null
          created_at?: string | null
          custom_code_path?: string | null
          deployed_at?: string | null
          id?: string
          is_active?: boolean | null
          module_name: string
          module_version?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoints?: Json | null
          configuration?: Json | null
          created_at?: string | null
          custom_code_path?: string | null
          deployed_at?: string | null
          id?: string
          is_active?: boolean | null
          module_name?: string
          module_version?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          cover_days: number
          created_at: string | null
          day: string
          margin: number
          sales: number
          sell_through: number
          updated_at: string | null
        }
        Insert: {
          cover_days?: number
          created_at?: string | null
          day: string
          margin?: number
          sales?: number
          sell_through?: number
          updated_at?: string | null
        }
        Update: {
          cover_days?: number
          created_at?: string | null
          day?: string
          margin?: number
          sales?: number
          sell_through?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          category: string | null
          component_path: string
          created_at: string | null
          default_height: number | null
          default_params: Json | null
          default_width: number | null
          description: string | null
          id: string
          is_active: boolean | null
          module_id: string
          query_config: Json
          query_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          component_path: string
          created_at?: string | null
          default_height?: number | null
          default_params?: Json | null
          default_width?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_id: string
          query_config?: Json
          query_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          component_path?: string
          created_at?: string | null
          default_height?: number | null
          default_params?: Json | null
          default_width?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          query_config?: Json
          query_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          created_at: string | null
          id: number
          log_message: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          log_message?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          log_message?: string | null
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          actual_delivery_date: string | null
          created_at: string | null
          delay_reason: string | null
          delivery_status: string
          expected_delivery_date: string | null
          id: string
          lead_time_days: number | null
          order_id: string
          quality_rating: number | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string | null
          delay_reason?: string | null
          delivery_status: string
          expected_delivery_date?: string | null
          id?: string
          lead_time_days?: number | null
          order_id: string
          quality_rating?: number | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string | null
          delay_reason?: string | null
          delivery_status?: string
          expected_delivery_date?: string | null
          id?: string
          lead_time_days?: number | null
          order_id?: string
          quality_rating?: number | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      implementation_templates: {
        Row: {
          base_modules: Json | null
          client_type: string | null
          created_at: string | null
          customization_points: Json | null
          description: string | null
          example_config: Json | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_modules?: Json | null
          client_type?: string | null
          created_at?: string | null
          customization_points?: Json | null
          description?: string | null
          example_config?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_modules?: Json | null
          client_type?: string | null
          created_at?: string | null
          customization_points?: Json | null
          description?: string | null
          example_config?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      legacy_core_modules: {
        Row: {
          archived_at: string | null
          category: string
          client_scope: string
          complexity_level: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          functional_category: string
          id: string
          industry_vertical: string
          is_archived: boolean
          is_deleted: boolean
          maturity_status: string | null
          name: string
          pricing_tier: string | null
          primary_client: string | null
          slug: string
          tech_tags: Json
          technical_type: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          category: string
          client_scope?: string
          complexity_level?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          functional_category?: string
          id?: string
          industry_vertical?: string
          is_archived?: boolean
          is_deleted?: boolean
          maturity_status?: string | null
          name: string
          pricing_tier?: string | null
          primary_client?: string | null
          slug: string
          tech_tags?: Json
          technical_type?: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: string
          client_scope?: string
          complexity_level?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          functional_category?: string
          id?: string
          industry_vertical?: string
          is_archived?: boolean
          is_deleted?: boolean
          maturity_status?: string | null
          name?: string
          pricing_tier?: string | null
          primary_client?: string | null
          slug?: string
          tech_tags?: Json
          technical_type?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      legacy_module_implementations: {
        Row: {
          component_path: string
          config: Json | null
          created_at: string | null
          customization_level: string
          display_name: string | null
          icon_name: string | null
          id: string
          implementation_notes: string | null
          is_available: boolean | null
          module_id: string | null
          module_type: string
          permissions: string[] | null
          updated_at: string | null
        }
        Insert: {
          component_path: string
          config?: Json | null
          created_at?: string | null
          customization_level?: string
          display_name?: string | null
          icon_name?: string | null
          id?: string
          implementation_notes?: string | null
          is_available?: boolean | null
          module_id?: string | null
          module_type: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          component_path?: string
          config?: Json | null
          created_at?: string | null
          customization_level?: string
          display_name?: string | null
          icon_name?: string | null
          id?: string
          implementation_notes?: string | null
          is_available?: boolean | null
          module_id?: string | null
          module_type?: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_module_implementations_core_modules"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "legacy_core_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_tenant_modules: {
        Row: {
          activated_at: string | null
          approval_requested_at: string | null
          approved_at: string | null
          approved_by: string | null
          archive_reason: string | null
          archived_at: string | null
          auto_upgrade: boolean | null
          billing_enabled: boolean | null
          configuration: Json | null
          created_at: string | null
          current_usage: Json | null
          custom_config: Json | null
          error_details: Json | null
          expected_features: string[] | null
          file_hash: string | null
          file_last_seen: string | null
          file_path: string | null
          health_status: string | null
          implementation_id: string | null
          implementation_notes: string | null
          implemented_at: string | null
          installed_at: string | null
          is_available: boolean | null
          is_visible: boolean | null
          last_accessed_at: string | null
          last_health_check: string | null
          last_status_change: string | null
          locked_version: boolean | null
          missing_notified: boolean | null
          missing_since: string | null
          module_id: string
          module_name: string | null
          module_type: string | null
          module_version: string | null
          operational_status:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id: string
          priority: string | null
          provisioning_completed_at: string | null
          provisioning_started_at: string | null
          reactivated_at: string | null
          retry_count: number | null
          status: string | null
          status_change_reason: string | null
          updated_at: string | null
          usage_limits: Json | null
          version_id: string | null
        }
        Insert: {
          activated_at?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          auto_upgrade?: boolean | null
          billing_enabled?: boolean | null
          configuration?: Json | null
          created_at?: string | null
          current_usage?: Json | null
          custom_config?: Json | null
          error_details?: Json | null
          expected_features?: string[] | null
          file_hash?: string | null
          file_last_seen?: string | null
          file_path?: string | null
          health_status?: string | null
          implementation_id?: string | null
          implementation_notes?: string | null
          implemented_at?: string | null
          installed_at?: string | null
          is_available?: boolean | null
          is_visible?: boolean | null
          last_accessed_at?: string | null
          last_health_check?: string | null
          last_status_change?: string | null
          locked_version?: boolean | null
          missing_notified?: boolean | null
          missing_since?: string | null
          module_id: string
          module_name?: string | null
          module_type?: string | null
          module_version?: string | null
          operational_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id: string
          priority?: string | null
          provisioning_completed_at?: string | null
          provisioning_started_at?: string | null
          reactivated_at?: string | null
          retry_count?: number | null
          status?: string | null
          status_change_reason?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
          version_id?: string | null
        }
        Update: {
          activated_at?: string | null
          approval_requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          auto_upgrade?: boolean | null
          billing_enabled?: boolean | null
          configuration?: Json | null
          created_at?: string | null
          current_usage?: Json | null
          custom_config?: Json | null
          error_details?: Json | null
          expected_features?: string[] | null
          file_hash?: string | null
          file_last_seen?: string | null
          file_path?: string | null
          health_status?: string | null
          implementation_id?: string | null
          implementation_notes?: string | null
          implemented_at?: string | null
          installed_at?: string | null
          is_available?: boolean | null
          is_visible?: boolean | null
          last_accessed_at?: string | null
          last_health_check?: string | null
          last_status_change?: string | null
          locked_version?: boolean | null
          missing_notified?: boolean | null
          missing_since?: string | null
          module_id?: string
          module_name?: string | null
          module_type?: string | null
          module_version?: string | null
          operational_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id?: string
          priority?: string | null
          provisioning_completed_at?: string | null
          provisioning_started_at?: string | null
          reactivated_at?: string | null
          retry_count?: number | null
          status?: string | null
          status_change_reason?: string | null
          updated_at?: string | null
          usage_limits?: Json | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_modules_core_modules"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "legacy_core_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_modules_organizations"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_modules_organizations"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      login_attempt_history: {
        Row: {
          attempted_at: string
          device_fingerprint: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string
          device_fingerprint?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string
          device_fingerprint?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_attempt_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      metrics_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          data: Json
          expires_at: string
          filters: Json | null
          id: string
          metric_type: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          data: Json
          expires_at: string
          filters?: Json | null
          id?: string
          metric_type: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          data?: Json
          expires_at?: string
          filters?: Json | null
          id?: string
          metric_type?: string
        }
        Relationships: []
      }
      migration_log: {
        Row: {
          id: number
          migration_log: string | null
          migration_step: string | null
          notes: string | null
          status: string | null
        }
        Insert: {
          id?: number
          migration_log?: string | null
          migration_step?: string | null
          notes?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          migration_log?: string | null
          migration_step?: string | null
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      module_approval_requests: {
        Row: {
          created_at: string | null
          id: string
          module_id: string
          organization_id: string
          request_metadata: Json | null
          request_reason: string | null
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id: string
          organization_id: string
          request_metadata?: Json | null
          request_reason?: string | null
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string
          organization_id?: string
          request_metadata?: Json | null
          request_reason?: string | null
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_approval_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_approval_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "module_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "module_approval_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      module_backups: {
        Row: {
          backup_data: Json | null
          backup_type: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          file_path: string | null
          id: string
          implementation_id: string | null
          metadata: Json | null
          size_bytes: number | null
        }
        Insert: {
          backup_data?: Json | null
          backup_type?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          file_path?: string | null
          id: string
          implementation_id?: string | null
          metadata?: Json | null
          size_bytes?: number | null
        }
        Update: {
          backup_data?: Json | null
          backup_type?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          file_path?: string | null
          id?: string
          implementation_id?: string | null
          metadata?: Json | null
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "module_backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "module_backups_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "module_implementations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_backups_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "v_modules_with_implementations"
            referencedColumns: ["implementation_id"]
          },
        ]
      }
      module_deployments: {
        Row: {
          completed_at: string | null
          deployment_type: string
          error_message: string | null
          force_deploy: boolean | null
          id: string
          migration_logs: Json | null
          module_id: string
          organization_id: string
          rollback_on_failure: boolean | null
          rollback_version: string | null
          skip_validation: boolean | null
          started_at: string
          status: string
          target_version: string
          updated_at: string | null
          validation_results: Json | null
        }
        Insert: {
          completed_at?: string | null
          deployment_type: string
          error_message?: string | null
          force_deploy?: boolean | null
          id?: string
          migration_logs?: Json | null
          module_id: string
          organization_id: string
          rollback_on_failure?: boolean | null
          rollback_version?: string | null
          skip_validation?: boolean | null
          started_at?: string
          status?: string
          target_version: string
          updated_at?: string | null
          validation_results?: Json | null
        }
        Update: {
          completed_at?: string | null
          deployment_type?: string
          error_message?: string | null
          force_deploy?: boolean | null
          id?: string
          migration_logs?: Json | null
          module_id?: string
          organization_id?: string
          rollback_on_failure?: boolean | null
          rollback_version?: string | null
          skip_validation?: boolean | null
          started_at?: string
          status?: string
          target_version?: string
          updated_at?: string | null
          validation_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "module_deployments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_deployments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      module_file_audit: {
        Row: {
          created_at: string | null
          detected_at: string | null
          event_type: string
          file_hash: string | null
          file_path: string | null
          id: string
          impact_level: string | null
          metadata: Json | null
          module_id: string
          new_status: string | null
          organization_id: string | null
          previous_hash: string | null
          previous_status: string | null
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          event_type: string
          file_hash?: string | null
          file_path?: string | null
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          module_id: string
          new_status?: string | null
          organization_id?: string | null
          previous_hash?: string | null
          previous_status?: string | null
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          event_type?: string
          file_hash?: string | null
          file_path?: string | null
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          module_id?: string
          new_status?: string | null
          organization_id?: string | null
          previous_hash?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_file_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_file_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      module_implementations: {
        Row: {
          archived_at: string | null
          audience: string | null
          base_module_id: string | null
          complexity: string | null
          component_path: string
          component_type: string | null
          config_schema_override: Json | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          dependencies: string[] | null
          description: string | null
          id: string
          implementation_key: string
          is_active: boolean | null
          is_default: boolean | null
          name: string | null
          priority: string | null
          status: string | null
          template_config: Json | null
          template_type: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          audience?: string | null
          base_module_id?: string | null
          complexity?: string | null
          component_path: string
          component_type?: string | null
          config_schema_override?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          implementation_key: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string | null
          priority?: string | null
          status?: string | null
          template_config?: Json | null
          template_type?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          audience?: string | null
          base_module_id?: string | null
          complexity?: string | null
          component_path?: string
          component_type?: string | null
          config_schema_override?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          implementation_key?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string | null
          priority?: string | null
          status?: string | null
          template_config?: Json | null
          template_type?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_implementations_base_module_id_fkey"
            columns: ["base_module_id"]
            isOneToOne: false
            referencedRelation: "base_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_implementations_base_module_id_fkey"
            columns: ["base_module_id"]
            isOneToOne: false
            referencedRelation: "v_modules_with_implementations"
            referencedColumns: ["module_id"]
          },
        ]
      }
      module_navigation: {
        Row: {
          created_at: string | null
          id: string
          implementation_id: string | null
          is_external: boolean | null
          nav_order: number | null
          nav_title: string
          nav_type: string
          parent_id: string | null
          route_path: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          implementation_id?: string | null
          is_external?: boolean | null
          nav_order?: number | null
          nav_title: string
          nav_type?: string
          parent_id?: string | null
          route_path?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          implementation_id?: string | null
          is_external?: boolean | null
          nav_order?: number | null
          nav_title?: string
          nav_type?: string
          parent_id?: string | null
          route_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_navigation_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "legacy_module_implementations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_navigation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "module_navigation"
            referencedColumns: ["id"]
          },
        ]
      }
      module_usage_logs: {
        Row: {
          cost_estimate: number | null
          created_at: string
          id: number
          latency_ms: number | null
          module_id: string
          organization_id: string
          route: string | null
          tokens_consumed: number | null
          user_id: string | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          id?: number
          latency_ms?: number | null
          module_id: string
          organization_id: string
          route?: string | null
          tokens_consumed?: number | null
          user_id?: string | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          id?: number
          latency_ms?: number | null
          module_id?: string
          organization_id?: string
          route?: string | null
          tokens_consumed?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      organization_modules: {
        Row: {
          activated_at: string | null
          archive_reason: string | null
          archived_at: string | null
          configuration: Json | null
          created_at: string | null
          expected_features: string[] | null
          file_hash: string | null
          file_last_seen: string | null
          file_path: string | null
          id: string
          implementation_notes: string | null
          implemented_at: string | null
          is_available: boolean
          locked_version: boolean | null
          missing_notified: boolean | null
          missing_since: string | null
          module_id: string
          module_name: string
          module_type: string
          module_version: string | null
          organization_id: string
          priority: string | null
          reactivated_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          configuration?: Json | null
          created_at?: string | null
          expected_features?: string[] | null
          file_hash?: string | null
          file_last_seen?: string | null
          file_path?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          is_available?: boolean
          locked_version?: boolean | null
          missing_notified?: boolean | null
          missing_since?: string | null
          module_id: string
          module_name: string
          module_type: string
          module_version?: string | null
          organization_id: string
          priority?: string | null
          reactivated_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          configuration?: Json | null
          created_at?: string | null
          expected_features?: string[] | null
          file_hash?: string | null
          file_last_seen?: string | null
          file_path?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          is_available?: boolean
          locked_version?: boolean | null
          missing_notified?: boolean | null
          missing_since?: string | null
          module_id?: string
          module_name?: string
          module_type?: string
          module_version?: string | null
          organization_id?: string
          priority?: string | null
          reactivated_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_postal_code: string | null
          address_state_province: string | null
          address_street: string | null
          beta_features_enabled: boolean | null
          client_type: string | null
          cnpj: string | null
          company_legal_name: string | null
          company_trading_name: string | null
          created_at: string | null
          custom_backend_url: string | null
          default_currency: string | null
          default_export_format: string | null
          default_timezone: string | null
          deleted_at: string | null
          id: string
          idle_product_threshold_days: number | null
          implementation_config: Json | null
          implementation_date: string | null
          implementation_team_notes: string | null
          internal_tester: boolean | null
          is_active: boolean
          is_implementation_complete: boolean | null
          min_acceptable_margin_percentage: number | null
          min_stock_coverage_alert_days: number | null
          module_strategy: Json | null
          slug: string
          state_registration: string | null
          status: string | null
          tenant_type: Database["public"]["Enums"]["tenant_type"] | null
          updated_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_postal_code?: string | null
          address_state_province?: string | null
          address_street?: string | null
          beta_features_enabled?: boolean | null
          client_type?: string | null
          cnpj?: string | null
          company_legal_name?: string | null
          company_trading_name?: string | null
          created_at?: string | null
          custom_backend_url?: string | null
          default_currency?: string | null
          default_export_format?: string | null
          default_timezone?: string | null
          deleted_at?: string | null
          id?: string
          idle_product_threshold_days?: number | null
          implementation_config?: Json | null
          implementation_date?: string | null
          implementation_team_notes?: string | null
          internal_tester?: boolean | null
          is_active?: boolean
          is_implementation_complete?: boolean | null
          min_acceptable_margin_percentage?: number | null
          min_stock_coverage_alert_days?: number | null
          module_strategy?: Json | null
          slug: string
          state_registration?: string | null
          status?: string | null
          tenant_type?: Database["public"]["Enums"]["tenant_type"] | null
          updated_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_postal_code?: string | null
          address_state_province?: string | null
          address_street?: string | null
          beta_features_enabled?: boolean | null
          client_type?: string | null
          cnpj?: string | null
          company_legal_name?: string | null
          company_trading_name?: string | null
          created_at?: string | null
          custom_backend_url?: string | null
          default_currency?: string | null
          default_export_format?: string | null
          default_timezone?: string | null
          deleted_at?: string | null
          id?: string
          idle_product_threshold_days?: number | null
          implementation_config?: Json | null
          implementation_date?: string | null
          implementation_team_notes?: string | null
          internal_tester?: boolean | null
          is_active?: boolean
          is_implementation_complete?: boolean | null
          min_acceptable_margin_percentage?: number | null
          min_stock_coverage_alert_days?: number | null
          module_strategy?: Json | null
          slug?: string
          state_registration?: string | null
          status?: string | null
          tenant_type?: Database["public"]["Enums"]["tenant_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          first_name: string | null
          id: string
          is_2fa_enabled: boolean
          is_setup_complete: boolean
          job_title: string | null
          last_name: string | null
          location: string | null
          organization_id: string | null
          phone: string | null
          prefers_email_notifications: boolean
          prefers_push_notifications: boolean
          role: Database["public"]["Enums"]["role_enum"]
          status: Database["public"]["Enums"]["user_status_enum"]
          team: string | null
          team_id: string | null
          theme: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          first_name?: string | null
          id: string
          is_2fa_enabled?: boolean
          is_setup_complete?: boolean
          job_title?: string | null
          last_name?: string | null
          location?: string | null
          organization_id?: string | null
          phone?: string | null
          prefers_email_notifications?: boolean
          prefers_push_notifications?: boolean
          role?: Database["public"]["Enums"]["role_enum"]
          status?: Database["public"]["Enums"]["user_status_enum"]
          team?: string | null
          team_id?: string | null
          theme?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          first_name?: string | null
          id?: string
          is_2fa_enabled?: boolean
          is_setup_complete?: boolean
          job_title?: string | null
          last_name?: string | null
          location?: string | null
          organization_id?: string | null
          phone?: string | null
          prefers_email_notifications?: boolean
          prefers_push_notifications?: boolean
          role?: Database["public"]["Enums"]["role_enum"]
          status?: Database["public"]["Enums"]["user_status_enum"]
          team?: string | null
          team_id?: string | null
          theme?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      projected_coverage: {
        Row: {
          analysis_date: string
          avg_daily_sales: number
          created_at: string | null
          current_stock: number
          id: string
          location_id: string
          projected_days_coverage: number
          projected_stockout_date: string | null
          risk_level: string | null
          variant_id: string
        }
        Insert: {
          analysis_date: string
          avg_daily_sales?: number
          created_at?: string | null
          current_stock?: number
          id?: string
          location_id: string
          projected_days_coverage?: number
          projected_stockout_date?: string | null
          risk_level?: string | null
          variant_id: string
        }
        Update: {
          analysis_date?: string
          avg_daily_sales?: number
          created_at?: string | null
          current_stock?: number
          id?: string
          location_id?: string
          projected_days_coverage?: number
          projected_stockout_date?: string | null
          risk_level?: string | null
          variant_id?: string
        }
        Relationships: []
      }
      promotion_recommendations: {
        Row: {
          analysis_date: string
          created_at: string | null
          estimated_lift_percentage: number
          expected_margin_impact: number
          expected_revenue_impact: number
          id: string
          location_id: string | null
          priority_score: number
          reason_code: string
          recommended_discount_percentage: number
          recommended_duration_days: number
          status: string | null
          variant_id: string
        }
        Insert: {
          analysis_date: string
          created_at?: string | null
          estimated_lift_percentage?: number
          expected_margin_impact?: number
          expected_revenue_impact?: number
          id?: string
          location_id?: string | null
          priority_score?: number
          reason_code: string
          recommended_discount_percentage: number
          recommended_duration_days?: number
          status?: string | null
          variant_id: string
        }
        Update: {
          analysis_date?: string
          created_at?: string | null
          estimated_lift_percentage?: number
          expected_margin_impact?: number
          expected_revenue_impact?: number
          id?: string
          location_id?: string | null
          priority_score?: number
          reason_code?: string
          recommended_discount_percentage?: number
          recommended_duration_days?: number
          status?: string | null
          variant_id?: string
        }
        Relationships: []
      }
      rls_audit_logs: {
        Row: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["rls_entity_type"]
          error_message: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          operation_type: Database["public"]["Enums"]["rls_operation_type"]
          organization_id: string
          request_id: string | null
          success: boolean
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["rls_entity_type"]
          error_message?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          operation_type: Database["public"]["Enums"]["rls_operation_type"]
          organization_id: string
          request_id?: string | null
          success: boolean
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["rls_entity_type"]
          error_message?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          operation_type?: Database["public"]["Enums"]["rls_operation_type"]
          organization_id?: string
          request_id?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rls_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rls_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "rls_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      secrets: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "secrets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "secrets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      security_alert_settings: {
        Row: {
          alert_failed_attempts: boolean
          alert_new_device: boolean
          alert_user_deletion: boolean
          created_at: string
          failed_attempts_threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_failed_attempts?: boolean
          alert_new_device?: boolean
          alert_user_deletion?: boolean
          created_at?: string
          failed_attempts_threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_failed_attempts?: boolean
          alert_new_device?: boolean
          alert_user_deletion?: boolean
          created_at?: string
          failed_attempts_threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_alert_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tenant_business_entities: {
        Row: {
          attributes: Json
          created_at: string
          deleted_at: string | null
          entity_type: string
          external_id: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          deleted_at?: string | null
          entity_type: string
          external_id: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          deleted_at?: string | null
          entity_type?: string
          external_id?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_business_entities_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_business_entities_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      tenant_business_relationships: {
        Row: {
          attributes: Json
          created_at: string
          deleted_at: string | null
          id: string
          organization_id: string
          relationship_type: string
          source_id: string
          target_id: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id: string
          relationship_type: string
          source_id: string
          target_id: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string
          relationship_type?: string
          source_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_business_relationships_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_business_relationships_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      tenant_business_transactions: {
        Row: {
          attributes: Json
          created_at: string
          deleted_at: string | null
          external_id: string | null
          id: string
          organization_id: string
          status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          deleted_at?: string | null
          external_id?: string | null
          id?: string
          organization_id: string
          status: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          deleted_at?: string | null
          external_id?: string | null
          id?: string
          organization_id?: string
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_business_transactions_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_business_transactions_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      tenant_dashboard_widgets: {
        Row: {
          created_at: string | null
          custom_params: Json | null
          display_order: number | null
          enabled: boolean | null
          height: number | null
          id: string
          position_x: number | null
          position_y: number | null
          tenant_id: string
          updated_at: string | null
          widget_id: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          custom_params?: Json | null
          display_order?: number | null
          enabled?: boolean | null
          height?: number | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          tenant_id: string
          updated_at?: string | null
          widget_id: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          custom_params?: Json | null
          display_order?: number | null
          enabled?: boolean | null
          height?: number | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          tenant_id?: string
          updated_at?: string | null
          widget_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_dashboard_widgets_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "dashboard_widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_module_assignments: {
        Row: {
          activation_date: string | null
          assigned_at: string | null
          assigned_by: string
          base_module_id: string
          config_schema: Json | null
          custom_config: Json | null
          deactivation_date: string | null
          id: string | null
          implementation_id: string | null
          is_active: boolean | null
          is_visible: boolean | null
          permissions_override: string[] | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_groups: string[] | null
        }
        Insert: {
          activation_date?: string | null
          assigned_at?: string | null
          assigned_by: string
          base_module_id: string
          config_schema?: Json | null
          custom_config?: Json | null
          deactivation_date?: string | null
          id?: string | null
          implementation_id?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          permissions_override?: string[] | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_groups?: string[] | null
        }
        Update: {
          activation_date?: string | null
          assigned_at?: string | null
          assigned_by?: string
          base_module_id?: string
          config_schema?: Json | null
          custom_config?: Json | null
          deactivation_date?: string | null
          id?: string | null
          implementation_id?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          permissions_override?: string[] | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_groups?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_module_assignments_base_module_id_fkey"
            columns: ["base_module_id"]
            isOneToOne: false
            referencedRelation: "base_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_base_module_id_fkey"
            columns: ["base_module_id"]
            isOneToOne: false
            referencedRelation: "v_modules_with_implementations"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "module_implementations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "v_modules_with_implementations"
            referencedColumns: ["implementation_id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      tenant_module_settings: {
        Row: {
          created_at: string
          id: string
          module_id: string
          organization_id: string
          settings: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          organization_id: string
          settings: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          organization_id?: string
          settings?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_module_status_history: {
        Row: {
          change_metadata: Json | null
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          module_id: string
          new_status: Database["public"]["Enums"]["tenant_operational_status"]
          organization_id: string
          previous_status:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
        }
        Insert: {
          change_metadata?: Json | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          module_id: string
          new_status: Database["public"]["Enums"]["tenant_operational_status"]
          organization_id: string
          previous_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
        }
        Update: {
          change_metadata?: Json | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          module_id?: string
          new_status?: Database["public"]["Enums"]["tenant_operational_status"]
          organization_id?: string
          previous_status?:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_module_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tenant_snapshots: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          snapshot_date: string
          snapshot_key: string
          snapshot_type: string
          snapshot_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          snapshot_date: string
          snapshot_key: string
          snapshot_type: string
          snapshot_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          snapshot_date?: string
          snapshot_key?: string
          snapshot_type?: string
          snapshot_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted_at: string
          consent_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Update: {
          accepted_at?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_data_exports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_count: number | null
          download_token: string | null
          downloaded_at: string | null
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          file_url: string | null
          format: Database["public"]["Enums"]["data_export_format_enum"]
          id: string
          max_downloads: number | null
          status: Database["public"]["Enums"]["export_status_enum"] | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_count?: number | null
          download_token?: string | null
          downloaded_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format: Database["public"]["Enums"]["data_export_format_enum"]
          id?: string
          max_downloads?: number | null
          status?: Database["public"]["Enums"]["export_status_enum"] | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_count?: number | null
          download_token?: string | null
          downloaded_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["data_export_format_enum"]
          id?: string
          max_downloads?: number | null
          status?: Database["public"]["Enums"]["export_status_enum"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_data_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_deletion_requests: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          completion_details: Json | null
          created_at: string | null
          id: string
          password_verified_at: string | null
          scheduled_deletion_date: string | null
          status: Database["public"]["Enums"]["deletion_status_enum"] | null
          token_expires_at: string | null
          user_id: string | null
          verification_token: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completion_details?: Json | null
          created_at?: string | null
          id?: string
          password_verified_at?: string | null
          scheduled_deletion_date?: string | null
          status?: Database["public"]["Enums"]["deletion_status_enum"] | null
          token_expires_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completion_details?: Json | null
          created_at?: string | null
          id?: string
          password_verified_at?: string | null
          scheduled_deletion_date?: string | null
          status?: Database["public"]["Enums"]["deletion_status_enum"] | null
          token_expires_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["role_enum"]
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["role_enum"]
          status: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["role_enum"]
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_invites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_known_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          first_seen_at: string
          id: string
          is_trusted: boolean
          last_seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          first_seen_at?: string
          id?: string
          is_trusted?: boolean
          last_seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          first_seen_at?: string
          id?: string
          is_trusted?: boolean
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_known_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_login_history: {
        Row: {
          id: string
          ip_address: string | null
          location: string | null
          logged_in_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_session_blocks: {
        Row: {
          blocked_until: string
          created_at: string | null
          created_by: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          blocked_until: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string
          user_id: string
        }
        Update: {
          blocked_until?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_session_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_session_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          geo_location: Json | null
          id: string
          ip: unknown | null
          is_active: boolean | null
          last_activity: string | null
          login_method: string | null
          organization_id: string | null
          security_flags: Json | null
          session_type: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          geo_location?: Json | null
          id?: string
          ip?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          login_method?: string | null
          organization_id?: string | null
          security_flags?: Json | null
          session_type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          geo_location?: Json | null
          id?: string
          ip?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          login_method?: string | null
          organization_id?: string | null
          security_flags?: Json | null
          session_type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          event_type: string
          id: string
          payload: Json
          processing_time_ms: number | null
          response_data: Json | null
          source_ip: string | null
          status: string
          updated_at: string
          user_agent: string | null
          webhook_flow: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_type: string
          id?: string
          payload?: Json
          processing_time_ms?: number | null
          response_data?: Json | null
          source_ip?: string | null
          status: string
          updated_at?: string
          user_agent?: string | null
          webhook_flow: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processing_time_ms?: number | null
          response_data?: Json | null
          source_ip?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          webhook_flow?: string
        }
        Relationships: []
      }
      webhook_metrics: {
        Row: {
          avg_processing_time_ms: number | null
          created_at: string
          date: string
          failed_events: number
          id: string
          successful_events: number
          total_events: number
          webhook_flow: string
        }
        Insert: {
          avg_processing_time_ms?: number | null
          created_at?: string
          date: string
          failed_events?: number
          id?: string
          successful_events?: number
          total_events?: number
          webhook_flow: string
        }
        Update: {
          avg_processing_time_ms?: number | null
          created_at?: string
          date?: string
          failed_events?: number
          id?: string
          successful_events?: number
          total_events?: number
          webhook_flow?: string
        }
        Relationships: []
      }
      widget_instances: {
        Row: {
          created_at: string | null
          custom_config: Json | null
          id: string
          position: number
          updated_at: string | null
          user_id: string
          widget_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          position: number
          updated_at?: string | null
          user_id: string
          widget_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          position?: number
          updated_at?: string | null
          user_id?: string
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_instances_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["widget_type"]
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["widget_type"]
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["widget_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      tenant_modules_with_details: {
        Row: {
          category: string | null
          client_type: string | null
          component_path: string | null
          custom_config: Json | null
          icon_name: string | null
          implementation_display_name: string | null
          installed_at: string | null
          is_visible: boolean | null
          last_accessed_at: string | null
          maturity_status: string | null
          module_description: string | null
          module_name: string | null
          module_slug: string | null
          operational_status:
            | Database["public"]["Enums"]["tenant_operational_status"]
            | null
          organization_id: string | null
          permissions: string[] | null
          pricing_tier: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_modules_organizations"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_modules_organizations"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      user_profile_cache: {
        Row: {
          activity_level: string | null
          client_type: string | null
          computed_status: string | null
          email: string | null
          email_confirmed_at: string | null
          first_name: string | null
          full_name: string | null
          is_setup_complete: boolean | null
          last_modified: string | null
          last_name: string | null
          last_sign_in_at: string | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          organization_status: string | null
          profile_created_at: string | null
          profile_updated_at: string | null
          role: Database["public"]["Enums"]["role_enum"] | null
          tenant_type: Database["public"]["Enums"]["tenant_type"] | null
          user_created_at: string | null
          user_id: string | null
          user_status: Database["public"]["Enums"]["user_status_enum"] | null
        }
        Relationships: []
      }
      v_active_tenant_assignments: {
        Row: {
          activation_date: string | null
          assigned_at: string | null
          audience: string | null
          base_module_id: string | null
          complexity: string | null
          component_path: string | null
          component_type: string | null
          custom_config: Json | null
          deactivation_date: string | null
          implementation_id: string | null
          implementation_key: string | null
          implementation_name: string | null
          module_category: string | null
          module_icon: string | null
          module_name: string | null
          module_slug: string | null
          permissions_override: string[] | null
          route_pattern: string | null
          template_type: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_slug: string | null
          updated_at: string | null
          user_groups: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_module_assignments_base_module_id_fkey"
            columns: ["base_module_id"]
            isOneToOne: false
            referencedRelation: "base_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_base_module_id_fkey"
            columns: ["base_module_id"]
            isOneToOne: false
            referencedRelation: "v_modules_with_implementations"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "module_implementations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "v_modules_with_implementations"
            referencedColumns: ["implementation_id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_modules_with_implementations: {
        Row: {
          active_assignments_count: number | null
          audience: string | null
          complexity: string | null
          component_path: string | null
          component_type: string | null
          implementation_active: boolean | null
          implementation_id: string | null
          implementation_key: string | null
          implementation_name: string | null
          is_default_implementation: boolean | null
          module_active: boolean | null
          module_category: string | null
          module_description: string | null
          module_icon: string | null
          module_id: string | null
          module_name: string | null
          module_slug: string | null
          permissions_required: string[] | null
          route_pattern: string | null
          supports_multi_tenant: boolean | null
          template_type: string | null
        }
        Relationships: []
      }
      v_tenant_module_assignments_full: {
        Row: {
          assigned_at: string | null
          assignment_active: boolean | null
          component_path: string | null
          custom_config: Json | null
          implementation_key: string | null
          implementation_name: string | null
          module_category: string | null
          module_name: string | null
          module_slug: string | null
          organization_name: string | null
          organization_slug: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_module_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "user_profile_cache"
            referencedColumns: ["organization_id"]
          },
        ]
      }
    }
    Functions: {
      admin_delete_user_sessions: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      archive_organization_module: {
        Args: {
          p_module_id: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: Json
      }
      auto_upgrade_tenant_modules: {
        Args: { p_tenant_id?: string; p_module_id?: string }
        Returns: Json
      }
      batch_cleanup_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          operation: string
          affected_count: number
          details: Json
        }[]
      }
      block_user_sessions: {
        Args: {
          target_user_id: string
          block_minutes?: number
          block_reason?: string
        }
        Returns: boolean
      }
      can_access_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_location: {
        Args: { loc_id: string }
        Returns: boolean
      }
      can_access_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      can_access_supplier: {
        Args: { sup_id: string }
        Returns: boolean
      }
      can_manage_core_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_modify_analytics: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_tenant_module_health: {
        Args: { p_tenant_id: string; p_module_id?: string }
        Returns: Json
      }
      check_user_sessions_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          permission_type: string
          has_permission: boolean
        }[]
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_api_key_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      configure_organization_business_domain: {
        Args: { org_id: string; business_domain: string; config?: Json }
        Returns: undefined
      }
      create_business_entity: {
        Args: { p_organization_id: string; p_entity_type: string; p_data: Json }
        Returns: string
      }
      create_business_relationship: {
        Args: {
          p_organization_id: string
          p_source_entity_id: string
          p_target_entity_id: string
          p_relationship_type: string
          p_relationship_data: Json
        }
        Returns: string
      }
      create_business_transaction: {
        Args: {
          p_organization_id: string
          p_transaction_type: string
          p_transaction_data: Json
        }
        Returns: string
      }
      create_user_session: {
        Args: {
          p_user_id: string
          p_user_agent?: string
          p_ip?: unknown
          p_device_info?: Json
          p_geo_location?: Json
          p_session_type?: string
          p_login_method?: string
          p_expires_hours?: number
        }
        Returns: string
      }
      current_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      debug_visible_modules: {
        Args: { p_tenant_id: string }
        Returns: {
          module_slug: string
          module_name: string
          is_active: boolean
          assignment_status: string
          base_archived: boolean
          impl_archived: boolean
        }[]
      }
      delete_widget_instance: {
        Args: { p_instance_id: string }
        Returns: boolean
      }
      detect_suspicious_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          session_id: string
          user_id: string
          user_email: string
          suspicion_reasons: Json
          risk_level: string
        }[]
      }
      end_all_user_sessions: {
        Args: { p_user_id: string; p_except_session_id?: string }
        Returns: number
      }
      end_user_session: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      end_user_session_complete: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      fix_orphaned_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          user_id: string
          user_email: string
          result: string
        }[]
      }
      generate_slug: {
        Args: { input_name: string }
        Returns: string
      }
      get_active_sessions_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_active_sessions: number
          sessions_last_hour: number
          sessions_last_day: number
          unique_users_active: number
          top_devices: Json
        }[]
      }
      get_cache_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric: string
          value: number
          description: string
        }[]
      }
      get_complete_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_db_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_organization: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_default_module_implementation: {
        Args: { p_module_slug: string }
        Returns: {
          implementation_id: string
          implementation_key: string
          component_path: string
        }[]
      }
      get_dynamic_navigation: {
        Args: { p_organization_id: string; p_client_type?: string }
        Returns: {
          module_slug: string
          nav_title: string
          nav_order: number
          nav_type: string
          route_path: string
          icon_name: string
          parent_id: string
          is_external: boolean
        }[]
      }
      get_entity_relationships: {
        Args: {
          p_organization_id: string
          p_entity_id: string
          p_relationship_type: string
        }
        Returns: {
          related_entity_id: string
          relationship_data: Json
        }[]
      }
      get_entity_transactions: {
        Args: {
          p_organization_id: string
          p_entity_id: string
          p_transaction_type: string
        }
        Returns: {
          id: string
          transaction_data: Json
          created_at: string
        }[]
      }
      get_location_by_id: {
        Args: { p_organization_id: string; p_location_id: string }
        Returns: Json
      }
      get_module_adoption_details: {
        Args: { p_module_id: string }
        Returns: {
          module_id: string
          module_name: string
          module_slug: string
          organization_id: string
          organization_name: string
          client_type: string
          is_active: boolean
          assignment_status: string
          assigned_at: string
          is_visible: boolean
        }[]
      }
      get_module_adoption_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          module_id: string
          module_name: string
          module_slug: string
          category: string
          pricing_tier: string
          maturity: string
          status: string
          total_organizations: number
          active_organizations: number
          adoption_rate: number
          total_assignments: number
        }[]
      }
      get_module_adoption_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_module_catalog_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_module_configuration: {
        Args: {
          p_organization_id: string
          p_module_slug: string
          p_client_type?: string
        }
        Returns: {
          module_id: string
          module_slug: string
          module_name: string
          component_path: string
          display_name: string
          icon_name: string
          permissions: string[]
          base_config: Json
          custom_config: Json
          final_config: Json
        }[]
      }
      get_module_health_stats: {
        Args: { org_id?: string }
        Returns: Json
      }
      get_module_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_modules_stats: {
        Args: { org_id?: string }
        Returns: Json
      }
      get_organization_active_sessions: {
        Args: { org_id: string }
        Returns: {
          session_id: string
          user_id: string
          user_email: string
          device_info: Json
          last_activity: string
          geo_location: Json
          session_type: string
        }[]
      }
      get_organization_modules: {
        Args: { org_id: string }
        Returns: {
          id: string
          module_id: string
          module_name: string
          module_type: string
          status: string
          configuration: Json
          expected_features: string[]
          implementation_notes: string
          priority: string
          created_at: string
          updated_at: string
          implemented_at: string
          activated_at: string
        }[]
      }
      get_organization_modules_with_navigation: {
        Args: { org_id: string }
        Returns: {
          module_slug: string
          module_name: string
          display_name: string
          icon_name: string
          component_path: string
          permissions: string[]
          nav_type: string
          nav_title: string
          nav_order: number
          route_path: string
          parent_id: string
          custom_config: Json
        }[]
      }
      get_organization_session_stats: {
        Args: { p_org_id: string }
        Returns: {
          metric: string
          value: number
          description: string
        }[]
      }
      get_organization_users_cached: {
        Args: { org_slug: string }
        Returns: {
          user_id: string
          email: string
          full_name: string
          role: Database["public"]["Enums"]["role_enum"]
          user_status: Database["public"]["Enums"]["user_status_enum"]
          activity_level: string
          last_sign_in_at: string
        }[]
      }
      get_product_by_id: {
        Args: { p_organization_id: string; p_product_id: string }
        Returns: Json
      }
      get_recent_user_blocks: {
        Args: { minutes_ago?: number; limit_count?: number }
        Returns: {
          user_id: string
          blocked_until: string
          created_at: string
        }[]
      }
      get_rls_audit_logs: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_entity_type?: Database["public"]["Enums"]["rls_entity_type"]
          p_operation_type?: Database["public"]["Enums"]["rls_operation_type"]
          p_success?: boolean
        }
        Returns: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["rls_entity_type"]
          error_message: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          operation_type: Database["public"]["Enums"]["rls_operation_type"]
          organization_id: string
          request_id: string | null
          success: boolean
          timestamp: string
          user_agent: string | null
          user_id: string
        }[]
      }
      get_secret: {
        Args: { p_name: string }
        Returns: {
          id: string
          name: string
          value: string
          expires_at: string
          metadata: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_session_analytics: {
        Args: { p_org_id: string; p_days_back?: number }
        Returns: {
          metric_name: string
          metric_value: number
          metric_trend: string
          metric_details: Json
        }[]
      }
      get_supplier_by_id: {
        Args: { p_organization_id: string; p_supplier_id: string }
        Returns: Json
      }
      get_tenant_module_implementation: {
        Args: { p_tenant_id: string; p_module_slug: string }
        Returns: {
          implementation_id: string
          implementation_key: string
          component_path: string
          custom_config: Json
        }[]
      }
      get_tenant_modules_stats: {
        Args: { tenant_org_id: string }
        Returns: Json
      }
      get_tenant_operational_stats: {
        Args: { p_organization_id?: string }
        Returns: Json
      }
      get_user_accessible_modules: {
        Args: { org_slug?: string }
        Returns: {
          module_slug: string
          module_name: string
          display_name: string
          icon_name: string
          route_path: string
          nav_title: string
          nav_type: string
          nav_order: number
          category: string
          permissions: string[]
        }[]
      }
      get_user_active_sessions: {
        Args: { p_user_id: string }
        Returns: {
          session_id: string
          created_at: string
          last_activity: string
          ip: unknown
          device_info: Json
          geo_location: Json
          session_type: string
          login_method: string
        }[]
      }
      get_user_block_remaining_time: {
        Args: { check_user_id: string }
        Returns: number
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organization_id_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_visible_modules: {
        Args: { p_tenant_id: string; p_user_id?: string }
        Returns: {
          module_slug: string
          module_name: string
          module_category: string
          can_view: boolean
          can_access: boolean
          assignment_id: string
          custom_config: Json
          permissions_override: Json
          status: string
          implementation_key: string
          component_path: string
        }[]
      }
      get_user_widgets: {
        Args: Record<PropertyKey, never>
        Returns: {
          instance_id: string
          widget_id: string
          widget_name: string
          widget_type: Database["public"]["Enums"]["widget_type"]
          widget_position: number
          base_config: Json
          custom_config: Json
        }[]
      }
      get_user_with_profile_cached: {
        Args: { input_user_id?: string }
        Returns: unknown[]
      }
      get_visible_modules_for_tenant: {
        Args: { p_tenant_id: string }
        Returns: {
          module_slug: string
          module_name: string
          component_path: string
          custom_config: Json
        }[]
      }
      has_analytics_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      insert_csp_violation: {
        Args: {
          document_uri: string
          violated_directive: string
          blocked_uri: string
          effective_directive: string
          original_policy: string
          referrer: string
          status_code: number
          user_agent: string
          client_ip: string
          metadata?: Json
        }
        Returns: string
      }
      insert_secret: {
        Args: {
          p_name: string
          p_value: string
          p_expires_at?: string
          p_metadata?: Json
        }
        Returns: string
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_master_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_module_available_for_assignment: {
        Args: { p_module_id: string }
        Returns: boolean
      }
      is_organization_active: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_supabase_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_session_blocked: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      log_rls_operation: {
        Args: {
          p_operation_type: Database["public"]["Enums"]["rls_operation_type"]
          p_entity_type: Database["public"]["Enums"]["rls_entity_type"]
          p_entity_id: string
          p_old_data?: Json
          p_new_data?: Json
          p_success?: boolean
          p_error_message?: string
        }
        Returns: undefined
      }
      log_rls_policy_violation: {
        Args: {
          p_entity_type: Database["public"]["Enums"]["rls_entity_type"]
          p_entity_id: string
          p_error_message: string
        }
        Returns: undefined
      }
      mark_module_missing: {
        Args: {
          p_module_id: string
          p_organization_id: string
          p_previous_status?: string
        }
        Returns: undefined
      }
      migrate_organization_modules_to_tenant_modules: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      monitor_login_security: {
        Args: { p_user_id: string }
        Returns: {
          alert_type: string
          severity: string
          message: string
          recommendations: Json
        }[]
      }
      prepare_session_webhook_data: {
        Args: { p_session_id: string }
        Returns: Json
      }
      provision_tenant_module: {
        Args: {
          p_tenant_id: string
          p_module_id: string
          p_auto_upgrade?: boolean
        }
        Returns: Json
      }
      reactivate_organization_module: {
        Args: {
          p_module_id: string
          p_organization_id: string
          p_new_status?: string
        }
        Returns: Json
      }
      register_widget: {
        Args: {
          p_name: string
          p_type: Database["public"]["Enums"]["widget_type"]
          p_config: Json
        }
        Returns: string
      }
      revoke_session: {
        Args: { session_id: string }
        Returns: Json
      }
      scheduled_session_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          job_name: string
          execution_time: string
          job_results: Json
        }[]
      }
      seed_default_modules_for_empty_organizations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      session_heartbeat: {
        Args: { p_user_id: string; p_additional_data?: Json }
        Returns: {
          session_id: string
          updated: boolean
          created_new: boolean
        }[]
      }
      set_config: {
        Args: { key: string; value: string }
        Returns: undefined
      }
      supabase_admin_revoke_session: {
        Args: { session_id: string }
        Returns: undefined
      }
      update_session_activity: {
        Args: { p_session_id: string; p_new_activity?: string }
        Returns: boolean
      }
      upsert_widget_instance: {
        Args: {
          p_widget_id: string
          p_position: number
          p_custom_config?: Json
        }
        Returns: string
      }
      user_belongs_to_organization: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      user_can_access_module: {
        Args: { p_tenant_id: string; p_module_slug: string; p_user_id?: string }
        Returns: boolean
      }
      user_has_module_access: {
        Args: { module_slug: string; org_id?: string }
        Returns: boolean
      }
      validate_auth_profile_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          issue_count: number
          details: Json
        }[]
      }
      validate_entity_data: {
        Args: { p_entity_type: string; p_data: Json }
        Returns: boolean
      }
      validate_json_schema: {
        Args: { schema_json: Json }
        Returns: boolean
      }
      validate_relationship_data: {
        Args: { p_relationship_type: string; p_data: Json }
        Returns: boolean
      }
      validate_status_transition: {
        Args: {
          current_status: Database["public"]["Enums"]["tenant_operational_status"]
          new_status: Database["public"]["Enums"]["tenant_operational_status"]
        }
        Returns: boolean
      }
      validate_transaction_data: {
        Args: { p_transaction_type: string; p_data: Json }
        Returns: boolean
      }
    }
    Enums: {
      api_key_permission:
        | "webhook:purchase"
        | "webhook:inventory"
        | "webhook:sales"
        | "webhook:transfer"
        | "webhook:returns"
        | "webhook:etl"
        | "system:admin"
        | "system:read"
        | "system:write"
      auto_enable_policy_enum: "NONE" | "NEW_TENANTS" | "ALL_TENANTS"
      data_export_format_enum: "json" | "csv" | "pdf" | "JSON" | "CSV" | "PDF"
      deletion_status_enum:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "PENDING"
        | "CONFIRMED"
        | "CANCELLED"
        | "COMPLETED"
      doc_status_enum:
        | "PENDING"
        | "AWAITING_CD_VERIFICATION"
        | "IN_CD_VERIFICATION"
        | "CD_VERIFIED_NO_DISCREPANCY"
        | "CD_VERIFIED_WITH_DISCREPANCY"
        | "EFFECTIVE_CD"
        | "TRANSFER_ORDER_CREATED"
        | "SEPARATION_MAP_CREATED"
        | "AWAITING_CD_SEPARATION"
        | "IN_CD_SEPARATION"
        | "CD_SEPARATED_NO_DISCREPANCY"
        | "CD_SEPARATED_WITH_DISCREPANCY"
        | "SEPARATED_PRE_DOCK"
        | "SHIPPED_CD"
        | "CDH_TRANSFER_INVOICED"
        | "AWAITING_STORE_VERIFICATION"
        | "IN_STORE_VERIFICATION"
        | "STORE_VERIFIED_NO_DISCREPANCY"
        | "STORE_VERIFIED_WITH_DISCREPANCY"
        | "EFFECTIVE_STORE"
        | "SALE_COMPLETED"
        | "RETURN_AWAITING"
        | "RETURN_COMPLETED"
        | "STORE_TO_STORE_TRANSFER"
        | "CANCELLED"
      doc_type_enum:
        | "SUPPLIER_IN"
        | "TRANSFER_OUT"
        | "TRANSFER_IN"
        | "RETURN"
        | "SALE"
      entity_status:
        | "ACTIVE"
        | "INACTIVE"
        | "SUSPENDED"
        | "ARCHIVED"
        | "PENDING"
      entity_type_enum: "ORDER" | "DOCUMENT" | "MOVEMENT" | "VARIANT"
      event_code_enum:
        | "purchase_order_created"
        | "purchase_order_approved"
        | "supplier_invoice_precleared"
        | "receipt_in_conference_cd"
        | "receipt_item_scanned_ok"
        | "receipt_item_scanned_diff"
        | "transfer_order_created"
        | "separation_map_created"
        | "separation_in_progress"
        | "separation_invoiced"
        | "store_receipt_start"
        | "store_receipt_effective"
        | "sale_completed"
        | "return_same_store"
        | "return_other_store"
        | "manual_exchange_created"
        | "sale"
        | "return"
        | "transfer"
        | "adjustment"
        | "receipt_ok_cd"
        | "return_waiting"
        | "return_completed"
        | "catalog_sync"
        | "stock_adjustment"
        | "pricing_update"
      export_status_enum:
        | "requested"
        | "processing"
        | "completed"
        | "failed"
        | "expired"
        | "REQUESTED"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "EXPIRED"
      gender_enum: "MAS" | "FEM" | "USX"
      internal_invoice_item_store_conference_status: "OK" | "DIVERGENTE"
      internal_invoice_type:
        | "TRANSFERENCIA_LOJA"
        | "BONIFICACAO_FORNECEDOR"
        | "DEVOLUCAO_FORNECEDOR"
        | "DEVOLUCAO_CLIENTE_MESMA_LOJA"
        | "DEVOLUCAO_CLIENTE_OUTRA_LOJA_RECEBIMENTO"
        | "TRANSFERENCIA_DEVOLUCAO_CLIENTE_PARA_LOJA_RECEBEDORA"
        | "TRANSFERENCIA_DEFEITO_PARA_CD"
      internal_transfer_status: "EMITIDA" | "FINALIZADA_LOJA" | "CANCELADA"
      location_type: "CD" | "LOJA"
      location_type_enum: "CD" | "STORE"
      mfa_method_enum: "email" | "whatsapp" | "EMAIL" | "WHATSAPP"
      mfa_reset_status_enum:
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
        | "completed"
      module_auto_enable_policy: "NONE" | "NEW_TENANTS" | "ALL_TENANTS"
      module_category:
        | "standard"
        | "custom"
        | "industry"
        | "analytics"
        | "operations"
      module_maturity_status:
        | "PLANNED"
        | "IN_DEVELOPMENT"
        | "ALPHA"
        | "BETA"
        | "RC"
        | "GA"
        | "MAINTENANCE"
        | "DEPRECATED"
        | "RETIRED"
      module_request_policy: "DENY_ALL" | "MANUAL_APPROVAL" | "AUTO_APPROVE"
      module_status:
        | "planned"
        | "implemented"
        | "active"
        | "inactive"
        | "cancelled"
        | "paused"
        | "discovered"
        | "missing"
        | "archived"
        | "orphaned"
      module_tenant_status:
        | "REQUESTED"
        | "PENDING_APPROVAL"
        | "PROVISIONING"
        | "ENABLED"
        | "UPGRADING"
        | "UP_TO_DATE"
        | "SUSPENDED"
        | "DISABLED"
        | "ARCHIVED"
        | "ERROR"
      module_visibility_enum: "HIDDEN" | "INTERNAL" | "PUBLIC"
      module_visibility_policy: "HIDDEN" | "INTERNAL" | "PUBLIC"
      movement_type_enum:
        | "CD_RECEIPT"
        | "CD_TRANSFER"
        | "STORE_RECEIPT"
        | "SALE"
        | "RETURN"
        | "INVENTORY_ADJUSTMENT"
      operational_status_enum:
        | "REQUESTED"
        | "PENDING_APPROVAL"
        | "PROVISIONING"
        | "ENABLED"
        | "UPGRADING"
        | "UP_TO_DATE"
        | "SUSPENDED"
        | "DISABLED"
        | "ARCHIVED"
        | "ERROR"
      order_status_enum: "NEW" | "APPROVED" | "CANCELLED"
      order_type_enum: "TRANSFER" | "PURCHASE"
      purchase_order_status: "NOVO" | "APROVADO" | "NAO_APROVADO" | "CANCELADO"
      request_policy_enum: "DENY_ALL" | "MANUAL_APPROVAL" | "AUTO_APPROVE"
      rls_entity_type: "core_suppliers" | "core_locations" | "core_products"
      rls_operation_type: "INSERT" | "UPDATE" | "DELETE" | "POLICY_VIOLATION"
      role_enum:
        | "organization_admin"
        | "editor"
        | "reader"
        | "visitor"
        | "master_admin"
      sale_status:
        | "CONCLUIDA"
        | "CANCELADA"
        | "PARCIALMENTE_DEVOLVIDA"
        | "TOTALMENTE_DEVOLVIDA"
      supplier_invoice_item_conference_status:
        | "SEM_DIVERGENCIA"
        | "DIVERGENTE_A_MAIS"
        | "DIVERGENTE_A_MENOS"
        | "PRODUTO_ERRADO"
      supplier_invoice_status:
        | "PENDENTE"
        | "PRE_BAIXA"
        | "BAIXA"
        | "FATURADO"
        | "AGUARDANDO_SEPARACAO"
        | "EM_CONFERENCIA"
        | "CANCELADA"
        | "CONFERIDO_DIVERGENTE"
        | "CONFERIDO_NAO_DIVERGENTE"
        | "EM_SEPARACAO"
        | "FALHA_NFE"
        | "SEPARADO"
        | "ENVIADO_DOCA"
        | "EMBARCADO"
        | "FALHA_EMBARQUE"
      tenant_operational_status:
        | "REQUESTED"
        | "PENDING_APPROVAL"
        | "PROVISIONING"
        | "ENABLED"
        | "UPGRADING"
        | "UP_TO_DATE"
        | "SUSPENDED"
        | "DISABLED"
        | "ARCHIVED"
        | "ERROR"
      tenant_type: "STANDARD" | "INTERNAL_TESTER" | "BETA_TESTER" | "ENTERPRISE"
      transaction_status:
        | "DRAFT"
        | "PENDING"
        | "CONFIRMED"
        | "IN_PROGRESS"
        | "SHIPPED"
        | "COMPLETED"
        | "CANCELLED"
        | "RETURNED"
        | "REFUNDED"
        | "FAILED"
        | "EXPIRED"
        | "ON_HOLD"
        | "PROCESSING"
        | "DELIVERED"
        | "ISSUED"
        | "SENT"
        | "OVERDUE"
      unit_measure_enum: "PAR" | "UND" | "CX"
      unit_measurement: "Par" | "Und" | "Cx"
      user_status_enum: "ACTIVE" | "INACTIVE" | "PENDING" | "DELETED"
      widget_type: "executive_dashboard" | "fashion_kpis" | "insights_board"
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
      api_key_permission: [
        "webhook:purchase",
        "webhook:inventory",
        "webhook:sales",
        "webhook:transfer",
        "webhook:returns",
        "webhook:etl",
        "system:admin",
        "system:read",
        "system:write",
      ],
      auto_enable_policy_enum: ["NONE", "NEW_TENANTS", "ALL_TENANTS"],
      data_export_format_enum: ["json", "csv", "pdf", "JSON", "CSV", "PDF"],
      deletion_status_enum: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
      ],
      doc_status_enum: [
        "PENDING",
        "AWAITING_CD_VERIFICATION",
        "IN_CD_VERIFICATION",
        "CD_VERIFIED_NO_DISCREPANCY",
        "CD_VERIFIED_WITH_DISCREPANCY",
        "EFFECTIVE_CD",
        "TRANSFER_ORDER_CREATED",
        "SEPARATION_MAP_CREATED",
        "AWAITING_CD_SEPARATION",
        "IN_CD_SEPARATION",
        "CD_SEPARATED_NO_DISCREPANCY",
        "CD_SEPARATED_WITH_DISCREPANCY",
        "SEPARATED_PRE_DOCK",
        "SHIPPED_CD",
        "CDH_TRANSFER_INVOICED",
        "AWAITING_STORE_VERIFICATION",
        "IN_STORE_VERIFICATION",
        "STORE_VERIFIED_NO_DISCREPANCY",
        "STORE_VERIFIED_WITH_DISCREPANCY",
        "EFFECTIVE_STORE",
        "SALE_COMPLETED",
        "RETURN_AWAITING",
        "RETURN_COMPLETED",
        "STORE_TO_STORE_TRANSFER",
        "CANCELLED",
      ],
      doc_type_enum: [
        "SUPPLIER_IN",
        "TRANSFER_OUT",
        "TRANSFER_IN",
        "RETURN",
        "SALE",
      ],
      entity_status: ["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED", "PENDING"],
      entity_type_enum: ["ORDER", "DOCUMENT", "MOVEMENT", "VARIANT"],
      event_code_enum: [
        "purchase_order_created",
        "purchase_order_approved",
        "supplier_invoice_precleared",
        "receipt_in_conference_cd",
        "receipt_item_scanned_ok",
        "receipt_item_scanned_diff",
        "transfer_order_created",
        "separation_map_created",
        "separation_in_progress",
        "separation_invoiced",
        "store_receipt_start",
        "store_receipt_effective",
        "sale_completed",
        "return_same_store",
        "return_other_store",
        "manual_exchange_created",
        "sale",
        "return",
        "transfer",
        "adjustment",
        "receipt_ok_cd",
        "return_waiting",
        "return_completed",
        "catalog_sync",
        "stock_adjustment",
        "pricing_update",
      ],
      export_status_enum: [
        "requested",
        "processing",
        "completed",
        "failed",
        "expired",
        "REQUESTED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "EXPIRED",
      ],
      gender_enum: ["MAS", "FEM", "USX"],
      internal_invoice_item_store_conference_status: ["OK", "DIVERGENTE"],
      internal_invoice_type: [
        "TRANSFERENCIA_LOJA",
        "BONIFICACAO_FORNECEDOR",
        "DEVOLUCAO_FORNECEDOR",
        "DEVOLUCAO_CLIENTE_MESMA_LOJA",
        "DEVOLUCAO_CLIENTE_OUTRA_LOJA_RECEBIMENTO",
        "TRANSFERENCIA_DEVOLUCAO_CLIENTE_PARA_LOJA_RECEBEDORA",
        "TRANSFERENCIA_DEFEITO_PARA_CD",
      ],
      internal_transfer_status: ["EMITIDA", "FINALIZADA_LOJA", "CANCELADA"],
      location_type: ["CD", "LOJA"],
      location_type_enum: ["CD", "STORE"],
      mfa_method_enum: ["email", "whatsapp", "EMAIL", "WHATSAPP"],
      mfa_reset_status_enum: [
        "pending",
        "approved",
        "rejected",
        "expired",
        "completed",
      ],
      module_auto_enable_policy: ["NONE", "NEW_TENANTS", "ALL_TENANTS"],
      module_category: [
        "standard",
        "custom",
        "industry",
        "analytics",
        "operations",
      ],
      module_maturity_status: [
        "PLANNED",
        "IN_DEVELOPMENT",
        "ALPHA",
        "BETA",
        "RC",
        "GA",
        "MAINTENANCE",
        "DEPRECATED",
        "RETIRED",
      ],
      module_request_policy: ["DENY_ALL", "MANUAL_APPROVAL", "AUTO_APPROVE"],
      module_status: [
        "planned",
        "implemented",
        "active",
        "inactive",
        "cancelled",
        "paused",
        "discovered",
        "missing",
        "archived",
        "orphaned",
      ],
      module_tenant_status: [
        "REQUESTED",
        "PENDING_APPROVAL",
        "PROVISIONING",
        "ENABLED",
        "UPGRADING",
        "UP_TO_DATE",
        "SUSPENDED",
        "DISABLED",
        "ARCHIVED",
        "ERROR",
      ],
      module_visibility_enum: ["HIDDEN", "INTERNAL", "PUBLIC"],
      module_visibility_policy: ["HIDDEN", "INTERNAL", "PUBLIC"],
      movement_type_enum: [
        "CD_RECEIPT",
        "CD_TRANSFER",
        "STORE_RECEIPT",
        "SALE",
        "RETURN",
        "INVENTORY_ADJUSTMENT",
      ],
      operational_status_enum: [
        "REQUESTED",
        "PENDING_APPROVAL",
        "PROVISIONING",
        "ENABLED",
        "UPGRADING",
        "UP_TO_DATE",
        "SUSPENDED",
        "DISABLED",
        "ARCHIVED",
        "ERROR",
      ],
      order_status_enum: ["NEW", "APPROVED", "CANCELLED"],
      order_type_enum: ["TRANSFER", "PURCHASE"],
      purchase_order_status: ["NOVO", "APROVADO", "NAO_APROVADO", "CANCELADO"],
      request_policy_enum: ["DENY_ALL", "MANUAL_APPROVAL", "AUTO_APPROVE"],
      rls_entity_type: ["core_suppliers", "core_locations", "core_products"],
      rls_operation_type: ["INSERT", "UPDATE", "DELETE", "POLICY_VIOLATION"],
      role_enum: [
        "organization_admin",
        "editor",
        "reader",
        "visitor",
        "master_admin",
      ],
      sale_status: [
        "CONCLUIDA",
        "CANCELADA",
        "PARCIALMENTE_DEVOLVIDA",
        "TOTALMENTE_DEVOLVIDA",
      ],
      supplier_invoice_item_conference_status: [
        "SEM_DIVERGENCIA",
        "DIVERGENTE_A_MAIS",
        "DIVERGENTE_A_MENOS",
        "PRODUTO_ERRADO",
      ],
      supplier_invoice_status: [
        "PENDENTE",
        "PRE_BAIXA",
        "BAIXA",
        "FATURADO",
        "AGUARDANDO_SEPARACAO",
        "EM_CONFERENCIA",
        "CANCELADA",
        "CONFERIDO_DIVERGENTE",
        "CONFERIDO_NAO_DIVERGENTE",
        "EM_SEPARACAO",
        "FALHA_NFE",
        "SEPARADO",
        "ENVIADO_DOCA",
        "EMBARCADO",
        "FALHA_EMBARQUE",
      ],
      tenant_operational_status: [
        "REQUESTED",
        "PENDING_APPROVAL",
        "PROVISIONING",
        "ENABLED",
        "UPGRADING",
        "UP_TO_DATE",
        "SUSPENDED",
        "DISABLED",
        "ARCHIVED",
        "ERROR",
      ],
      tenant_type: ["STANDARD", "INTERNAL_TESTER", "BETA_TESTER", "ENTERPRISE"],
      transaction_status: [
        "DRAFT",
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "SHIPPED",
        "COMPLETED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED",
        "FAILED",
        "EXPIRED",
        "ON_HOLD",
        "PROCESSING",
        "DELIVERED",
        "ISSUED",
        "SENT",
        "OVERDUE",
      ],
      unit_measure_enum: ["PAR", "UND", "CX"],
      unit_measurement: ["Par", "Und", "Cx"],
      user_status_enum: ["ACTIVE", "INACTIVE", "PENDING", "DELETED"],
      widget_type: ["executive_dashboard", "fashion_kpis", "insights_board"],
    },
  },
} as const
