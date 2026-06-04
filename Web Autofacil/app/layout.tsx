import "./globals.css";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AutoFácil — Tu próximo auto está acá",
  description: "Catálogo de autos usados y nuevos al mejor precio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Navbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-extrabold text-blue-600 tracking-tight">
              Auto<span className="text-gray-900">Fácil</span>
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
              <Link href="/catalogo" className="hover:text-blue-600 transition-colors">Catálogo</Link>
            </nav>
          </div>
        </header>

        {/* Contenido */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} AutoFácil. Todos los derechos reservados.
          </div>
        </footer>
      </body>
    </html>
  );
}
