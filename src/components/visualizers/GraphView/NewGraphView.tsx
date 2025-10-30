import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useUIStore } from '../../../stores/ui-store';
import { JsonValue } from '../../../types/json.types';

import { BranchSelectorModal } from './BranchSelectorModal';
import { GraphNode } from './GraphNode';

import dagre from 'dagre';

interface GraphViewProps {
  data: JsonValue;
}

interface NodeData {
  label: string;
  value: JsonValue;
  type: 'object' | 'array' | 'primitive' | 'table-object' | 'load-more';
  isExpanded: boolean;
  childCount: number;
  path: string[];
  properties?: Array<{ key: string; value: any; type: string }>; // For table-object nodes AND load-more nodes
  parentNodeId?: string; // For load-more nodes
  remainingCount?: number; // For load-more nodes
}

const nodeTypes = {
  graphNode: GraphNode,
};

// Create graph layout using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 200 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 150 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 125,
        y: nodeWithPosition.y - 75,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const NewGraphView: React.FC<GraphViewProps> = ({ data }) => {
  const { theme } = useUIStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['node-0'])); // Start with root expanded
  const [arrayLoadCounts, setArrayLoadCounts] = useState<Map<string, number>>(new Map()); // Track how many items loaded per array
  const [selectedBranches, setSelectedBranches] = useState<Map<string, Set<string>>>(new Map()); // Track selected properties per node
  const [modalState, setModalState] = useState<{ isOpen: boolean; nodeId: string; branches: any[]; nodeLabel: string } | null>(null);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<NodeData>[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;

    const createNode = (
      key: string,
      value: JsonValue,
      parentId: string | null,
      path: string[]
    ): string => {
      const currentId = `node-${nodeId++}`;
      const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
      const isArray = Array.isArray(value);
      
      let childCount = 0;
      let properties: Array<{ key: string; value: any; type: string }> = [];
      
      if (isObject) {
        const obj = value as Record<string, JsonValue>;
        const entries = Object.entries(obj);
        childCount = entries.length;
        
        // Create properties for ALL entries (no limit)
        properties = entries.map(([k, v]) => {
          let type: string;
          if (v === null) {
            type = 'null';
          } else if (Array.isArray(v)) {
            type = 'array';
          } else if (typeof v === 'object') {
            type = 'object';
          } else {
            type = typeof v;
          }
          return { key: k, value: v, type };
        });
      } else if (isArray) {
        childCount = (value as unknown[]).length;
      }

      // All nodes show as tables
      nodes.push({
        id: currentId,
        type: 'graphNode',
        position: { x: 0, y: 0 },
        data: {
          label: key,
          value,
          type: isArray ? 'array' : 'table-object', // Keep array type for proper display
          isExpanded: expandedNodes.has(currentId),
          childCount,
          path,
          properties,
        },
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: 'smoothstep',
          animated: false,
          style: {
            strokeWidth: 2,
            stroke: theme === 'dark' ? '#4b5563' : '#9ca3af',
          },
        });
      }

      // Always process children for objects and arrays
      if (isObject && value !== null) {
        // For objects, create child nodes for ALL array/object properties (no limit on properties)
        properties.forEach((prop) => {
          if (prop.type === 'array' || prop.type === 'object') {
            const childId = createNode(prop.key, prop.value, currentId, [...path, prop.key]);
            // Auto-expand child nodes
            expandedNodes.add(childId);
          }
        });
      } else if (isArray && expandedNodes.has(currentId)) {
        const arr = value as JsonValue[];
        const selectedItemsForArray = selectedBranches.get(currentId) || new Set();

        // For arrays with 3+ items, show only first 2 + selected items
        let itemsToShow: number[];
        if (arr.length >= 3) {
          // Always show first 2 items
          itemsToShow = [0, 1];
          // Add selected items
          selectedItemsForArray.forEach(indexStr => {
            const index = parseInt(indexStr, 10);
            if (!isNaN(index) && index < arr.length && !itemsToShow.includes(index)) {
              itemsToShow.push(index);
            }
          });
        } else {
          // For arrays with < 3 items, show all
          itemsToShow = Array.from({ length: arr.length }, (_, i) => i);
        }

        // Create nodes for shown items
        itemsToShow.forEach((index) => {
          const item = arr[index];
          const childId = createNode(`[${index}]`, item, currentId, [...path, `[${index}]`]);

          // If this array item is an array, auto-expand it
          if (Array.isArray(item)) {
            expandedNodes.add(childId);
          }
        });

        // Add "load more" node if there are hidden items
        if (arr.length >= 3 && itemsToShow.length < arr.length) {
          const hiddenItems = arr
            .map((item, index) => ({ index, item }))
            .filter(({ index }) => !itemsToShow.includes(index));

          const moreId = `node-${nodeId++}`;

          // Prepare branch data for modal
          const branchData = hiddenItems.map(({ index, item }) => ({
            key: `[${index}]`,
            value: item,
            type: item === null ? 'null' : Array.isArray(item) ? 'array' : typeof item === 'object' ? 'object' : typeof item,
          }));

          nodes.push({
            id: moreId,
            type: 'graphNode',
            position: { x: 0, y: 0 },
            data: {
              label: `+${hiddenItems.length} more items`,
              value: null,
              type: 'load-more',
              isExpanded: false,
              childCount: 0,
              path: [...path, '...more'],
              parentNodeId: currentId,
              remainingCount: hiddenItems.length,
              properties: branchData, // Store hidden items for modal
            },
          });
          edges.push({
            id: `edge-${currentId}-${moreId}`,
            source: currentId,
            target: moreId,
            type: 'smoothstep',
            animated: false,
            style: {
              strokeWidth: 2,
              stroke: theme === 'dark' ? '#4b5563' : '#9ca3af',
              strokeDasharray: '5 5',
            },
          });
        }
      }

      return currentId;
    };

    // Start with all array nodes expanded to show first 3 items
    const rootId = createNode('root', data, null, []);
    
    // Auto-expand root
    expandedNodes.add(rootId);

    const layouted = getLayoutedElements(nodes, edges, 'LR');
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [data, expandedNodes, theme, arrayLoadCounts]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    if (node.data.type === 'load-more' && node.data.parentNodeId) {
      const parentId = node.data.parentNodeId;

      // If this load-more has properties (from object), open modal
      if (node.data.properties && node.data.properties.length > 0) {
        // Find parent node label
        const parentNode = nodes.find(n => n.id === parentId);
        const parentLabel = parentNode?.data.label || 'node';

        setModalState({
          isOpen: true,
          nodeId: parentId,
          branches: node.data.properties,
          nodeLabel: parentLabel,
        });
      } else {
        // Array load more - just load next batch
        setArrayLoadCounts(prev => {
          const newMap = new Map(prev);
          const currentCount = newMap.get(parentId) || 3;
          newMap.set(parentId, currentCount + 3);
          return newMap;
        });
        // Force re-render by toggling parent
        toggleNode(parentId);
        setTimeout(() => toggleNode(parentId), 50);
      }
    } else if (node.data.type === 'array') {
      // Toggle array expansion
      toggleNode(node.id);
    }
  }, [toggleNode, nodes]);

  const handleBranchSelect = useCallback((selectedKeys: string[]) => {
    if (!modalState) return;

    // Add selected keys to the selectedBranches map for this node
    setSelectedBranches(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(modalState.nodeId) || new Set();
      selectedKeys.forEach(key => existing.add(key));
      newMap.set(modalState.nodeId, existing);
      return newMap;
    });

    // Close modal
    setModalState(null);
  }, [modalState]);

  return (
    <>
      <div className="w-full h-full">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1,
          minZoom: 0.1,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color={theme === 'dark' ? '#374151' : '#e5e7eb'}
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.type === 'object') return '#f97316';
            if (node.data?.type === 'array') return '#8b5cf6';
            return '#3b82f6';
          }}
          style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
          }}
        />
      </ReactFlow>
    </div>

      {/* Branch Selector Modal */}
      {modalState && (
        <BranchSelectorModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(null)}
          branches={modalState.branches}
          onSelect={handleBranchSelect}
          nodeLabel={modalState.nodeLabel}
        />
      )}
    </>
  );
};