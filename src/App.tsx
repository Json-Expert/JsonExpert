import React from 'react';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Loading } from '@/components/common/Loading';
import { ToastContainer } from '@/components/common/Toast';
import { Layout } from '@/components/layout/Layout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/useToast';
import { LandingPage } from '@/pages/LandingPage';
import { MainDashboard } from '@/pages/MainDashboard';
import { useJsonStore } from '@/stores/json-store';

function App() {
  const { data, isLoading, setJsonData, setInputMethod } = useJsonStore();
  const { toasts, removeToast } = useToast();
  useKeyboardShortcuts();

  // Check for test data in localStorage
  React.useEffect(() => {
    const testData = localStorage.getItem('jsonExpertTestData');
    if (testData && !data) {
      try {
        const parsed = JSON.parse(testData);
        setJsonData(parsed.data, JSON.stringify(parsed.data, null, 2));
        setInputMethod('paste');
        localStorage.removeItem('jsonExpertTestData'); // Clean up
      } catch (e) {
        console.error('Failed to load test data:', e);
      }
    }
  }, [data, setJsonData, setInputMethod]);

  let content;
  if (isLoading) {
    content = (
      <Layout>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Loading message="Processing JSON..." />
        </div>
      </Layout>
    );
  } else if (!data) {
    content = (
      <ErrorBoundary>
        <LandingPage />
      </ErrorBoundary>
    );
  } else {
    content = (
      <ErrorBoundary>
        <MainDashboard />
      </ErrorBoundary>
    );
  }

  return (
    <>
      {content}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;