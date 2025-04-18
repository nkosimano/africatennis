import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/theme.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Check if the root element exists
const rootElement = document.getElementById('root');

if (!rootElement) {
  // Create a div element with id 'root'
  const div = document.createElement('div');
  div.id = 'root';
  document.body.appendChild(div);
}

// Get the root element (either existing or newly created)
const root = ReactDOM.createRoot(document.getElementById('root')!);

const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseProvider>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);