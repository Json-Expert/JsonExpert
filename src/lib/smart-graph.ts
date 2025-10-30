import { JsonValue } from '../types/json.types';
import { GraphNode, GraphEdge } from '../types/visualization.types';

import { detectJSONType } from './json-parser';

interface SmartGraphState {
  expandedNodes: Set<string>;
  selectedSiblings: Map<string, number[]>; // parent -> selected child indices
  maxVisibleSiblings: number;
  nodeContentCache: Map<string, any>;
}

interface SmartNodeData {
  id: string;
  type: 'object' | 'array' | 'value' | 'image' | 'url' | 'large-text';
  path: string[];
  value: JsonValue;
  isExpanded: boolean;
  siblings?: {
    total: number;
    visible: number[];
    hasMore: boolean;
  };
  richContent?: {
    preview: string;
    isImage: boolean;
    isUrl: boolean;
    isLargeText: boolean;
    thumbnail?: string;
  };
  parentId?: string;
  childrenCount?: number;
}

let nodeIdCounter = 0;
function generateNodeId(): string {
  return `smart-node-${nodeIdCounter++}`;
}

export interface SmartGraphOptions {
  maxVisibleSiblings?: number;
  maxTextLength?: number;
  enableRichContent?: boolean;
  autoDetectImages?: boolean;
  autoDetectUrls?: boolean;
}

const DEFAULT_OPTIONS: SmartGraphOptions = {
  maxVisibleSiblings: 5,
  maxTextLength: 100,
  enableRichContent: true,
  autoDetectImages: true,
  autoDetectUrls: true,
};

function isImageUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i;
  const dataUrl = /^data:image\//i;
  return imageExtensions.test(url) || dataUrl.test(url);
}

function isUrl(text: string): boolean {
  if (typeof text !== 'string') return false;
  try {
    new URL(text);
    return text.startsWith('http://') || text.startsWith('https://');
  } catch {
    return false;
  }
}

function createRichContent(value: JsonValue, options: SmartGraphOptions): SmartNodeData['richContent'] {
  if (!options.enableRichContent || typeof value !== 'string') {
    return undefined;
  }

  const strValue = value as string;
  const isImage = options.autoDetectImages && isImageUrl(strValue);
  const isUrlValue = options.autoDetectUrls && isUrl(strValue);
  const isLargeText = strValue.length > (options.maxTextLength || 100);

  if (!isImage && !isUrlValue && !isLargeText) {
    return undefined;
  }

  return {
    preview: isLargeText ? strValue.substring(0, options.maxTextLength || 100) + '...' : strValue,
    isImage: isImage || false,
    isUrl: isUrlValue || false,
    isLargeText: isLargeText || false,
    thumbnail: isImage ? strValue : undefined,
  };
}

function createNodeData(
  value: JsonValue,
  path: string[],
  parentId: string | undefined,
  state: SmartGraphState,
  options: SmartGraphOptions,
  siblingInfo?: { total: number; index: number }
): SmartNodeData {
  const id = generateNodeId();
  const type = detectJSONType(value);
  const isExpanded = state.expandedNodes.has(id);
  const richContent = createRichContent(value, options);

  let nodeType: SmartNodeData['type'] = 'value';
  if (type === 'object') nodeType = 'object';
  else if (type === 'array') nodeType = 'array';
  else if (richContent?.isImage) nodeType = 'image';
  else if (richContent?.isUrl) nodeType = 'url';
  else if (richContent?.isLargeText) nodeType = 'large-text';

  let childrenCount = 0;
  if (type === 'object' && value !== null) {
    childrenCount = Object.keys(value as Record<string, JsonValue>).length;
  } else if (type === 'array') {
    childrenCount = (value as JsonValue[]).length;
  }

  return {
    id,
    type: nodeType,
    path,
    value,
    isExpanded,
    richContent,
    parentId,
    childrenCount,
    siblings: siblingInfo ? {
      total: siblingInfo.total,
      visible: [siblingInfo.index], // Will be updated by parent
      hasMore: siblingInfo.total > (options.maxVisibleSiblings || 5),
    } : undefined,
  };
}

export function jsonToSmartGraph(
  data: JsonValue,
  options: SmartGraphOptions = {},
  state?: SmartGraphState
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  state: SmartGraphState;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const graphState = state || {
    expandedNodes: new Set<string>(),
    selectedSiblings: new Map<string, number[]>(),
    maxVisibleSiblings: opts.maxVisibleSiblings!,
    nodeContentCache: new Map(),
  };

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeDataMap = new Map<string, SmartNodeData>();

  function processValue(
    value: JsonValue,
    path: string[] = [],
    parentId?: string,
    siblingInfo?: { total: number; index: number }
  ): string {
    const nodeData = createNodeData(value, path, parentId, graphState, opts, siblingInfo);
    nodeDataMap.set(nodeData.id, nodeData);

    // Create graph node
    const graphNode: GraphNode = {
      id: nodeData.id,
      label: path[path.length - 1] || 'root',
      type: nodeData.type,
      data: nodeData,
    };

    nodes.push(graphNode);

    // Create edge to parent
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeData.id}`,
        source: parentId,
        target: nodeData.id,
        label: path[path.length - 1] || '',
      });
    }

    // Process children if expanded
    if (nodeData.isExpanded && nodeData.childrenCount! > 0) {
      if (nodeData.type === 'object') {
        const obj = value as Record<string, JsonValue>;
        const entries = Object.entries(obj);
        const maxVisible = graphState.maxVisibleSiblings;
        const selectedIndices = graphState.selectedSiblings.get(nodeData.id) || 
          Array.from({ length: Math.min(maxVisible, entries.length) }, (_, i) => i);

        selectedIndices.forEach(index => {
          if (index < entries.length) {
            const entry = entries[index];
            if (entry) {
              const [key, childValue] = entry;
              processValue(
                childValue,
                [...path, key],
                nodeData.id,
                { total: entries.length, index }
              );
            }
          }
        });

        // Add sibling selector if there are more
        if (entries.length > maxVisible) {
          addSiblingSelector(nodeData.id, entries.length, selectedIndices, 'object');
        }

      } else if (nodeData.type === 'array') {
        const arr = value as JsonValue[];
        const maxVisible = graphState.maxVisibleSiblings;
        const selectedIndices = graphState.selectedSiblings.get(nodeData.id) ||
          Array.from({ length: Math.min(maxVisible, arr.length) }, (_, i) => i);

        selectedIndices.forEach(index => {
          if (index < arr.length) {
            const item = arr[index];
            if (item !== undefined) {
              processValue(
                item,
                [...path, `[${index}]`],
                nodeData.id,
                { total: arr.length, index }
              );
            }
          }
        });

        // Add sibling selector if there are more
        if (arr.length > maxVisible) {
          addSiblingSelector(nodeData.id, arr.length, selectedIndices, 'array');
        }
      }
    }

    return nodeData.id;
  }

  function addSiblingSelector(
    parentId: string,
    totalCount: number,
    visibleIndices: number[],
    parentType: 'object' | 'array'
  ) {
    const selectorId = `${parentId}-selector`;
    const selectorNode: GraphNode = {
      id: selectorId,
      label: `sibling-selector`,
      type: 'sibling-selector',
      data: {
        parentId,
        totalCount,
        visibleIndices,
        parentType,
        availableIndices: Array.from({ length: totalCount }, (_, i) => i),
      },
    };

    nodes.push(selectorNode);
    edges.push({
      id: `edge-${parentId}-${selectorId}`,
      source: parentId,
      target: selectorId,
      label: 'seçim',
    });
  }

  // Reset counter for consistent IDs
  nodeIdCounter = 0;

  // Start processing from root
  processValue(data, ['root']);

  return { nodes, edges, state: graphState };
}

export function expandNode(
  nodeId: string,
  data: JsonValue,
  currentState: SmartGraphState,
  options: SmartGraphOptions = {}
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  state: SmartGraphState;
} {
  const newState = {
    ...currentState,
    expandedNodes: new Set([...currentState.expandedNodes, nodeId]),
  };

  return jsonToSmartGraph(data, options, newState);
}

export function collapseNode(
  nodeId: string,
  data: JsonValue,
  currentState: SmartGraphState,
  options: SmartGraphOptions = {}
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  state: SmartGraphState;
} {
  const newState = {
    ...currentState,
    expandedNodes: new Set([...currentState.expandedNodes].filter(id => id !== nodeId)),
  };

  return jsonToSmartGraph(data, options, newState);
}

export function updateSiblingSelection(
  parentId: string,
  selectedIndices: number[],
  data: JsonValue,
  currentState: SmartGraphState,
  options: SmartGraphOptions = {}
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  state: SmartGraphState;
} {
  const newState = {
    ...currentState,
    selectedSiblings: new Map([
      ...currentState.selectedSiblings,
      [parentId, selectedIndices],
    ]),
  };

  return jsonToSmartGraph(data, options, newState);
}