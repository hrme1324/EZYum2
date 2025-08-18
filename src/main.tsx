import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import AppRoot from './AppRoot.tsx';
import './index.css';
import { setupGlobalErrorHandling } from './utils/logger';

// Setup global error handling before anything else
setupGlobalErrorHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
          <BrowserRouter>
      <AppRoot />
      <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#F8F5F0',
              color: '#33322E',
              border: '1px solid #CFAF87',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
