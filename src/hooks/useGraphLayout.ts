import { useMemo } from 'react';
import { Node, Edge } from 'reactflow';

import { applyEnhancedTreeLayout } from '@/lib/enhanced-tree-layout';
import { applyTreeLayout, LayoutOptions } from '@/lib/graph-layout';
import { GraphNode, GraphEdge } from '@/types/visualization.types';

export function useGraphLayout(
  nodes: GraphNode[], 
  edges: GraphEdge[], 
  layoutDirection: 'TB' | 'LR'
) {
  const layoutOptions: LayoutOptions = useMemo(() => ({
    direction: layoutDirection,
    nodeSpacing: layoutDirection === 'LR' ? 120 : 100,
    levelSpacing: layoutDirection === 'LR' ? 250 : 180,
    nodeWidth: 220,
    nodeHeight: 70,
    algorithm: 'tight-tree',
    rankSeparation: layoutDirection === 'LR' ? 250 : 180,
    edgeSeparation: 30,
  }), [layoutDirection]);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    try {
      return applyEnhancedTreeLayout(nodes, edges, {
        direction: layoutDirection,
        nodeWidth: 220,
        nodeHeight: 70,
        levelSeparation: layoutDirection === 'LR' ? 350 : 150,
        siblingSeparation: layoutDirection === 'LR' ? 120 : 80,
        subtreeSeparation: layoutDirection === 'LR' ? 180 : 120,
      });
    } catch (error) {
      console.error('Layout calculation error:', error);
      try {
        return applyTreeLayout(nodes, edges, layoutOptions);
      } catch (fallbackError) {
        console.error('Fallback layout error:', fallbackError);
        return { nodes, edges };
      }
    }
  }, [nodes, edges, layoutDirection, layoutOptions]);

  return { layoutNodes, layoutEdges };
}
