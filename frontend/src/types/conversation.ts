export type AIConversationRole = 'user' | 'assistant' | 'system' | 'tool';

export type AIConversationStatus = 
  | 'ACTIVE' 
  | 'WAITING_USER' 
  | 'EXECUTING' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface AIConversationContext {
  page?: string;
  module?: string;
  action?: string;
  entity?: string;
  entity_id?: string;
  current_record?: Record<string, any>;
  editable_fields?: string[];
  integration_context?: string;
  permissions?: string[];
  available_tools?: string[];
}

export interface AIConversationSuggestedOption {
  label: string;
  value: string;
  action_type?: 'reply' | 'execute' | 'cancel' | 'navigate';
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface AIConversationMessage {
  id: string;
  conversation_id: string;
  company_id: string;
  user_id: string;
  role: AIConversationRole;
  content: string;
  context?: AIConversationContext;
  intent?: string;
  suggested_options?: AIConversationSuggestedOption[];
  plan?: any;
  status?: AIConversationStatus;
  feedback?: 'thumbs_up' | 'thumbs_down';
  created_at: string;
}

export interface AIConversation {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  context: AIConversationContext;
  status: AIConversationStatus;
  created_at: string;
  updated_at: string;
}
