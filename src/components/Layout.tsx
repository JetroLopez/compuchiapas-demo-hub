import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NavBar from './NavBar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('site-dark-mode') === 'true';
    }
    return false;
  });
  
  // Scroll to top when the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('site-dark-mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Toaster />
      <NavBar />
      
      {/* Dark mode toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        className="fixed top-24 right-4 z-40 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border-border"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </Button>
      
      <main className="flex-grow">
        {children}
      </main>
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default Layout;
