import React from 'react';

import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { Layout } from '@/components/layout/Layout';
import { VisualizerContainer } from '@/components/visualizers/VisualizerContainer';
import { getJSONStats } from '@/lib/json-parser';
import { formatBytes } from '@/lib/utils';
import { useJsonStore } from '@/stores/json-store';

export const MainDashboard: React.FC = () => {
  const { data, parsedData } = useJsonStore();

  if (!data) {
    // This should not happen if routing is correct, but as a fallback
    return null;
  }

  const stats = getJSONStats(data);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
        <ControlPanel />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 p-4 min-h-0 overflow-hidden">
            <VisualizerContainer data={data} />
          </div>

          <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l p-4 overflow-auto">
            <h3 className="font-semibold mb-4">JSON Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span>{formatBytes(parsedData?.size ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lines:</span>
                <span>{parsedData?.lineCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keys:</span>
                <AnimatedCounter value={stats.totalKeys} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Values:</span>
                <AnimatedCounter value={stats.totalValues} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Depth:</span>
                <AnimatedCounter value={stats.maxDepth} />
              </div>

              <div className="pt-2 border-t">
                <p className="text-muted-foreground mb-1">Types:</p>
                {Object.entries(stats.types).map(([type, count]) =>
                  count > 0 && (
                    <div key={type} className="flex justify-between ml-2">
                      <span className="text-muted-foreground">{type}:</span>
                      <AnimatedCounter value={count} />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
