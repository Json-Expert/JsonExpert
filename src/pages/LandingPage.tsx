import React from 'react';

import { InputTabs } from '@/components/input/InputTabs';
import { Layout } from '@/components/layout/Layout';
import { useJsonStore } from '@/stores/json-store';

export const LandingPage: React.FC = () => {
  const { error } = useJsonStore();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight">JSON Expert</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Professional JSON visualization and analysis tool
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <a href="https://jsonexpert.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
                jsonexpert.com
              </a>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          <InputTabs />
        </div>
      </div>
    </Layout>
  );
};
