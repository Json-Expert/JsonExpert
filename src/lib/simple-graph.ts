import { JsonValue } from '../types/json.types';
import { GraphNode, GraphEdge } from '../types/visualization.types';

export interface SimpleGraphState {
  selectedRoot: string | null;
  expandedNodes: Set<string>;
  selectedSiblings: Map<string, string[]>; // parentId -> selected child keys
}

export interface SimpleNodeData {
  id: string;
  parentId?: string;
  key: string;
  value: JsonValue;
  type: 'object' | 'array' | 'value' | 'more';
  path: string[];
  isExpanded: boolean;
  childrenKeys: string[];
  siblingKeys: string[];
  depth: number;
  remainingCount?: number; // For 'more' nodes
  parentPath?: string[]; // For 'more' nodes to track parent
  parentKey?: string; // For 'more' nodes to track parent
}

let nodeCounter = 0;

function createNodeId(): string {
  return `node-${nodeCounter++}`;
}

function getValueType(value: JsonValue): 'object' | 'array' | 'value' | 'more' {
  if (Array.isArray(value)) return 'array';
  if (value !== null && typeof value === 'object') return 'object';
  return 'value';
}

export function getChildrenKeys(value: JsonValue): string[] {
  if (Array.isArray(value)) {
    return value.map((_, index) => `[${index}]`);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, JsonValue>);
  }
  return [];
}

export function getValue(parent: JsonValue, key: string): JsonValue {
  if (Array.isArray(parent)) {
    const index = parseInt(key.slice(1, -1)); // Remove [ and ]
    return parent[index] ?? null;
  }
  if (parent !== null && typeof parent === 'object') {
    return (parent as Record<string, JsonValue>)[key] ?? null;
  }
  return null;
}

export function jsonToSimpleGraph(
  data: JsonValue,
  state: SimpleGraphState
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootOptions: { key: string; label: string }[];
  state: SimpleGraphState;
} {
  nodeCounter = 0;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const rootOptions: { key: string; label: string }[] = [];

  // Determine root options
  const rootKeys = getChildrenKeys(data);
  
  // If we have multiple roots, create options
  if (rootKeys.length > 1) {
    rootOptions.push(...rootKeys.map(key => ({
      key,
      label: key.startsWith('[') ? `Item ${key}` : key
    })));
  }

  // Select first root if none selected
  const selectedRoot = state.selectedRoot || (rootKeys.length > 0 ? rootKeys[0] : null);
  
  if (!selectedRoot) {
    // Single value at root
    const rootNode: SimpleNodeData = {
      id: createNodeId(),
      key: 'root',
      value: data,
      type: getValueType(data),
      path: [],
      isExpanded: false,
      childrenKeys: getChildrenKeys(data),
      siblingKeys: [],
      depth: 0
    };

    nodes.push({
      id: rootNode.id,
      label: 'root',
      type: rootNode.type,
      data: rootNode
    });

    return {
      nodes,
      edges,
      rootOptions: [],
      state: { ...state, selectedRoot: null }
    };
  }

  // Get the selected root value
  const rootValue = getValue(data, selectedRoot);
  
  function buildNode(
    value: JsonValue,
    key: string,
    path: string[],
    parentId?: string,
    siblingKeys: string[] = [],
    depth: number = 0
  ): string {
    const nodeId = createNodeId();
    const childrenKeys = getChildrenKeys(value);
    const isExpanded = state.expandedNodes.has(nodeId) || 
                      state.expandedNodes.has(`${path.join('.')}.${key}`);

    const nodeData: SimpleNodeData = {
      id: nodeId,
      parentId,
      key,
      value,
      type: getValueType(value),
      path,
      isExpanded,
      childrenKeys,
      siblingKeys,
      depth
    };

    nodes.push({
      id: nodeId,
      label: key,
      type: nodeData.type,
      data: nodeData
    });

    // Add edge to parent
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        label: key
      });
    }

    // Add children if expanded
    if (isExpanded && childrenKeys.length > 0) {
      // Get selected children for this node
      const pathKey = path.length > 0 ? `${path.join('.')}.${key}` : key;
      let selectedChildren = state.selectedSiblings.get(pathKey);
      
      // Default behavior: always show first 3 nodes for graph view
      if (!selectedChildren) {
        selectedChildren = childrenKeys.slice(0, 3);
      }

      selectedChildren.forEach(childKey => {
        const childValue = getValue(value, childKey);
        buildNode(
          childValue,
          childKey,
          [...path, key],
          nodeId,
          childrenKeys,
          depth + 1
        );
      });
      
      // Don't add more nodes - handle it in the TableNode component
    }

    return nodeId;
  }

  // Build from selected root
  buildNode(rootValue, selectedRoot, [], undefined, rootKeys, 0);

  const newState: SimpleGraphState = {
    ...state,
    selectedRoot
  };

  return {
    nodes,
    edges,
    rootOptions,
    state: newState
  };
}

export function toggleNodeExpansion(
  nodeId: string,
  nodePath: string[],
  nodeKey: string,
  currentState: SimpleGraphState
): SimpleGraphState {
  const pathKey = nodePath.length > 0 ? `${nodePath.join('.')}.${nodeKey}` : nodeKey;
  const newExpanded = new Set(currentState.expandedNodes);
  
  if (newExpanded.has(nodeId) || newExpanded.has(pathKey)) {
    newExpanded.delete(nodeId);
    newExpanded.delete(pathKey);
    // Also remove selected siblings when collapsing
    const newSelectedSiblings = new Map(currentState.selectedSiblings);
    newSelectedSiblings.delete(pathKey);
    return {
      ...currentState,
      expandedNodes: newExpanded,
      selectedSiblings: newSelectedSiblings
    };
  } else {
    newExpanded.add(pathKey);
  }

  return {
    ...currentState,
    expandedNodes: newExpanded
  };
}

export function selectRoot(
  rootKey: string,
  currentState: SimpleGraphState
): SimpleGraphState {
  return {
    ...currentState,
    selectedRoot: rootKey,
    expandedNodes: new Set(), // Reset expansions when changing root
    selectedSiblings: new Map()
  };
}

export function selectSiblings(
  parentPath: string[],
  parentKey: string,
  selectedKeys: string[],
  currentState: SimpleGraphState
): SimpleGraphState {
  const pathKey = parentPath.length > 0 ? `${parentPath.join('.')}.${parentKey}` : parentKey;
  const newSelectedSiblings = new Map(currentState.selectedSiblings);
  newSelectedSiblings.set(pathKey, selectedKeys);

  return {
    ...currentState,
    selectedSiblings: newSelectedSiblings
  };
}