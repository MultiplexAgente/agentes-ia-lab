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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      agent_memory: {
        Row: {
          agent_id: string | null
          company_id: string
          confidence: number | null
          confidence_level: string | null
          conversation_id: string | null
          created_at: string | null
          customer_id: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_current: boolean | null
          key: string
          memory_type: string
          memory_type_v2: string | null
          message_id: string | null
          source: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          value: string
          value_json: Json | null
          visibility: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id: string
          confidence?: number | null
          confidence_level?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_id: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_current?: boolean | null
          key: string
          memory_type: string
          memory_type_v2?: string | null
          message_id?: string | null
          source?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          value: string
          value_json?: Json | null
          visibility?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string
          confidence?: number | null
          confidence_level?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_current?: boolean | null
          key?: string
          memory_type?: string
          memory_type_v2?: string | null
          message_id?: string | null
          source?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          value?: string
          value_json?: Json | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memory_audit: {
        Row: {
          action: string
          company_id: string
          conversation_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          memory_id: string
          message_id: string | null
          new_value: string | null
          new_value_json: Json | null
          performed_by: string | null
          previous_value: string | null
          previous_value_json: Json | null
          reason: string | null
          source: string | null
        }
        Insert: {
          action: string
          company_id: string
          conversation_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          memory_id: string
          message_id?: string | null
          new_value?: string | null
          new_value_json?: Json | null
          performed_by?: string | null
          previous_value?: string | null
          previous_value_json?: Json | null
          reason?: string | null
          source?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          memory_id?: string
          message_id?: string | null
          new_value?: string | null
          new_value_json?: Json | null
          performed_by?: string | null
          previous_value?: string | null
          previous_value_json?: Json | null
          reason?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_audit_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_audit_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_audit_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_audit_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "agent_memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_audit_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_personality: {
        Row: {
          agent_id: string
          commercial_style: string | null
          company_id: string
          created_at: string | null
          custom_instructions: string | null
          formality: string | null
          id: string
          response_length: string | null
          tone: string | null
          updated_at: string | null
          use_emojis: boolean | null
        }
        Insert: {
          agent_id: string
          commercial_style?: string | null
          company_id: string
          created_at?: string | null
          custom_instructions?: string | null
          formality?: string | null
          id?: string
          response_length?: string | null
          tone?: string | null
          updated_at?: string | null
          use_emojis?: boolean | null
        }
        Update: {
          agent_id?: string
          commercial_style?: string | null
          company_id?: string
          created_at?: string | null
          custom_instructions?: string | null
          formality?: string | null
          id?: string
          response_length?: string | null
          tone?: string | null
          updated_at?: string | null
          use_emojis?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_personality_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_personality_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_rules: {
        Row: {
          action_type: string | null
          active: boolean | null
          agent_id: string
          company_id: string
          condition_trigger: string | null
          created_at: string | null
          id: string
          priority: number | null
          rule_text: string
          updated_at: string | null
        }
        Insert: {
          action_type?: string | null
          active?: boolean | null
          agent_id: string
          company_id: string
          condition_trigger?: string | null
          created_at?: string | null
          id?: string
          priority?: number | null
          rule_text: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string | null
          active?: boolean | null
          agent_id?: string
          company_id?: string
          condition_trigger?: string | null
          created_at?: string | null
          id?: string
          priority?: number | null
          rule_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_settings: {
        Row: {
          agent_id: string
          allow_orders: boolean | null
          allow_payments: boolean | null
          company_id: string
          created_at: string | null
          fallback_message: string | null
          id: string
          max_tokens_per_response: number | null
          out_of_hours_message: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          allow_orders?: boolean | null
          allow_payments?: boolean | null
          company_id: string
          created_at?: string | null
          fallback_message?: string | null
          id?: string
          max_tokens_per_response?: number | null
          out_of_hours_message?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          allow_orders?: boolean | null
          allow_payments?: boolean | null
          company_id?: string
          created_at?: string | null
          fallback_message?: string | null
          id?: string
          max_tokens_per_response?: number | null
          out_of_hours_message?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          company_id: string
          created_at: string | null
          description: string
          enabled: boolean | null
          id: string
          name: string
          parameters: Json
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description: string
          enabled?: boolean | null
          id?: string
          name: string
          parameters: Json
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string
          enabled?: boolean | null
          id?: string
          name?: string
          parameters?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tools_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          active: boolean | null
          auto_reply: boolean | null
          company_id: string
          created_at: string | null
          description: string | null
          human_handoff_enabled: boolean | null
          id: string
          language: string | null
          model: string | null
          name: string
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          auto_reply?: boolean | null
          company_id: string
          created_at?: string | null
          description?: string | null
          human_handoff_enabled?: boolean | null
          id?: string
          language?: string | null
          model?: string | null
          name: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          auto_reply?: boolean | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          human_handoff_enabled?: boolean | null
          id?: string
          language?: string | null
          model?: string | null
          name?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_background_jobs: {
        Row: {
          company_id: string
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          input_reference: Json
          model: string | null
          provider: string | null
          result_reference: Json | null
          status: string
          task_type: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_reference?: Json
          model?: string | null
          provider?: string | null
          result_reference?: Json | null
          status?: string
          task_type: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_reference?: Json
          model?: string | null
          provider?: string | null
          result_reference?: Json | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_background_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_builder_actions: {
        Row: {
          action: string
          agent_id: string | null
          build_plan: Json | null
          changes: Json | null
          company_id: string
          created_at: string | null
          error: string | null
          id: string
          module_id: string | null
          prompt: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          agent_id?: string | null
          build_plan?: Json | null
          changes?: Json | null
          company_id: string
          created_at?: string | null
          error?: string | null
          id?: string
          module_id?: string | null
          prompt?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          agent_id?: string | null
          build_plan?: Json | null
          changes?: Json | null
          company_id?: string
          created_at?: string | null
          error?: string | null
          id?: string
          module_id?: string | null
          prompt?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_builder_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_builder_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_builder_actions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "ai_builder_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_builder_module_versions: {
        Row: {
          build_plan: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          module_id: string
          prompt: string
          schema: Json
          version: number
        }
        Insert: {
          build_plan?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          module_id: string
          prompt: string
          schema: Json
          version: number
        }
        Update: {
          build_plan?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          module_id?: string
          prompt?: string
          schema?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_builder_module_versions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "ai_builder_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_builder_modules: {
        Row: {
          agent_id: string | null
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          schema: Json
          slug: string
          status: string | null
          updated_at: string | null
          version: number
        }
        Insert: {
          agent_id?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          schema?: Json
          slug: string
          status?: string | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          agent_id?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          schema?: Json
          slug?: string
          status?: string | null
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_builder_modules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_builder_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          ai_response: string | null
          company_id: string
          conversation_id: string | null
          created_at: string | null
          error: string | null
          estimated_cost_usd: number | null
          id: string
          incoming_message: string | null
          knowledge_retrieved: Json | null
          latency_ms: number | null
          system_prompt_used: string | null
          tokens_completion: number | null
          tokens_prompt: number | null
          tools_called: Json | null
        }
        Insert: {
          ai_response?: string | null
          company_id: string
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          estimated_cost_usd?: number | null
          id?: string
          incoming_message?: string | null
          knowledge_retrieved?: Json | null
          latency_ms?: number | null
          system_prompt_used?: string | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tools_called?: Json | null
        }
        Update: {
          ai_response?: string | null
          company_id?: string
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          estimated_cost_usd?: number | null
          id?: string
          incoming_message?: string | null
          knowledge_retrieved?: Json | null
          latency_ms?: number | null
          system_prompt_used?: string | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tools_called?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_routing_audit: {
        Row: {
          agent_id: string | null
          assistant_message: string | null
          auxiliary_models: Json
          cached_input_tokens: number
          channel: string
          company_id: string
          complexity: string
          context_sources: Json | null
          conversation_id: string | null
          cost_status: string | null
          cost_usd: number | null
          created_at: string
          error: string | null
          fallback_from: string | null
          fallback_reason: string | null
          fallback_to: string | null
          fallback_triggered: boolean
          fallback_used: boolean
          finish_reason: string | null
          id: string
          latency_ms: number | null
          message_id: string | null
          model_alias: string | null
          model_selected: string
          model_used: string
          provider: string | null
          request_metadata: Json
          response_hash: string | null
          response_id: string | null
          response_model: string | null
          routing_reason: string | null
          routing_signals: Json | null
          strategy: string
          task_category: string
          task_type: string | null
          tokens_completion: number | null
          tokens_prompt: number | null
          tools_used: Json | null
          total_tokens: number
          user_message: string | null
        }
        Insert: {
          agent_id?: string | null
          assistant_message?: string | null
          auxiliary_models?: Json
          cached_input_tokens?: number
          channel?: string
          company_id: string
          complexity: string
          context_sources?: Json | null
          conversation_id?: string | null
          cost_status?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          fallback_from?: string | null
          fallback_reason?: string | null
          fallback_to?: string | null
          fallback_triggered?: boolean
          fallback_used?: boolean
          finish_reason?: string | null
          id?: string
          latency_ms?: number | null
          message_id?: string | null
          model_alias?: string | null
          model_selected: string
          model_used: string
          provider?: string | null
          request_metadata?: Json
          response_hash?: string | null
          response_id?: string | null
          response_model?: string | null
          routing_reason?: string | null
          routing_signals?: Json | null
          strategy: string
          task_category: string
          task_type?: string | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tools_used?: Json | null
          total_tokens?: number
          user_message?: string | null
        }
        Update: {
          agent_id?: string | null
          assistant_message?: string | null
          auxiliary_models?: Json
          cached_input_tokens?: number
          channel?: string
          company_id?: string
          complexity?: string
          context_sources?: Json | null
          conversation_id?: string | null
          cost_status?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          fallback_from?: string | null
          fallback_reason?: string | null
          fallback_to?: string | null
          fallback_triggered?: boolean
          fallback_used?: boolean
          finish_reason?: string | null
          id?: string
          latency_ms?: number | null
          message_id?: string | null
          model_alias?: string | null
          model_selected?: string
          model_used?: string
          provider?: string | null
          request_metadata?: Json
          response_hash?: string | null
          response_id?: string | null
          response_model?: string | null
          routing_reason?: string | null
          routing_signals?: Json | null
          strategy?: string
          task_category?: string
          task_type?: string | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tools_used?: Json | null
          total_tokens?: number
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_routing_audit_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_routing_audit_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_routing_audit_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_routing_settings: {
        Row: {
          auto_mode_enabled: boolean
          category_strategies: Json
          company_id: string
          default_model_alias: string
          model_prices: Json
          monthly_budget_usd: number | null
          reveal_model: boolean
          strategy: string
          updated_at: string
        }
        Insert: {
          auto_mode_enabled?: boolean
          category_strategies?: Json
          company_id: string
          default_model_alias?: string
          model_prices?: Json
          monthly_budget_usd?: number | null
          reveal_model?: boolean
          strategy?: string
          updated_at?: string
        }
        Update: {
          auto_mode_enabled?: boolean
          category_strategies?: Json
          company_id?: string
          default_model_alias?: string
          model_prices?: Json
          monthly_budget_usd?: number | null
          reveal_model?: boolean
          strategy?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_routing_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          agent_id: string | null
          cached_input_tokens: number
          company_id: string
          conversation_id: string | null
          created_at: string
          estimated_cost: number | null
          fallback_from: string | null
          fallback_reason: string | null
          fallback_to: string | null
          fallback_triggered: boolean
          id: string
          input_tokens: number
          latency_ms: number | null
          message_id: string | null
          model: string
          model_alias: string | null
          output_tokens: number
          provider: string | null
          response_id: string | null
          routing_reason: string | null
          task_type: string | null
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          cached_input_tokens?: number
          company_id: string
          conversation_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          fallback_from?: string | null
          fallback_reason?: string | null
          fallback_to?: string | null
          fallback_triggered?: boolean
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          message_id?: string | null
          model: string
          model_alias?: string | null
          output_tokens?: number
          provider?: string | null
          response_id?: string | null
          routing_reason?: string | null
          task_type?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          cached_input_tokens?: number
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          fallback_from?: string | null
          fallback_reason?: string | null
          fallback_to?: string | null
          fallback_triggered?: boolean
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          message_id?: string | null
          model?: string
          model_alias?: string | null
          output_tokens?: number
          provider?: string | null
          response_id?: string | null
          routing_reason?: string | null
          task_type?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_company_id_fkey1"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_daily_legacy: {
        Row: {
          company_id: string
          date: string
          id: string
          total_calls: number | null
          total_cost_usd: number | null
          total_tokens: number | null
        }
        Insert: {
          company_id: string
          date?: string
          id?: string
          total_calls?: number | null
          total_cost_usd?: number | null
          total_tokens?: number | null
        }
        Update: {
          company_id?: string
          date?: string
          id?: string
          total_calls?: number | null
          total_cost_usd?: number | null
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          close_time: string
          closed: boolean | null
          company_id: string
          created_at: string | null
          day_of_week: number
          id: string
          open_time: string
          updated_at: string | null
        }
        Insert: {
          close_time: string
          closed?: boolean | null
          company_id: string
          created_at?: string | null
          day_of_week: number
          id?: string
          open_time: string
          updated_at?: string | null
        }
        Update: {
          close_time?: string
          closed?: boolean | null
          company_id?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          open_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_clicks: {
        Row: {
          catalog_item_id: string
          clicked_at: string | null
          company_id: string
          conversation_id: string | null
          customer_id: string | null
          id: string
          item_entity_type: string | null
          item_name: string | null
          source_url: string | null
        }
        Insert: {
          catalog_item_id: string
          clicked_at?: string | null
          company_id: string
          conversation_id?: string | null
          customer_id?: string | null
          id?: string
          item_entity_type?: string | null
          item_name?: string | null
          source_url?: string | null
        }
        Update: {
          catalog_item_id?: string
          clicked_at?: string | null
          company_id?: string
          conversation_id?: string | null
          customer_id?: string | null
          id?: string
          item_entity_type?: string | null
          item_name?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_clicks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_clicks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_clicks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_searches: {
        Row: {
          category: string | null
          company_id: string
          conversation_id: string | null
          created_at: string | null
          customer_id: string | null
          entity_type: string | null
          filters: Json | null
          id: string
          is_alternative: boolean | null
          query: string | null
          results_count: number | null
          results_shown_ids: string[] | null
        }
        Insert: {
          category?: string | null
          company_id: string
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          entity_type?: string | null
          filters?: Json | null
          id?: string
          is_alternative?: boolean | null
          query?: string | null
          results_count?: number | null
          results_shown_ids?: string[] | null
        }
        Update: {
          category?: string | null
          company_id?: string
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          entity_type?: string | null
          filters?: Json | null
          id?: string
          is_alternative?: boolean | null
          query?: string | null
          results_count?: number | null
          results_shown_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_searches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_searches_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_searches_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_credentials: {
        Row: {
          access_token: string | null
          account_id: string | null
          app_secret: string | null
          channel_id: string
          company_id: string
          created_at: string | null
          extra_config: Json | null
          id: string
          phone_number_id: string | null
          updated_at: string | null
          verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          app_secret?: string | null
          channel_id: string
          company_id: string
          created_at?: string | null
          extra_config?: Json | null
          id?: string
          phone_number_id?: string | null
          updated_at?: string | null
          verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          app_secret?: string | null
          channel_id?: string
          company_id?: string
          created_at?: string | null
          extra_config?: Json | null
          id?: string
          phone_number_id?: string | null
          updated_at?: string | null
          verify_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_credentials_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          id: string
          name: string
          status: string | null
          type: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          type: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          type?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean | null
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          plan: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          plan?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          plan?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          email: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          email: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          assigned_user_id: string | null
          channel_type: string
          company_id: string
          created_at: string | null
          customer_id: string
          id: string
          last_message_at: string | null
          last_message_text: string | null
          metadata: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          assigned_user_id?: string | null
          channel_type: string
          company_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          metadata?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          assigned_user_id?: string | null
          channel_type?: string
          company_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          metadata?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_channels: {
        Row: {
          channel_type: string
          company_id: string
          created_at: string | null
          customer_id: string
          external_id: string
          id: string
          profile_name: string | null
          updated_at: string | null
        }
        Insert: {
          channel_type: string
          company_id: string
          created_at?: string | null
          customer_id: string
          external_id: string
          id?: string
          profile_name?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          company_id?: string
          created_at?: string | null
          customer_id?: string
          external_id?: string
          id?: string
          profile_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_channels_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json | null
          avatar_url: string | null
          company_id: string
          created_at: string | null
          email: string | null
          id: string
          lifetime_value: number | null
          name: string | null
          notes: string | null
          phone: string | null
          total_orders: number | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          company_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          lifetime_value?: number | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          company_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          lifetime_value?: number | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_resolution_cache: {
        Row: {
          company_id: string
          confidence_level: string | null
          created_at: string | null
          customer_id: string
          id: string
          identifier_type: string
          identifier_value: string
          is_ambiguous: boolean | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          confidence_level?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          identifier_type: string
          identifier_value: string
          is_ambiguous?: boolean | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          confidence_level?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          identifier_type?: string
          identifier_value?: string
          is_ambiguous?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_resolution_cache_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_resolution_cache_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          amount: number
          category?: string | null
          company_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          active: boolean | null
          answer: string
          category: string | null
          company_id: string
          created_at: string | null
          id: string
          question: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          answer: string
          category?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          question: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          answer?: string
          category?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faq_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      human_handoffs: {
        Row: {
          assigned_to: string | null
          company_id: string
          conversation_id: string
          id: string
          reason: string | null
          resolved_at: string | null
          status: string | null
          transferred_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          conversation_id: string
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          transferred_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          conversation_id?: string
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          transferred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "human_handoffs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_handoffs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          company_id: string
          created_at: string | null
          direction: string
          error: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          service_name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          direction: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          service_name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          direction?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          active: boolean | null
          category: string
          company_id: string
          content: string
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          chunks_count: number | null
          company_id: string
          created_at: string | null
          extracted_text: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          chunks_count?: number | null
          company_id: string
          created_at?: string | null
          extracted_text?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          chunks_count?: number | null
          company_id?: string
          created_at?: string | null
          extracted_text?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          data: Json
          history: Json[] | null
          id: string
          item_type: string
          source: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          data: Json
          history?: Json[] | null
          id?: string
          item_type: string
          source?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          data?: Json
          history?: Json[] | null
          id?: string
          item_type?: string
          source?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          company_id: string
          created_at: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          company_id: string
          conversation_id: string
          created_at: string | null
          external_message_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          sender_type: string
          status: string | null
          text: string | null
        }
        Insert: {
          company_id: string
          conversation_id: string
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          sender_type: string
          status?: string | null
          text?: string | null
        }
        Update: {
          company_id?: string
          conversation_id?: string
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          sender_type?: string
          status?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          item_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          selected_addons: Json | null
          unit_price: number
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          item_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          selected_addons?: Json | null
          unit_price: number
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          item_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          selected_addons?: Json | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          conversation_id: string | null
          created_at: string | null
          customer_id: string
          delivery_address: Json | null
          delivery_fee: number
          id: string
          notes: string | null
          payment_method: string | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          conversation_id?: string | null
          created_at?: string | null
          customer_id: string
          delivery_address?: Json | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string
          delivery_address?: Json | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          id: string
          method: string
          order_id: string
          paid_at: string | null
          qr_code: string | null
          qr_code_url: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          id?: string
          method: string
          order_id: string
          paid_at?: string | null
          qr_code?: string | null
          qr_code_url?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          id?: string
          method?: string
          order_id?: string
          paid_at?: string | null
          qr_code?: string | null
          qr_code_url?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          additional_price: number | null
          available: boolean | null
          company_id: string
          created_at: string | null
          id: string
          name: string
          product_id: string
          variation_type: string | null
        }
        Insert: {
          additional_price?: number | null
          available?: boolean | null
          company_id: string
          created_at?: string | null
          id?: string
          name: string
          product_id: string
          variation_type?: string | null
        }
        Update: {
          additional_price?: number | null
          available?: boolean | null
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
          product_id?: string
          variation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean | null
          category_id: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          name: string
          preparation_time_minutes: number | null
          price: number
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name: string
          preparation_time_minutes?: number | null
          price: number
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name?: string
          preparation_time_minutes?: number | null
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_preferences: {
        Row: {
          company_id: string
          created_at: string
          id: string
          primary_model_alias: string
          primary_provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          primary_model_alias: string
          primary_provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          primary_model_alias?: string
          primary_provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          channel: string
          company_id: string
          created_at: string | null
          external_message_id: string
          id: string
          payload: Json
          processed: boolean | null
          response_status: string | null
        }
        Insert: {
          channel: string
          company_id: string
          created_at?: string | null
          external_message_id: string
          id?: string
          payload: Json
          processed?: boolean | null
          response_status?: string | null
        }
        Update: {
          channel?: string
          company_id?: string
          created_at?: string | null
          external_message_id?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          response_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      catalog_search_analytics: {
        Row: {
          avg_results: number | null
          company_id: string | null
          entity_type: string | null
          search_date: string | null
          total_searches: number | null
          zero_result_searches: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_searches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      expire_stale_memories: { Args: never; Returns: undefined }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
