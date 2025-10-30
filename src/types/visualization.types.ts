export type VisualizationType = 'tree' | 'graph' | 'table' | 'raw';

export interface TreeNode {
  id: string;
  path: string[];
  key: string;
  value: any;
  type: string;
  children: TreeNode[];
  expanded: boolean;
  depth: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'object' | 'array' | 'value' | 'image' | 'url' | 'large-text' | 'expand-button' | 'collapse-button' | 'sibling-selector' | 'more';
  data: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: any;
}

export interface TableRow {
  id: string;
  path: string;
  key: string;
  value: any;
  type: string;
  depth: number;
}

export interface VisualizationConfig {
  maxDepth?: number;
  expandLevel?: number;
  showTypes?: boolean;
  theme?: 'light' | 'dark';
}