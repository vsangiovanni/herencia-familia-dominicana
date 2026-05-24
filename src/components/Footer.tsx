
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-[#D9CDB8] bg-[#223A5E] py-6 text-white dark:border-[#243047] dark:bg-[#0A1020]">
      <div className="app-shell">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <h3 className="font-serif text-xl font-bold">Legado Sangiovanni</h3>
            <p className="mt-1 text-sm text-legal-beige/70">
              Expediente familiar — árbol, reparto, hallazgos y evidencia
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
