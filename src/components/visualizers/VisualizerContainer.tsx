import React, { Suspense } from 'react';

import { useUIStore } from '@/stores/ui-store';
import { JsonValue } from '@/types/json.types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Loading } from '@/components/common/Loading';
import { Card } from '@/components/ui/Card';

const TreeView = React.lazy(() => import('./TreeView').then(module => ({ default: module.TreeView })));
const RawView = React.lazy(() => import('./RawView').then(module => ({ default: module.RawView })));
const NewGraphView = React.lazy(() => import('./GraphView/NewGraphView').then(module => ({ default: module.NewGraphView })));
const TableView = React.lazy(() => import('./TableView').then(module => ({ default: module.TableView })));

interface VisualizerContainerProps {
  data: JsonValue;
}

export const VisualizerContainer: React.FC<VisualizerContainerProps> = ({ data }) => {
  const { activeView } = useUIStore();

  const renderView = () => {
    switch (activeView) {
      case 'tree':
        return <TreeView data={data} />;
      case 'raw':
        return <RawView data={data} />;
      case 'graph':
        return <NewGraphView data={data} />;
      case 'table':
        return <TableView data={data} />;
      default:
        return <TreeView data={data} />;
    }
  };

  return (
    <Card 
      className="h-full overflow-hidden visualization-container"
      data-export="visualization"
      data-view={activeView}
    >
      <ErrorBoundary>
        <Suspense fallback={<Loading message={`Loading ${activeView} view...`} />}>
          {renderView()}
        </Suspense>
      </ErrorBoundary>
    </Card>
  );
};