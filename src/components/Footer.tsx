
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-legal-blue text-white py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-serif font-bold">Herencia Familia Dominicana</h3>
            <p className="text-sm mt-1 text-legal-beige/70">Documentación legal para determinación de herederos</p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm text-legal-beige/70">
              Documento preparado para el Tribunal de Tierras
            </p>
            <p className="text-xs mt-2 text-legal-beige/50">
              © {currentYear} Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
