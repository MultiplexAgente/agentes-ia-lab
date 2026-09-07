export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'telegram';

export type ConversationStatus = 
  | 'NEW'
  | 'ACTIVE'
  | 'WAITING_CUSTOMER'
  | 'WAITING_PAYMENT'
  | 'WAITING_HUMAN'
  | 'HUMAN_ACTIVE'
  | 'COMPLETED'
  | 'CLOSED';

export type MessageSenderType = 'customer' | 'agent' | 'human';

export interface Company {
  id: string;
  name: string;
  slug: string;
  document?: string;
  phone?: string;
  email?: string;
  plan: string;
  active: boolean;
  created_at?: string;
}

export interface Agent {
  id: string;
  company_id: string;
  name: string;
  description: string;
  system_prompt: string;
  language: string;
  active: boolean;
  auto_reply: boolean;
  human_handoff_enabled: boolean;
  model: string;
  temperature: number;
}

export interface AgentPersonality {
  agent_id: string;
  company_id: string;
  tone: 'friendly' | 'professional' | 'casual' | 'objective';
  formality: 'formal' | 'informal' | 'balanced';
  use_emojis: boolean;
  response_length: 'short' | 'concise' | 'detailed';
  commercial_style: 'consultative' | 'direct' | 'aggressive';
  custom_instructions?: string;
}

export interface AgentRule {
  id: string;
  agent_id: string;
  company_id: string;
  rule_text: string;
  priority: number; // Maior = mais prioritário
  condition_trigger?: string;
  action_type?: string;
  active: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  category_id?: string;
  category?: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
  active?: boolean;
  stock?: number;
  ingredients: string[];
  preparation_time_minutes?: number;
  variations?: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  variation_type: 'addon' | 'size' | 'flavor';
  additional_price: number;
  available: boolean;
}

export interface ProductCategory {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  address?: Record<string, any> | string;
  notes?: string;
  total_orders?: number;
  lifetime_value?: number;
  created_at?: string;
  last_order_at?: string;
}

export interface Conversation {
  id: string;
  company_id: string;
  customer_id: string;
  agent_id?: string;
  channel_type: ChannelType;
  status: ConversationStatus;
  last_message_text?: string;
  last_message_at?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  customer?: Customer;
  external_chat_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  company_id: string;
  sender_type: MessageSenderType;
  external_message_id?: string;
  text: string;
  media_type: 'text' | 'image' | 'audio' | 'document';
  media_url?: string;
  status: 'received' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

export interface StructuredKnowledgeItem {
  id: string;
  company_id: string;
  item_type: 'product_price' | 'delivery_fee' | 'business_hour' | 'policy' | 'correction';
  subject: string;
  data: Record<string, any>;
  source: 'manual' | 'chat_training' | 'correction' | 'document';
  history: Array<{
    timestamp: string;
    action: string;
    previous_data?: any;
    new_data: any;
    reason?: string;
  }>;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  company_id: string;
  customer_id: string;
  conversation_id?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED' | 'delivered' | 'pending' | 'confirmed' | string;
  subtotal?: number;
  delivery_fee?: number;
  total?: number;
  total_amount?: number;
  payment_status?: string;
  delivery_address?: Record<string, any> | string;
  payment_method?: string;
  notes?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  selected_addons?: Array<{ name: string; price: number }>;
  item_total: number;
}

export interface AgentMemoryItem {
  id: string;
  company_id: string;
  customer_id: string;
  memory_type: 'preference' | 'restriction' | 'order_habit' | 'address';
  key: string;
  value: string;
  confidence: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolExecutionResult {
  tool_name: string;
  arguments: Record<string, any>;
  result: any;
  error?: string;
}

export interface AIServiceResponse {
  response_text: string;
  conversation_id: string;
  tools_called: ToolExecutionResult[];
  knowledge_used: any[];
  rules_applied: string[];
  tokens_used: {
    prompt: number;
    completion: number;
    total: number;
  };
  latency_ms: number;
  handoff_triggered: boolean;
}

// =========================================================================
// SINCRONIZAÇÃO AUTOMÁTICA DE SITE E FONTES DE CONHECIMENTO
// =========================================================================

export type BusinessType = 
  | 'RESTAURANTE' 
  | 'LOJA' 
  | 'ECOMMERCE' 
  | 'IMOBILIÁRIA' 
  | 'CONCESSIONÁRIA' 
  | 'HOTEL' 
  | 'SERVIÇOS' 
  | 'EMPRESA_GERAL'
  | 'OUTRO';

export type SourceType = 'site' | 'document' | 'text' | 'file' | 'other' | 'SITE' | 'DOCUMENT' | 'TEXT' | 'FILE' | 'OTHER';
export type SyncFrequency = '1h' | '6h' | '12h' | '24h' | 'weekly' | 'semanal';

export interface KnowledgeSource {
  id: string;
  company_id: string;
  name: string;
  type?: SourceType;
  source_type?: SourceType;
  url: string;
  business_type?: BusinessType;
  auto_sync: boolean;
  sync_frequency: SyncFrequency;
  status: 'connected' | 'syncing' | 'error' | 'pending' | 'ACTIVE' | 'ERROR' | 'PENDING';
  last_sync_at?: string;
  last_synced_at?: string;
  last_sync_status?: 'SUCCESS' | 'FAILED' | 'WARNING';
  next_sync_at?: string;
  items_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SourceSyncRun {
  id: string;
  company_id: string;
  source_id: string;
  started_at: string;
  finished_at?: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  items_found: number;
  items_created: number;
  items_updated: number;
  items_removed: number;
  items_unchanged: number;
  errors?: string[];
  error_message?: string;
  duration_ms?: number;
}

export interface SourceSyncChange {
  id: string;
  sync_run_id?: string;
  run_id?: string;
  item_id: string;
  item_title?: string;
  item_name?: string;
  change_type: 'CREATED' | 'UPDATED' | 'REMOVED' | 'PRICE_CHANGED' | 'AVAILABILITY_CHANGED';
  field?: string;
  old_value?: any;
  new_value?: any;
  old_data?: any;
  new_data?: any;
  created_at: string;
}

export interface NormalizedCatalogItem {
  id: string;
  company_id: string;
  source_id: string;
  external_id?: string;
  source_url?: string;
  item_type?: 'product' | 'property' | 'menu_item' | 'service' | 'other';
  title?: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  availability?: boolean;
  sku?: string;
  brand?: string;
  images?: string[];
  attributes?: Record<string, any>;
  property_details?: {
    property_type: string;
    transaction_type: 'venda' | 'aluguel' | 'temporada';
    condominium_fee?: number;
    iptu?: number;
    bedrooms?: number;
    suites?: number;
    bathrooms?: number;
    parking_spaces?: number;
    built_area?: number;
    land_area?: number;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    amenities?: string[];
  };
  menu_details?: {
    ingredients?: string[];
    variations?: Array<{ name: string; additional_price: number }>;
    add_ons?: string[];
  };
  service_details?: {
    duration_minutes?: number;
    provider?: string;
  };
  raw_data?: any;
  content_hash: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'REMOVED' | 'OUT_OF_STOCK';
  last_seen_at?: string;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

// =========================================================================
// AI APP BUILDER — CONSTRUTOR DE FUNCIONALIDADES COM IA
// =========================================================================

export type UIComponentType = 
  | 'metric' 
  | 'kpi' 
  | 'chart' 
  | 'table' 
  | 'filter' 
  | 'form' 
  | 'card' 
  | 'section' 
  | 'divider';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut';

export interface UIComponent {
  id: string;
  type: UIComponentType;
  title: string;
  description?: string;
  dataSource?: 'orders' | 'payments' | 'expenses' | 'customers' | 'products' | 'conversations' | string;
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  field?: string;
  format?: 'currency' | 'number' | 'percentage' | 'date';
  currency?: string;
  chartType?: ChartType;
  groupBy?: string;
  filter?: Record<string, any>;
  columns?: Array<{ key: string; label: string; format?: string }>;
  fields?: Array<{ name: string; label: string; type: string; required?: boolean }>;
  actions?: Array<{ label: string; action: string }>;
  badge?: string;
  data?: any; // preloaded or static fallback
}

export interface UISection {
  id: string;
  title?: string;
  description?: string;
  columns?: number; // 1, 2, 3, 4
  components: UIComponent[];
}

export interface UISchema {
  title: string;
  description?: string;
  icon?: string;
  layout?: 'dashboard' | 'crud' | 'report' | 'custom';
  period_filter_enabled?: boolean;
  sections: UISection[];
}

export interface AIBuilderModule {
  id: string;
  company_id: string;
  agent_id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category?: string;
  status: 'active' | 'draft' | 'archived';
  schema: UISchema;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AIBuilderModuleVersion {
  id: string;
  module_id: string;
  version: number;
  schema: UISchema;
  prompt: string;
  build_plan?: any;
  created_by: string;
  created_at: string;
}

export interface AIBuildPlan {
  action: 'create_module' | 'patch_module' | 'delete_module' | 'query_data';
  target_module?: {
    id?: string;
    name: string;
    slug: string;
  };
  summary: string;
  components_summary: string[];
  data_sources: string[];
  risk_level: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  suggested_schema: UISchema;
}

export interface Expense {
  id: string;
  company_id: string;
  title: string;
  category: string;
  amount: number;
  status: 'paid' | 'pending';
  due_date: string;
  paid_at?: string;
  created_at: string;
}

