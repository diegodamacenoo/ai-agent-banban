export interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  icon?: string;
  route_pattern?: string;
  permissions_required?: string[];
  supports_multi_tenant?: boolean;
  config_schema?: Record<string, any>;
  dependencies?: string[];
  version?: string;
  tags?: string[];
  status?: string;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  audience: string;
  complexity: string;
  is_default: boolean;
  is_active: boolean;
}
