import { JsonValue } from '../types/json.types';
import { GraphNode, GraphEdge } from '../types/visualization.types';

import { detectJSONType } from './json-parser';

interface ExpandableGraphState {
  expandedNodes: Set<string>;
  maxSampleSize: number;
}

let nodeIdCounter = 0;
function generateNodeId(): string {
  return `node-${nodeIdCounter++}`;
}

export interface ExpandableGraphOptions {
  maxSampleSize?: number; // Her seviyede gösterilecek maksimum örnek sayısı
  initialExpandLevel?: number; // Başlangıçta kaç seviye açık olacak
}

const DEFAULT_OPTIONS: ExpandableGraphOptions = {
  maxSampleSize: 3,
  initialExpandLevel: 2,
};

export function jsonToExpandableGraph(
  data: JsonValue,
  options: ExpandableGraphOptions = {},
  state?: ExpandableGraphState
): { 
  nodes: GraphNode[]; 
  edges: GraphEdge[]; 
  state: ExpandableGraphState;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const graphState = state || {
    expandedNodes: new Set<string>(),
    maxSampleSize: opts.maxSampleSize!,
  };

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new WeakSet();

  function createExpandButton(parentId: string, totalCount: number, visibleCount: number): GraphNode {
    const buttonId = `${parentId}-expand`;
    return {
      id: buttonId,
      label: `... ve ${totalCount - visibleCount} tane daha`,
      type: 'expand-button',
      data: {
        parentId,
        totalCount,
        visibleCount,
        isExpandButton: true,
      },
    };
  }

  function createCollapseButton(parentId: string): GraphNode {
    const buttonId = `${parentId}-collapse`;
    return {
      id: buttonId,
      label: '▼ Daralt',
      type: 'collapse-button',
      data: {
        parentId,
        isCollapseButton: true,
      },
    };
  }

  function traverse(
    value: JsonValue,
    parentId?: string,
    key?: string,
    currentDepth: number = 0,
    arrayIndex?: number
  ): string {
    const id = generateNodeId();
    const type = detectJSONType(value);
    const isExpanded = graphState.expandedNodes.has(id) || currentDepth < (opts.initialExpandLevel || 2);

    if (type === 'object' && value !== null && typeof value === 'object') {
      if (visited.has(value)) {
        return id; // Circular reference koruması
      }
      visited.add(value);

      const obj = value as Record<string, JsonValue>;
      const entries = Object.entries(obj);
      const totalCount = entries.length;

      nodes.push({
        id,
        label: key ? `${key} (${totalCount} özellik)` : `Object (${totalCount} özellik)`,
        type: 'object',
        data: {
          ...value,
          totalCount,
          isExpanded,
          canExpand: totalCount > 0,
        },
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          label: key || (arrayIndex !== undefined ? `[${arrayIndex}]` : ''),
        });
      }

      if (isExpanded && totalCount > 0) {
        const visibleCount = Math.min(totalCount, graphState.maxSampleSize);
        const visibleEntries = entries.slice(0, visibleCount);

        // Görülebilir öğeleri ekle
        visibleEntries.forEach(([childKey, childValue]) => {
          traverse(childValue, id, childKey, currentDepth + 1);
        });

        // Daha fazla öğe varsa genişlet butonu ekle
        if (totalCount > visibleCount) {
          const expandButton = createExpandButton(id, totalCount, visibleCount);
          nodes.push(expandButton);
          edges.push({
            id: `edge-${id}-${expandButton.id}`,
            source: id,
            target: expandButton.id,
            label: 'genişlet',
          });
        }

        // Daralt butonu ekle (eğer genişletilmişse)
        if (graphState.expandedNodes.has(id)) {
          const collapseButton = createCollapseButton(id);
          nodes.push(collapseButton);
          edges.push({
            id: `edge-${id}-${collapseButton.id}`,
            source: id,
            target: collapseButton.id,
            label: 'daralt',
          });
        }
      }

    } else if (type === 'array' && Array.isArray(value)) {
      if (visited.has(value)) {
        return id;
      }
      visited.add(value);

      const arr = value as JsonValue[];
      const totalCount = arr.length;

      nodes.push({
        id,
        label: key ? `${key} [${totalCount}]` : `Array [${totalCount}]`,
        type: 'array',
        data: {
          value: arr,
          totalCount,
          isExpanded,
          canExpand: totalCount > 0,
        },
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          label: key || (arrayIndex !== undefined ? `[${arrayIndex}]` : ''),
        });
      }

      if (isExpanded && totalCount > 0) {
        const visibleCount = Math.min(totalCount, graphState.maxSampleSize);
        const visibleItems = arr.slice(0, visibleCount);

        // Görülebilir öğeleri ekle
        visibleItems.forEach((item, index) => {
          traverse(item, id, undefined, currentDepth + 1, index);
        });

        // Daha fazla öğe varsa genişlet butonu ekle
        if (totalCount > visibleCount) {
          const expandButton = createExpandButton(id, totalCount, visibleCount);
          nodes.push(expandButton);
          edges.push({
            id: `edge-${id}-${expandButton.id}`,
            source: id,
            target: expandButton.id,
            label: 'genişlet',
          });
        }

        // Daralt butonu ekle (eğer genişletilmişse)
        if (graphState.expandedNodes.has(id)) {
          const collapseButton = createCollapseButton(id);
          nodes.push(collapseButton);
          edges.push({
            id: `edge-${id}-${collapseButton.id}`,
            source: id,
            target: collapseButton.id,
            label: 'daralt',
          });
        }
      }

    } else {
      // Primitive value
      const displayValue = typeof value === 'string' && value.length > 50 
        ? value.substring(0, 50) + '...' 
        : JSON.stringify(value);

      nodes.push({
        id,
        label: key 
          ? `${key}: ${displayValue}` 
          : arrayIndex !== undefined 
            ? `[${arrayIndex}]: ${displayValue}`
            : displayValue,
        type: 'value',
        data: value,
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          label: key || (arrayIndex !== undefined ? `[${arrayIndex}]` : ''),
        });
      }
    }

    return id;
  }

  // Reset counter for consistent IDs
  nodeIdCounter = 0;
  
  // Start traversal from root
  traverse(data, undefined, 'root', 0);

  return { nodes, edges, state: graphState };
}

export function expandNode(
  nodeId: string,
  data: JsonValue,
  currentState: ExpandableGraphState,
  options: ExpandableGraphOptions = {}
): { 
  nodes: GraphNode[]; 
  edges: GraphEdge[]; 
  state: ExpandableGraphState;
} {
  const newState = {
    ...currentState,
    expandedNodes: new Set([...currentState.expandedNodes, nodeId]),
  };

  return jsonToExpandableGraph(data, options, newState);
}

export function collapseNode(
  nodeId: string,
  data: JsonValue,
  currentState: ExpandableGraphState,
  options: ExpandableGraphOptions = {}
): { 
  nodes: GraphNode[]; 
  edges: GraphEdge[]; 
  state: ExpandableGraphState;
} {
  const newState = {
    ...currentState,
    expandedNodes: new Set([...currentState.expandedNodes].filter(id => id !== nodeId)),
  };

  return jsonToExpandableGraph(data, options, newState);
}