export interface PluginControl {
  id: string;
  version?: string;
  description?: string;
  author?: string;
  repo?: string;
  enabled: boolean;
}
