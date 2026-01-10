import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo-compuchiapas.png';

const NavBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  
  // Pages that need dark header when not scrolled
  const needsDarkHeader = ['/productos', '/servicios', '/blog', '/contacto'].includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside
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

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Servicios', path: '/servicios' },
    { name: 'Productos', path: '/productos' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contacto', path: '/contacto' },
  ];

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
          ? 'bg-white/80 backdrop-blur-lg shadow-sm' 
          : needsDarkHeader 
            ? 'bg-tech-blue' 
            : 'bg-transparent'
      )}
    >
      <div className="container-padding mx-auto">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Compuchiapas Logo" className="h-12 w-12 object-contain" />
            <span className={cn(
              "text-2xl font-bold flex items-baseline transition-colors duration-300",
              isScrolled ? "text-tech-blue" : "text-white"
            )}>
              Compuchiapas<span className="text-sm ml-0.5">.com.mx</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  'font-medium transition-colors',
                  isScrolled 
                    ? (location.pathname === link.path ? 'text-tech-blue' : 'text-gray-600 hover:text-tech-blue')
                    : (location.pathname === link.path ? 'text-white' : 'text-white/80 hover:text-white')
                )}
              >
                {link.name}
              </Link>
            ))}
            <a 
              href={location.pathname === '/contacto' ? '#contact-form' : '/contacto'} 
              className="btn-primary"
              onClick={handleContactClick}
            >
              Contáctanos
            </a>
          </nav>

          {/* Mobile menu button */}
          <button 
            className={cn(
              "md:hidden p-2 transition-colors duration-300",
              isScrolled ? "text-gray-800" : "text-white"
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
        <div className="md:hidden bg-white">
          <nav className="flex flex-col px-4 py-6 space-y-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  'font-medium py-2 transition-colors',
                  location.pathname === link.path 
                    ? 'text-tech-blue' 
                    : 'text-gray-600'
                )}
              >
                {link.name}
              </Link>
            ))}
            <a 
              href={location.pathname === '/contacto' ? '#contact-form' : '/contacto'} 
              className="btn-primary text-center mt-2"
              onClick={handleContactClick}
            >
              Contáctanos
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;
