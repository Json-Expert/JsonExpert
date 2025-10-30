import { JsonValue } from '@/types/json.types';
import { TreeNode, GraphNode, GraphEdge, TableRow } from '@/types/visualization.types';

import { detectJSONType } from './json-parser';

let nodeIdCounter = 0;

function generateNodeId(): string {
  return `node-${nodeIdCounter++}`;
}

// Cache for memoization (commented out due to type constraints)
// const transformCache = new WeakMap<object, {
//   tree?: TreeNode;
//   graph?: { nodes: GraphNode[]; edges: GraphEdge[] };
//   table?: TableRow[];
// }>();

export function jsonToTreeNodes(
  data: JsonValue,
  path: string[] = [],
  expandLevel: number = 2
): TreeNode {
  const id = generateNodeId();
  const type = detectJSONType(data);
  const depth = path.length;
  const expanded = depth < expandLevel;

  const node: TreeNode = {
    id,
    path,
    key: path[path.length - 1] || 'root',
    value: data,
    type,
    children: [],
    expanded,
    depth,
  };

  if (type === 'object' && data !== null) {
    const obj = data as Record<string, JsonValue>;
    node.children = Object.entries(obj).map(([key, value]) =>
      jsonToTreeNodes(value, [...path, key], expandLevel)
    );
  } else if (type === 'array') {
    const arr = data as JsonValue[];
    node.children = arr.map((item, index) =>
      jsonToTreeNodes(item, [...path, `[${index}]`], expandLevel)
    );
  }

  return node;
}

export function jsonToGraph(data: JsonValue): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new WeakSet();
  let depth = 0;

  function traverse(
    value: JsonValue,
    parentId?: string,
    key?: string,
    currentDepth: number = 0
  ): string {
    const id = generateNodeId();
    const type = detectJSONType(value);
    depth = Math.max(depth, currentDepth);

    if (type === 'object' && value !== null && typeof value === 'object') {
      if (visited.has(value)) {
        return id; // Avoid circular references
      }
      visited.add(value);

      nodes.push({
        id,
        label: key || 'Object',
        type: 'object',
        data: value,
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          ...(key ? { label: key } : {})
        });
      }

      const obj = value as Record<string, JsonValue>;
      Object.entries(obj).forEach(([childKey, childValue]) => {
        traverse(childValue, id, childKey, currentDepth + 1);
      });
    } else if (type === 'array' && Array.isArray(value)) {
      if (visited.has(value)) {
        return id;
      }
      visited.add(value);

      nodes.push({
        id,
        label: key || 'Array',
        type: 'array',
        data: value,
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          ...(key ? { label: key } : {})
        });
      }

      const arr = value as JsonValue[];
      arr.forEach((item, index) => {
        traverse(item, id, `[${index}]`, currentDepth + 1);
      });
    } else {
      nodes.push({
        id,
        label: `${key || 'Value'}: ${JSON.stringify(value)}`,
        type: 'value',
        data: value,
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          ...(key ? { label: key } : {})
        });
      }
    }

    return id;
  }

  // Start traversal from root
  traverse(data, undefined, 'root', 0);
  
  // Sort nodes by their creation order to maintain hierarchy
  nodes.sort((a, b) => {
    const aNum = parseInt(a.id.split('-')[1] || '0');
    const bNum = parseInt(b.id.split('-')[1] || '0');
    return aNum - bNum;
  });
  
  return { nodes, edges };
}

export function jsonToTableRows(data: JsonValue): TableRow[] {
  const rows: TableRow[] = [];
  let rowId = 0;

  function flatten(
    value: JsonValue,
    path: string[] = [],
    depth: number = 0
  ): void {
    const type = detectJSONType(value);
    const pathString = path.join('.');
    const key = path[path.length - 1] || 'root';

    if (type === 'object' && value !== null) {
      const obj = value as Record<string, JsonValue>;
      Object.entries(obj).forEach(([k, v]) => {
        flatten(v, [...path, k], depth + 1);
      });
    } else if (type === 'array') {
      const arr = value as JsonValue[];
      arr.forEach((item, index) => {
        flatten(item, [...path, `[${index}]`], depth + 1);
      });
    } else {
      rows.push({
        id: `row-${rowId++}`,
        path: pathString,
        key,
        value: value,
        type,
        depth,
      });
    }
  }

  flatten(data);
  return rows;
}

export function filterTreeNodes(
  node: TreeNode,
  searchQuery: string
): TreeNode | null {
  if (!searchQuery) return node;

  const query = searchQuery.toLowerCase();
  const keyMatches = node.key.toLowerCase().includes(query);
  const valueMatches =
    typeof node.value === 'string' &&
    node.value.toLowerCase().includes(query);

  const filteredChildren = node.children
    .map((child) => filterTreeNodes(child, searchQuery))
    .filter((child): child is TreeNode => child !== null);

  if (keyMatches || valueMatches || filteredChildren.length > 0) {
    return {
      ...node,
      children: filteredChildren,
      expanded: true, // Expand nodes that match search
    };
  }

  return null;
}

export function getJsonPath(path: string[]): string {
  return path.reduce((acc, part) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return `${acc}${part}`;
    }
    return acc ? `${acc}.${part}` : part;
  }, '');
}