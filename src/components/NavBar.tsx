
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/UserMenu";

const NavBar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { text: 'Inicio', href: '/' },
    { text: 'Árbol Genealógico', href: '/arbol-genealogico' },
    { text: 'Árbol Clásico', href: '/arbol-genealogico-clasico' },
    { text: 'Líneas Familiares', href: '/lineas-familiares' },
    { text: 'Determinación de Herederos', href: '/determinacion-herederos' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-serif font-bold text-legal-blue">HerenciaRD</span>
          <span className="ml-1 text-sm text-legal-gold">2025</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-legal-blue text-white"
                  : "text-legal-dark hover:bg-legal-beige"
              )}
            >
              {link.text}
            </Link>
          ))}
          
          {/* User Menu added here */}
          <div className="ml-2">
            <UserMenu />
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-2 px-4 shadow-lg animate-fade-in">
          <div className="flex flex-col space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors block",
                  isActive(link.href)
                    ? "bg-legal-blue text-white"
                    : "text-legal-dark hover:bg-legal-beige"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
