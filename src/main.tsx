import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './styles/theme.css';
import './index.css';

// Create container first, separate from render to prevent message channel closure
const rootElement = document.getElementById('root');

// Make sure root element exists
if (rootElement) {
  const root = createRoot(rootElement);

  // Render with error handling
  try {
    root.render(
      <StrictMode>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </StrictMode>
    );
  } catch (error) {
    console.error("Error rendering application:", error);
    // Provide fallback
    rootElement.innerHTML = '<div style="text-align: center; padding: 20px;"><h1>Application Error</h1><p>Please try refreshing the page.</p></div>';
  }
} else {
  console.error("Root element not found. Cannot mount React application.");
  // Create a fallback root element if needed
  document.body.innerHTML = '<div style="text-align: center; padding: 20px;"><h1>Application Error</h1><p>Root element not found. Please refresh the page.</p></div>';
}