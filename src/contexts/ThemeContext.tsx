import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  systemTheme: Theme | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  enableSystem = true,
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      // Only run this code on the client side
      if (typeof window !== 'undefined') {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem(storageKey) as Theme;
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
          return savedTheme;
        }
        
        // Use system preference if enabled
        if (enableSystem) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    return defaultTheme;
  });
  
  const [systemTheme, setSystemTheme] = useState<Theme | null>(null);

  // Track system theme changes if enabled
  useEffect(() => {
    if (!enableSystem) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      // If no user preference is set, follow system
      if (!localStorage.getItem(storageKey)) {
        setThemeState(newSystemTheme);
        applyTheme(newSystemTheme);
      }
    };
    
    // Set initial system theme
    updateSystemTheme();
    
    // Listen for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemTheme);
      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    }
  }, [enableSystem, storageKey]);

  // Apply theme on initial render and when document is ready
  useEffect(() => {
    const applyInitialTheme = () => {
      applyTheme(theme);
    };

    // Apply immediately
    applyInitialTheme();

    // Also apply when document is fully loaded to ensure it works across all pages
    if (document.readyState === 'complete') {
      applyInitialTheme();
    } else {
      window.addEventListener('load', applyInitialTheme);
      return () => window.removeEventListener('load', applyInitialTheme);
    }
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
    console.log(`Theme switched to: ${theme}`);
  }, [theme, storageKey]);

  const applyTheme = (currentTheme: Theme) => {
    if (!document || !document.documentElement) return;
    
    const root = document.documentElement;
    
    // For light theme, remove the data-theme attribute
    if (currentTheme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      // For dark theme, set the data-theme attribute
      root.setAttribute('data-theme', 'dark');
    }
    
    // Add a class to the body for debugging and additional styling
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${currentTheme}`);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, systemTheme }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
