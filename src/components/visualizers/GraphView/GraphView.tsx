import React, { useMemo, useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { useGraphLayout } from '@/hooks/useGraphLayout';

import { jsonToSimpleGraph, toggleNodeExpansion, selectRoot, selectSiblings, SimpleGraphState, getChildrenKeys, getValue } from '../../../lib/simple-graph';
import { useUIStore } from '../../../stores/ui-store';
import { JsonValue } from '../../../types/json.types';
import { Button } from '../../ui/Button';

import { ContentPreview } from './ContentPreview';
import { RootSelector } from './RootSelector';
import { TableNode } from './TableNode';

// Helper function to get value at a specific path
function getValueAtPath(data: JsonValue, path: string[], key: string): JsonValue {
  let current = data;
  
  // If path is empty, just return the data itself
  if (path.length === 0) {
    return data;
  }
  
  // Navigate through the path
  for (const p of path) {
    current = getValue(current, p);
    if (current === null || current === undefined) return null;
  }
  
  // If key is provided, get that specific value
  if (key) {
    return getValue(current, key);
  }
  
  return current;
}
import { SiblingSelectorModal } from './SiblingSelectorModal';

// Define node types
const createNodeTypes = (
  onSimpleToggleExpand: (nodeId: string, path: string[], key: string) => void,
  onSimpleShowMore: (nodeId: string, path: string[], key: string) => void
) => ({
  'table-node': (props: any) => (
    <TableNode 
      {...props} 
      onToggleExpand={onSimpleToggleExpand} 
      onShowMore={onSimpleShowMore}
    />
  ),
});

interface GraphViewProps {
  data: JsonValue;
}

export const GraphView: React.FC<GraphViewProps> = ({ data }) => {
  const { theme } = useUIStore();
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('LR');
  const [simpleGraphState, setSimpleGraphState] = useState<SimpleGraphState>(() => {
    // Start with root expanded if data is small
    const childCount = getChildrenKeys(data).length;
    const initialExpanded = new Set<string>();
    
    // Only auto-expand root if it has <= 10 children
    if (childCount > 0 && childCount <= 10) {
      const firstKey = getChildrenKeys(data)[0];
      if (firstKey) {
        initialExpanded.add(firstKey);
      }
    }
    
    return {
      selectedRoot: null,
      expandedNodes: initialExpanded,
      selectedSiblings: new Map()
    };
  });
  const [rootOptions, setRootOptions] = useState<{ key: string; label: string }[]>([]);
  
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    content: any;
    nodeId: string;
    title: string;
  }>({
    isOpen: false,
    content: null,
    nodeId: '',
    title: '',
  });
  const [siblingSelectorModal, setSiblingSelectorModal] = useState<{
    isOpen: boolean;
    parentPath: string[];
    parentKey: string;
    allSiblings: string[];
    currentSelection: string[];
  }>({
    isOpen: false,
    parentPath: [],
    parentKey: '',
    allSiblings: [],
    currentSelection: []
  });
  
  const { nodes: graphNodes, edges: graphEdges, rootOptions: currentRootOptions } = useMemo(() => {
    const result = jsonToSimpleGraph(data, simpleGraphState);
    return { 
      nodes: result.nodes, 
      edges: result.edges, 
      rootOptions: result.rootOptions 
    };
  }, [data, simpleGraphState]);

  // Update rootOptions when they change
  React.useEffect(() => {
    if (currentRootOptions) {
      setRootOptions(currentRootOptions);
    }
  }, [currentRootOptions]);

  const { layoutNodes, layoutEdges } = useGraphLayout(graphNodes, graphEdges, layoutDirection);

  const initialNodes = useMemo(() => {
    return layoutNodes.map((node) => {
      // Check if it's already a ReactFlow Node (from enhanced layout)
      if ('position' in node) {
        return {
          ...node,
          type: 'table-node',
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#f3f4f6' : '#111827',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            padding: '10px',
          },
        };
      }
      // Otherwise it's a GraphNode (from simple layout)
      return {
        id: node.id,
        type: 'table-node',
        position: { x: 0, y: 0 }, // Will be overridden by layout
        data: node.data,
        style: {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '8px',
          padding: '10px',
        },
      };
    });
  }, [layoutNodes, theme]);

  const initialEdges = useMemo(() => {
    return layoutEdges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: theme === 'dark' ? '#4b5563' : '#9ca3af',
      },
    }));
  }, [layoutEdges, theme]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleLayoutChange = (direction: 'TB' | 'LR') => {
    setLayoutDirection(direction);
  };

  const handleSimpleToggleExpand = useCallback((nodeId: string, path: string[], key: string) => {
    setSimpleGraphState(currentState => toggleNodeExpansion(nodeId, path, key, currentState));
  }, []);

  const handleSimpleSelectRoot = useCallback((rootKey: string) => {
    setSimpleGraphState(currentState => selectRoot(rootKey, currentState));
  }, []);

  const handleSimpleShowSiblingSelector = useCallback((parentPath: string[], parentKey: string, allSiblings: string[], currentSiblings: string[]) => {
    setSiblingSelectorModal({
      isOpen: true,
      parentPath,
      parentKey,
      allSiblings,
      currentSelection: currentSiblings
    });
  }, []);

  const handleSimpleApplySiblingSelection = useCallback((selectedKeys: string[]) => {
    const { parentPath, parentKey } = siblingSelectorModal;
    setSimpleGraphState(currentState => selectSiblings(parentPath, parentKey, selectedKeys, currentState));
    setSiblingSelectorModal({ ...siblingSelectorModal, isOpen: false });
  }, [siblingSelectorModal]);

  const handleSimpleShowMore = useCallback((_nodeId: string, path: string[], key: string) => {
    // Get the value at the current node
    const nodeValue = getValueAtPath(data, path, key);
    const childrenKeys = getChildrenKeys(nodeValue);
    
    // Show the sibling selector for this node's children
    handleSimpleShowSiblingSelector([...path, key], '', childrenKeys, []);
  }, [data, handleSimpleShowSiblingSelector]);

  const nodeTypes = useMemo(() => 
    createNodeTypes(
      handleSimpleToggleExpand,
      handleSimpleShowMore
    ), 
    [handleSimpleToggleExpand, handleSimpleShowMore]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1.2,
          minZoom: 0.1,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className={theme === 'dark' ? 'dark' : ''}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color={theme === 'dark' ? '#374151' : '#e5e7eb'}
        />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data?.nodeType) {
              case 'object':
                return '#f97316';
              case 'array':
                return '#ec4899';
              default:
                return '#3b82f6';
            }
          }}
          style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
          }}
          pannable
          zoomable
        />
        <Controls />
        <Panel position="top-right" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md space-y-2 min-w-[200px]">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Graph Settings
          </div>
          
          <Button 
            size="sm" 
            variant="outline"
            className="flex items-center gap-2 w-full text-xs"
            onClick={() => handleLayoutChange(layoutDirection === 'TB' ? 'LR' : 'TB')}
          >
            Layout: {layoutDirection === 'TB' ? 'Top-Down' : 'Left-Right'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-2 w-full text-xs"
            onClick={() => {
              const childCount = getChildrenKeys(data).length;
              const initialExpanded = new Set<string>();
              
              // Only auto-expand root if it has <= 10 children
              if (childCount > 0 && childCount <= 10) {
                const firstKey = getChildrenKeys(data)[0];
                if (firstKey) {
                  initialExpanded.add(firstKey);
                }
              }
              
              setSimpleGraphState({
                selectedRoot: simpleGraphState.selectedRoot,
                expandedNodes: initialExpanded,
                selectedSiblings: new Map()
              });
            }}
          >
            🔄 Reset
          </Button>
        </Panel>
        
        {/* Root Selector Panel */}
        {rootOptions.length > 0 && (
          <Panel position="top-left">
            <RootSelector
              rootOptions={rootOptions}
              selectedRoot={simpleGraphState.selectedRoot}
              onSelectRoot={handleSimpleSelectRoot}
              className="max-w-xs"
            />
          </Panel>
        )}
      </ReactFlow>
      
      <ContentPreview
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        content={previewModal.content}
        nodeId={previewModal.nodeId}
        title={previewModal.title}
      />
      
      <SiblingSelectorModal
        isOpen={siblingSelectorModal.isOpen}
        onClose={() => setSiblingSelectorModal({ ...siblingSelectorModal, isOpen: false })}
        parentPath={siblingSelectorModal.parentPath}
        parentKey={siblingSelectorModal.parentKey}
        allSiblings={siblingSelectorModal.allSiblings}
        currentSelection={siblingSelectorModal.currentSelection}
        onApplySelection={handleSimpleApplySiblingSelection}
      />
    </div>
  );
};