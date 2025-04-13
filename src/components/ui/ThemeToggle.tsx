import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  
  // Check initial theme on component mount
  useEffect(() => {
    // Check if we have a stored theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      applyTheme(savedTheme === 'dark');
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(systemPrefersDark);
      applyTheme(systemPrefersDark);
    }
  }, []);
  
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    
    // Save preference
    try {
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  const applyTheme = (dark: boolean) => {
    if (!document || !document.documentElement) return;
    
    const root = document.documentElement;
    
    if (dark) {
      root.setAttribute('data-theme', 'dark');
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    } else {
      root.removeAttribute('data-theme');
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-full"
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'opacity-0 scale-0 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 rotate-90'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
