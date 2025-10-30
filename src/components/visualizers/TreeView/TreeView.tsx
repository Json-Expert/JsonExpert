import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import React, { useMemo, useState, useCallback } from 'react';

import { jsonToTreeNodes, filterTreeNodes } from '../../../lib/data-transformers';
import { enhancedSearchJson } from '../../../lib/enhanced-json-search';
import { useUIStore } from '../../../stores/ui-store';
import { JsonValue } from '../../../types/json.types';
import { TreeNode } from '../../../types/visualization.types';
import { Button } from '../../ui/Button';

import { TreeNodeComponent } from './TreeNode';

interface TreeViewProps {
  data: JsonValue;
}

export const TreeView: React.FC<TreeViewProps> = ({ data }) => {
  const { searchQuery, searchOptions, expandLevel } = useUIStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Enhanced search with multiple modes
  const { treeData, searchResults } = useMemo(() => {
    const tree = jsonToTreeNodes(data, [], expandLevel);
    
    if (!searchQuery) {
      return { treeData: tree, searchResults: null, highlightPaths: new Set<string>() };
    }
    
    // Use enhanced search for all modes
    const searchByType = searchOptions.searchByType;
    const searchOpts: any = {
      query: searchQuery,
      mode: searchQuery.startsWith('$') ? 'jsonpath' : 
            searchOptions.useRegex ? 'regex' : 'simple',
      caseSensitive: searchOptions.caseSensitive || false,
      searchInKeys: searchOptions.searchInKeys !== false,
      searchInValues: searchOptions.searchInValues !== false,
      searchInPaths: searchOptions.searchInPaths || false,
      includeAncestors: true,
    };
    if (searchByType) {
      searchOpts.searchByType = searchByType;
    }
    const { results } = enhancedSearchJson(data, searchOpts);
    
    // Create a set of paths to highlight
    const pathsToHighlight = new Set<string>();
    results.forEach(result => {
      pathsToHighlight.add(result.path);
      // Also highlight ancestors
      if (result.context?.ancestors) {
        result.context.ancestors.forEach(ancestor => pathsToHighlight.add(ancestor));
      }
    });
    
    // Filter tree if needed
    const filteredTree = searchOptions.searchInKeys || searchOptions.searchInValues
      ? filterTreeNodes(tree, searchQuery)
      : tree;
    
    return { 
      treeData: filteredTree || tree, 
      searchResults: results,
      highlightPaths: pathsToHighlight
    };
  }, [data, expandLevel, searchQuery, searchOptions]);

  const handleNodeToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const toggleAllNodes = useCallback(() => {
    if (allExpanded) {
      setExpandedNodes(new Set());
      setAllExpanded(false);
    } else {
      const allNodeIds = new Set<string>();
      const collectNodeIds = (node: TreeNode) => {
        allNodeIds.add(node.id);
        node.children.forEach(collectNodeIds);
      };
      if (treeData) collectNodeIds(treeData);
      setExpandedNodes(allNodeIds);
      setAllExpanded(true);
    }
  }, [allExpanded, treeData]);

  const modifiedTreeData = useMemo(() => {
    if (!treeData) return null;
    
    const modifyNode = (node: TreeNode): TreeNode => ({
      ...node,
      expanded: expandedNodes.has(node.id) ?? node.expanded,
      children: node.children.map(modifyNode),
    });
    
    return modifyNode(treeData);
  }, [treeData, expandedNodes]);

  if (!modifiedTreeData) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b flex-shrink-0">
        <div className="text-sm text-muted-foreground">
          Tree View
          {searchResults && searchResults.length > 0 && (
            <span className="ml-2 text-xs">
              ({searchResults.length} matches found)
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {searchQuery && (
            <div className="flex items-center text-xs text-muted-foreground mr-2">
              <Search className="h-3 w-3 mr-1" />
              {searchQuery.startsWith('$') ? 'JSONPath' : 'Search'}: {searchQuery}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAllNodes}
            className="h-7"
          >
            {allExpanded ? (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                Expand All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto p-2">
        <div className="min-w-max">
          <TreeNodeComponent
            node={modifiedTreeData}
            searchQuery={searchQuery}
            onToggle={handleNodeToggle}
          />
        </div>
      </div>
    </div>
  );
};