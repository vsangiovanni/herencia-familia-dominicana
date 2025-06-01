
import React from 'react';
import { Link } from 'react-router-dom';
import NavigationMenu from './NavigationMenu';
import UserMenu from './UserMenu';
import MobileMenu from './MobileMenu';

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
          
          <NavigationMenu />
          
          <div className="hidden md:flex items-center">
            <UserMenu />
          </div>

          <MobileMenu />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
