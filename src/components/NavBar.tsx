
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

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
      className={cn(
        'fixed w-full z-50 transition-all duration-300 ease-in-out',
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="container-padding mx-auto">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-tech-blue flex items-baseline">
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
                  'font-medium transition-colors hover:text-tech-blue',
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
              className="btn-primary"
              onClick={handleContactClick}
            >
              Contáctanos
            </a>
          </nav>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2" 
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
