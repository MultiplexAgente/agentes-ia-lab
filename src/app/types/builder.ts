export type UIComponentType = 
  | 'page' | 'section' | 'card' | 'metric' | 'kpi' | 'chart' 
  | 'table' | 'data_table' | 'list' | 'filter' | 'search' 
  | 'date_range' | 'select' | 'tabs' | 'badge' | 'progress' 
  | 'timeline' | 'form' | 'modal' | 'button' | 'empty_state' 
  | 'alert' | 'divider';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'horizontal_bar';

export interface UIComponent {
  id: string;
  type: UIComponentType;
  title: string;
  description?: string;
  dataSource?: string;
  chartType?: ChartType;
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  field?: string;
  columns?: Array<{ key: string; label: string }>;
  fields?: Array<{ name: string; label: string; type: string; required?: boolean }>;
  filter?: Record<string, any>;
  groupBy?: string;
  format?: 'currency' | 'number' | 'percentage' | 'date';
}

export interface UISection {
  id: string;
  title?: string;
  columns?: number;
  components: UIComponent[];
}

export interface UISchema {
  title: string;
  description: string;
  icon?: string;
  layout: 'dashboard' | 'crud' | 'form' | 'report';
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
  status: 'active' | 'archived';
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
  created_by?: string;
  created_at: string;
}

export interface AIBuildPlan {
  action: 'create_module' | 'patch_module' | 'delete_module' | 'query_only';
  target_module: {
    id?: string;
    name: string;
    slug: string;
  };
  summary: string;
  components_summary: string[];
  data_sources: string[];
  risk_level: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  suggested_schema?: UISchema;
  patch?: Array<{
    operation: 'add' | 'remove' | 'replace' | 'update';
    target_section?: string;
    component: UIComponent;
  }>;
}
