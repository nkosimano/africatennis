import { useTheme } from '../../contexts/ThemeContext';
import { useEffect, useState } from 'react';

export function ThemeDebugger() {
  const { theme, toggleTheme } = useTheme();
  const [cssVars, setCssVars] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Get computed CSS variables
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const variables = {
      '--color-primary': computedStyle.getPropertyValue('--color-primary'),
      '--color-text': computedStyle.getPropertyValue('--color-text'),
      '--color-background': computedStyle.getPropertyValue('--color-background'),
      '--color-accent': computedStyle.getPropertyValue('--color-accent'),
      'data-theme': root.getAttribute('data-theme') || 'none'
    };
    
    setCssVars(variables);
  }, [theme]);
  
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
      <h3 className="font-bold mb-2">Theme Debugger</h3>
      <p className="mb-2">Current theme: <strong>{theme}</strong></p>
      <div className="mb-3">
        <button 
          onClick={toggleTheme}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Theme
        </button>
      </div>
      <div className="text-xs">
        <h4 className="font-semibold mb-1">CSS Variables:</h4>
        <ul className="space-y-1">
          {Object.entries(cssVars).map(([key, value]) => (
            <li key={key}>
              <span className="font-mono">{key}:</span> <span className="font-mono">{value.trim() || '(empty)'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
