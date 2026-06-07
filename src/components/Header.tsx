"use client";

import { useState } from "react";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/config";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1" onClick={closeMenu}>
          <span className="text-[#1565C0] font-extrabold text-xl tracking-tight">Auto Fácil</span>
          <span className="text-[#F57C00] text-[10px] font-bold uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded ml-1">MZA</span>
        </Link>

        {/* Nav de escritorio (sin cambios visuales, visible desde md) */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-500 hover:text-[#1565C0] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors"
          >
            WhatsApp
          </a>
        </nav>

        {/* Controles mobile: WhatsApp + botón hamburguesa (debajo de md) */}
        {/* gap ampliado (gap-4) para separar mejor ambos botones y evitar taps accidentales */}
        <div className="flex items-center gap-4 md:hidden">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors"
          >
            WhatsApp
          </a>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="relative w-11 h-11 flex items-center justify-center rounded-full text-gray-500 hover:text-[#1565C0] hover:bg-gray-50 transition-colors active:bg-gray-100"
          >
            <span className="relative w-5 h-4 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-300 ease-in-out ${
                  isOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current rounded-full transition-opacity duration-200 ease-in-out ${
                  isOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-300 ease-in-out ${
                  isOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Menú mobile desplegable, con transición suave de apertura/cierre */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden border-t border-gray-100 transition-[max-height,opacity] duration-300 ease-in-out ${
          isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-sm font-medium text-gray-500 hover:text-[#1565C0] py-3 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
