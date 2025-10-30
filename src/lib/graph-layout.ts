import dagre from 'dagre';
import { Node, Edge, EdgeMarkerType } from 'reactflow';

import { GraphNode, GraphEdge } from '../types/visualization.types';

export interface LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing?: number;
  levelSpacing?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  algorithm?: 'network-simplex' | 'tight-tree' | 'longest-path';
  rankSeparation?: number;
  edgeSeparation?: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeSpacing: 80,
  levelSpacing: 150,
  nodeWidth: 220,
  nodeHeight: 70,
  algorithm: 'tight-tree',
  rankSeparation: 150,
  edgeSeparation: 20,
};

export function applyTreeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const { 
    direction, 
    nodeSpacing, 
    levelSpacing, 
    nodeWidth, 
    nodeHeight,
    algorithm,
    rankSeparation,
    edgeSeparation
  } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: levelSpacing || rankSeparation,
    marginx: 40,
    marginy: 40,
    ranker: algorithm,
    edgesep: edgeSeparation,
    // Force hierarchical layout
    acyclicer: 'greedy',
    // Align nodes in same rank
    align: 'DL',
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight,
      label: node.label,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(dagreGraph);

  // Map dagre nodes to ReactFlow nodes
  const layoutNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      id: node.id,
      type: 'customNode',
      position: {
        x: nodeWithPosition.x - (nodeWidth || 220) / 2,
        y: nodeWithPosition.y - (nodeHeight || 60) / 2,
      },
      data: {
        label: node.label,
        nodeType: node.type,
        value: node.data,
        depth: (nodeWithPosition as any).rank || 0,
      },
      draggable: false, // Prevent dragging to maintain tree structure
    };
  });

  // Map edges to ReactFlow edges with proper styling
  const layoutEdges: Edge[] = edges.map((edge) => {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: false,
      style: {
        strokeWidth: 2,
        stroke: '#6b7280',
      },
      labelStyle: {
        fontSize: 11,
        fontWeight: 500,
        fill: '#6b7280',
      },
      labelBgStyle: {
        fill: 'white',
        fillOpacity: 0.9,
      },
      markerEnd: {
        type: 'arrowclosed',
        width: 15,
        height: 15,
        color: '#6b7280',
      } as EdgeMarkerType,
    };
  });

  return { nodes: layoutNodes, edges: layoutEdges };
}

// Helper function to find the root node
export function findRootNode(nodes: GraphNode[], edges: GraphEdge[]): string | null {
  const targetSet = new Set(edges.map(edge => edge.target));
  const rootNodes = nodes.filter(node => !targetSet.has(node.id));
  
  // Return the first root node, or the first node if no root found
  return rootNodes.length > 0 && rootNodes[0] ? rootNodes[0].id : (nodes.length > 0 && nodes[0] ? nodes[0].id : null);
}

// Helper function to calculate tree depth
export function calculateTreeDepth(
  _nodes: GraphNode[],
  edges: GraphEdge[],
  rootId: string
): number {
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    const sourceEdges = adjacencyList.get(edge.source);
    if (sourceEdges) {
      sourceEdges.push(edge.target);
    }
  });
  
  // BFS to find max depth
  let maxDepth = 0;
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    
    if (visited.has(id)) continue;
    visited.add(id);
    
    maxDepth = Math.max(maxDepth, depth);
    
    const children = adjacencyList.get(id) || [];
    children.forEach(childId => {
      queue.push({ id: childId, depth: depth + 1 });
    });
  }
  
  return maxDepth;
}