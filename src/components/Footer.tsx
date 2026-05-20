
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-legal-blue py-6 text-white">
      <div className="app-shell">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <h3 className="font-serif text-xl font-bold">HerenciaRD</h3>
            <p className="mt-1 text-sm text-legal-beige/70">
              Herencia familiar dominicana — árbol genealógico y determinación de herederos
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-legal-beige/80">
              Desarrollado por <span className="font-semibold text-legal-gold">Víctor Sangiovanni</span>
            </p>
            <p className="mt-1 text-xs text-legal-beige/50">
              © {currentYear} Víctor Sangiovanni. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
