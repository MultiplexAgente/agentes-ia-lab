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
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
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
  address?: Record<string, any>;
  notes?: string;
  total_orders: number;
  lifetime_value: number;
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
  tags: string[];
  metadata?: Record<string, any>;
  customer?: Customer;
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
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: Record<string, any>;
  payment_method: string;
  notes?: string;
  items?: OrderItem[];
  created_at?: string;
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
