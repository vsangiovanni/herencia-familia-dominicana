
import React from 'react';
import { Link } from 'react-router-dom';
import NavigationMenu from './NavigationMenu';
import UserMenu from './UserMenu';
import MobileNavigationMenu from './MobileNavigationMenu';

const NavBar = () => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-legal-blue font-bold text-xl">
              HerenciaRD
            </Link>
          </div>
          
          {/* Desktop Navigation Menu */}
          <NavigationMenu />
          
          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center">
            <UserMenu />
          </div>

          {/* Mobile Navigation Menu */}
          <MobileNavigationMenu />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
