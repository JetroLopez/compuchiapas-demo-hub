import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo-compuchiapas.png';
import GlobalSearchDropdown from './GlobalSearchDropdown';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface NavBarProps {
  productSearchTerm?: string;
  onProductSearchChange?: (term: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ productSearchTerm, onProductSearchChange }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const { isPageVisible } = usePageVisibility();
  
  const needsDarkHeader = true;
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [menuOpen]);

  const PAGE_VISIBILITY_MAP: Record<string, string> = {
    '/': 'inicio',
    '/servicios': 'servicios',
    '/productos': 'productos',
    '/software-esd': 'software-esd',
    '/blog': 'blog',
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Servicios', path: '/servicios' },
    { name: 'Productos', path: '/productos' },
    { name: 'Software ESD', path: '/software-esd' },
    { name: 'Blog', path: '/blog' },
  ].filter(link => {
    const visId = PAGE_VISIBILITY_MAP[link.path];
    return visId ? isPageVisible(visId) : true;
  });

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/contacto') {
      e.preventDefault();
      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header 
      ref={headerRef}
      className={cn(
        'fixed w-full z-50 transition-all duration-300 ease-in-out',
        isScrolled 
          ? 'bg-background/80 backdrop-blur-lg shadow-sm dark:bg-background/90' 
          : needsDarkHeader 
            ? 'bg-tech-blue' 
            : 'bg-transparent'
      )}
    >
      <div className="container-padding mx-auto">
        <div className="flex items-center justify-between h-14 md:h-20 gap-4">
          <Link to="/" className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <img src={logo} alt="Compuchiapas Logo" className="h-10 w-10 md:h-16 md:w-16 object-contain" />
            <span className={cn(
              "text-lg md:text-2xl font-bold flex items-baseline transition-colors duration-300",
              isScrolled ? "text-tech-blue dark:text-white" : "text-white"
            )}>
              Compuchiapas<span className="text-[10px] md:text-sm ml-0.5">.com.mx</span>
            </span>
          </Link>

          {/* Desktop Search Bar - global dropdown */}
          <GlobalSearchDropdown isScrolled={isScrolled} />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 flex-shrink-0">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  'font-medium transition-colors',
                  isScrolled 
                    ? (location.pathname === link.path ? 'text-tech-blue dark:text-primary' : 'text-gray-600 dark:text-gray-300 hover:text-tech-blue dark:hover:text-primary')
                    : (location.pathname === link.path ? 'text-white' : 'text-white/80 hover:text-white')
                )}
              >
                {link.name}
              </Link>
            ))}
            {isPageVisible('contacto') && (
              <a 
                href={location.pathname === '/contacto' ? '#contact-form' : '/contacto'} 
                className="btn-primary bg-orange-500 hover:bg-orange-600 border-orange-500"
                onClick={handleContactClick}
              >
                Contáctanos
              </a>
            )}
          </nav>

          {/* Mobile menu button */}
          <button 
            className={cn(
              "md:hidden p-2 transition-colors duration-300",
              isScrolled ? "text-gray-800 dark:text-white" : "text-white"
            )}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <nav className="flex flex-col px-4 py-6 space-y-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  'font-medium py-2 transition-colors',
                  location.pathname === link.path 
                    ? 'text-tech-blue dark:text-primary' 
                    : 'text-gray-600 dark:text-gray-300'
                )}
              >
                {link.name}
              </Link>
            ))}
            {isPageVisible('contacto') && (
              <a 
                href={location.pathname === '/contacto' ? '#contact-form' : '/contacto'} 
                className="btn-primary bg-orange-500 hover:bg-orange-600 border-orange-500 text-center mt-2"
                onClick={handleContactClick}
              >
                Contáctanos
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;
