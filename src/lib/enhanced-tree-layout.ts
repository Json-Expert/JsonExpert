import { Node, Edge, EdgeMarkerType } from 'reactflow';

import { GraphNode, GraphEdge } from '../types/visualization.types';

interface TreeNode {
  id: string;
  node: GraphNode;
  children: TreeNode[];
  x?: number;
  y?: number;
  width: number;
  height: number;
  prelim?: number;
  mod?: number;
  shift?: number;
  change?: number;
  thread?: TreeNode;
  ancestor?: TreeNode;
  number?: number;
  parent?: TreeNode;
}

export interface EnhancedLayoutOptions {
  direction: 'TB' | 'LR';
  nodeWidth: number;
  nodeHeight: number;
  levelSeparation: number;
  siblingSeparation: number;
  subtreeSeparation: number;
}

const DEFAULT_OPTIONS: EnhancedLayoutOptions = {
  direction: 'TB',
  nodeWidth: 220,
  nodeHeight: 70,
  levelSeparation: 150,
  siblingSeparation: 100,
  subtreeSeparation: 120,
};

export function applyEnhancedTreeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: Partial<EnhancedLayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Build tree structure
  const tree = buildTree(nodes, edges, opts);
  
  if (!tree) {
    return { nodes: [], edges: [] };
  }
  
  // Apply Buchheim algorithm for optimal tree layout
  const positions = calculateTreePositions(tree, opts);
  
  // Convert to ReactFlow nodes
  const layoutNodes: Node[] = positions.map(({ id, x, y, node }) => ({
    id,
    type: 'customNode',
    position: { x, y },
    data: node.data,
    draggable: false,
  }));
  
  // Convert edges with proper styling
  const layoutEdges: Edge[] = edges.map((edge) => ({
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
  }));
  
  return { nodes: layoutNodes, edges: layoutEdges };
}

function buildTree(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: EnhancedLayoutOptions
): TreeNode | null {
  if (!nodes || nodes.length === 0) {
    return null;
  }
  
  const nodeMap = new Map<string, TreeNode>();
  const childrenMap = new Map<string, string[]>();
  
  // Create tree nodes
  nodes.forEach(node => {
    if (node && node.id) {
      nodeMap.set(node.id, {
        id: node.id,
        node,
        children: [],
        width: options.nodeWidth,
        height: options.nodeHeight,
      });
    }
  });
  
  // Build parent-child relationships
  edges.forEach(edge => {
    const children = childrenMap.get(edge.source) || [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
  });
  
  // Find root (node with no incoming edges)
  const targetSet = new Set(edges.map(e => e.target));
  const roots = nodes.filter(n => !targetSet.has(n.id));
  
  if (roots.length === 0 && nodes.length > 0) {
    // If no clear root, use first node
    const firstNode = nodes[0];
    if (firstNode) {
      roots.push(firstNode);
    }
  }
  
  const firstRoot = roots[0];
  if (!firstRoot) return null;
  const root = nodeMap.get(firstRoot.id);
  if (!root) return null;
  
  // Build tree structure
  function buildSubtree(node: TreeNode): void {
    const childIds = childrenMap.get(node.id) || [];
    node.children = childIds
      .map(id => nodeMap.get(id))
      .filter((child): child is TreeNode => child !== undefined);
    
    node.children.forEach((child, i) => {
      child.parent = node;
      child.number = i;
      buildSubtree(child);
    });
  }
  
  buildSubtree(root);
  return root;
}

function calculateTreePositions(
  root: TreeNode,
  options: EnhancedLayoutOptions
): Array<{ id: string; x: number; y: number; node: GraphNode }> {
  const positions: Array<{ id: string; x: number; y: number; node: GraphNode }> = [];
  
  // First walk - calculate preliminary x positions
  firstWalk(root, options);
  
  // Second walk - calculate final positions
  secondWalk(root, -(root.prelim ?? 0), 0, options, positions);
  
  // Center the tree
  const bounds = calculateBounds(positions);
  const offsetX = -bounds.minX + 50;
  const offsetY = -bounds.minY + 50;
  
  positions.forEach(pos => {
    if (options.direction === 'LR') {
      // Swap x and y for left-right layout
      const temp = pos.x;
      pos.x = pos.y + offsetY;
      pos.y = temp + offsetX;
    } else {
      pos.x += offsetX;
      pos.y += offsetY;
    }
  });
  
  return positions;
}

function firstWalk(node: TreeNode, options: EnhancedLayoutOptions): void {
  if (node.children.length === 0) {
    // Leaf node
    node.prelim = 0;
  } else {
    // Interior node
    let defaultAncestor = node.children[0];
    if (!defaultAncestor) return;
    
    node.children.forEach(child => {
      if (child) {
        firstWalk(child, options);
        defaultAncestor = apportion(child, defaultAncestor || child, options);
      }
    });
    
    executeShifts(node);
    
    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    if (!firstChild || !lastChild) return;
    const midpoint = ((firstChild.prelim ?? 0) + (lastChild.prelim ?? 0)) / 2;
    
    const leftSibling = getLeftSibling(node);
    if (leftSibling) {
      node.prelim = (leftSibling.prelim ?? 0) + options.siblingSeparation;
      node.mod = node.prelim - midpoint;
    } else {
      node.prelim = midpoint;
    }
  }
}

function secondWalk(
  node: TreeNode,
  modSum: number,
  depth: number,
  options: EnhancedLayoutOptions,
  positions: Array<{ id: string; x: number; y: number; node: GraphNode }>
): void {
  node.x = (node.prelim ?? 0) + modSum;
  node.y = depth * options.levelSeparation;
  
  positions.push({
    id: node.id,
    x: node.x,
    y: node.y,
    node: node.node,
  });
  
  node.children.forEach(child => {
    secondWalk(child, modSum + (node.mod || 0), depth + 1, options, positions);
  });
}

function apportion(
  node: TreeNode,
  defaultAncestor: TreeNode,
  options: EnhancedLayoutOptions
): TreeNode {
  const leftSibling = getLeftSibling(node);
  
  if (leftSibling) {
    let vir: TreeNode | null = node;
    let vor: TreeNode | null = node;
    let vil: TreeNode | null = leftSibling;
    let vol: TreeNode | null = getLeftmostSibling(vir);
    
    // Safety check
    if (!vol) return defaultAncestor;
    
    let sir = vir.mod || 0;
    let sor = vor.mod || 0;
    let sil = vil.mod || 0;
    let sol = vol.mod || 0;
    
    while (vil && vir) {
      vil = getRight(vil);
      vir = getLeft(vir);
      vol = getLeft(vol);
      vor = getRight(vor);
      
      // Safety check for null pointers
      if (!vol || !vor) break;
      
      vor.ancestor = node;
      
      const shift = (vil?.prelim || 0) + sil - ((vir?.prelim || 0) + sir) + options.siblingSeparation;
      
      if (shift > 0 && vil) {
        moveSubtree(getAncestor(vil, node, defaultAncestor), node, shift);
        sir += shift;
        sor += shift;
      }
      
      sil += vil?.mod || 0;
      sir += vir?.mod || 0;
      sol += vol?.mod || 0;
      sor += vor?.mod || 0;
    }
    
    if (vil && vor && !getRight(vor)) {
      vor.thread = vil;
      vor.mod = (vor.mod || 0) + sil - sor;
    }
    
    if (vir && vol && !getLeft(vol)) {
      vol.thread = vir;
      vol.mod = (vol.mod || 0) + sir - sol;
      defaultAncestor = node;
    }
  }
  
  return defaultAncestor;
}

function executeShifts(node: TreeNode): void {
  let shift = 0;
  let change = 0;
  
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i];
    if (!child) continue;
    child.prelim = (child.prelim || 0) + shift;
    child.mod = (child.mod || 0) + shift;
    change += child.change || 0;
    shift += (child.shift || 0) + change;
  }
}

function moveSubtree(wl: TreeNode, wr: TreeNode, shift: number): void {
  const subtrees = (wr.number ?? 0) - (wl.number ?? 0);
  if (subtrees !== 0) {
    wr.change = (wr.change ?? 0) - shift / subtrees;
    wr.shift = (wr.shift ?? 0) + shift;
    wl.change = (wl.change ?? 0) + shift / subtrees;
  }
  wr.prelim = (wr.prelim ?? 0) + shift;
  wr.mod = (wr.mod ?? 0) + shift;
}

function getLeftSibling(node: TreeNode): TreeNode | null {
  if (!node.parent || node.number === undefined || node.number === 0) return null;
  return node.parent.children[node.number - 1] || null;
}

function getLeftmostSibling(node: TreeNode): TreeNode | null {
  if (!node.parent || node.number === 0) return node;
  return node.parent.children[0] || null;
}

function getLeft(node: TreeNode): TreeNode | null {
  return node.children[0] || node.thread || null;
}

function getRight(node: TreeNode): TreeNode | null {
  return node.children[node.children.length - 1] || node.thread || null;
}

function getAncestor(vil: TreeNode | null, node: TreeNode, defaultAncestor: TreeNode): TreeNode {
  if (!vil) {
    return defaultAncestor;
  }
  if (node.parent?.children.includes(vil.ancestor || vil)) {
    return vil.ancestor || vil;
  }
  return defaultAncestor;
}

function calculateBounds(positions: Array<{ x: number; y: number }>): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  positions.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  
  return { minX, maxX, minY, maxY };
}