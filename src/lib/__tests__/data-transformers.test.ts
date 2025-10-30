import { describe, it, expect } from 'vitest';

import {
  jsonToTreeNodes,
  jsonToGraph,
  jsonToTableRows,
  filterTreeNodes,
  getJsonPath,
} from '../data-transformers';

describe('Data Transformers', () => {
  const sampleData = {
    name: 'root',
    value: 123,
    nested: {
      array: [1, 2, 3],
      bool: true,
    },
    nullValue: null,
  };

  describe('jsonToTreeNodes', () => {
    it('should convert JSON to tree structure', () => {
      const tree = jsonToTreeNodes(sampleData);
      
      expect(tree.key).toBe('root');
      expect(tree.type).toBe('object');
      expect(tree.children).toHaveLength(4);
      expect(tree.expanded).toBe(true);
    });

    it('should respect expand level', () => {
      const tree = jsonToTreeNodes(sampleData, [], 1);
      
      expect(tree.expanded).toBe(true);
      expect(tree.children?.[2]?.expanded).toBe(false); // nested object
    });

    it('should handle arrays', () => {
      const tree = jsonToTreeNodes([1, 2, 3]);
      
      expect(tree.type).toBe('array');
      expect(tree.children).toHaveLength(3);
      expect(tree.children?.[0]?.key).toBe('[0]');
    });

    it('should handle primitive values', () => {
      const tree = jsonToTreeNodes('string value');
      
      expect(tree.type).toBe('string');
      expect(tree.value).toBe('string value');
      expect(tree.children).toHaveLength(0);
    });
  });

  describe('jsonToGraph', () => {
    it('should convert JSON to graph nodes and edges', () => {
      const { nodes, edges } = jsonToGraph(sampleData);
      
      expect(nodes.length).toBeGreaterThan(0);
      expect(edges.length).toBeGreaterThan(0);
      
      const rootNode = nodes.find(n => n.label === 'root');
      expect(rootNode).toBeDefined();
      expect(rootNode?.type).toBe('object');
    });

    it('should create edges between parent and child nodes', () => {
      const { nodes, edges } = jsonToGraph({ parent: { child: 'value' } });
      
      expect(nodes).toHaveLength(3);
      expect(edges).toHaveLength(2);
    });

    it('should handle circular references', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      
      // Should not throw error
      expect(() => jsonToGraph(circular)).not.toThrow();
    });
  });

  describe('jsonToTableRows', () => {
    it('should flatten JSON to table rows', () => {
      const rows = jsonToTableRows(sampleData);
      
      expect(rows.length).toBeGreaterThan(0);
      
      const nameRow = rows.find(r => r.key === 'name');
      expect(nameRow).toBeDefined();
      expect(nameRow?.value).toBe('root');
      expect(nameRow?.path).toBe('name');
    });

    it('should handle nested paths', () => {
      const rows = jsonToTableRows(sampleData);
      
      const nestedRow = rows.find(r => r.path === 'nested.array.[0]');
      expect(nestedRow).toBeDefined();
      expect(nestedRow?.value).toBe(1);
    });

    it('should include type information', () => {
      const rows = jsonToTableRows(sampleData);
      
      expect(rows.find(r => r.type === 'string')).toBeDefined();
      expect(rows.find(r => r.type === 'number')).toBeDefined();
      expect(rows.find(r => r.type === 'boolean')).toBeDefined();
      expect(rows.find(r => r.type === 'null')).toBeDefined();
    });
  });

  describe('filterTreeNodes', () => {
    it('should filter nodes by search query', () => {
      const tree = jsonToTreeNodes(sampleData);
      const filtered = filterTreeNodes(tree, 'value');
      
      expect(filtered).not.toBeNull();
      expect(filtered?.children.length).toBeLessThanOrEqual(tree.children.length);
    });

    it('should return null for no matches', () => {
      const tree = jsonToTreeNodes(sampleData);
      const filtered = filterTreeNodes(tree, 'nonexistent');
      
      expect(filtered).toBeNull();
    });

    it('should expand matching nodes', () => {
      const tree = jsonToTreeNodes(sampleData, [], 0); // All collapsed
      const filtered = filterTreeNodes(tree, 'array');
      
      expect(filtered?.children.find(c => c.key === 'nested')?.expanded).toBe(true);
    });

    it('should be case-insensitive', () => {
      const tree = jsonToTreeNodes({ Name: 'Test' });
      const filtered = filterTreeNodes(tree, 'name');
      
      expect(filtered).not.toBeNull();
    });
  });

  describe('getJsonPath', () => {
    it('should create dot notation path', () => {
      expect(getJsonPath(['root', 'nested', 'value'])).toBe('root.nested.value');
    });

    it('should handle array indices', () => {
      expect(getJsonPath(['array', '[0]', 'value'])).toBe('array[0].value');
    });

    it('should handle empty path', () => {
      expect(getJsonPath([])).toBe('');
    });

    it('should handle single element', () => {
      expect(getJsonPath(['root'])).toBe('root');
    });
  });
});