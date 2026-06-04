import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import FloatingButtons from "@/components/FloatingButtons";
import { INSTAGRAM_URL, VISUALIK_URL, WHATSAPP_NUMBER } from "@/lib/config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Auto Fácil MZA — Tu auto, fácil.",
  description: "Accedé a tu auto sin vueltas ni letra chica. Catálogo con financiación en Mendoza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <html lang="es" className={poppins.variable}>
      <body className="min-h-screen bg-gray-50 text-[#121212] antialiased" style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}>

        {/* Navbar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1">
              <span className="text-[#1565C0] font-extrabold text-xl tracking-tight">Auto Fácil</span>
              <span className="text-[#F57C00] text-[10px] font-bold uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded ml-1">MZA</span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-2 sm:gap-6">
              <Link href="/" className="text-sm font-medium text-gray-500 hover:text-[#1565C0] transition-colors hidden sm:block">
                Inicio
              </Link>
              <Link href="/catalogo" className="text-sm font-medium text-gray-500 hover:text-[#1565C0] transition-colors hidden sm:block">
                Catálogo
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors"
              >
                WhatsApp
              </a>
            </nav>
          </div>
        </header>

        {/* Contenido */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="mt-20" style={{ backgroundColor: "#121212", color: "#9ca3af" }}>
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

              {/* Marca */}
              <div>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-white font-extrabold text-xl tracking-tight">Auto Fácil</span>
                  <span className="text-[#F57C00] text-[10px] font-bold uppercase tracking-widest bg-orange-950 px-1.5 py-0.5 rounded ml-1">MZA</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
                  Tu auto, fácil.<br />Sin vueltas. Sin letra chica.
                </p>
              </div>

              {/* Navegación */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#4b5563" }}>
                  Navegación
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
                  </li>
                  <li>
                    <Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link>
                  </li>
                </ul>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#4b5563" }}>
                  Contacto
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                      WhatsApp
                    </a>
                  </li>
                  <li>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                      Instagram
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Línea de cierre */}
            <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ borderColor: "#1f2937", color: "#4b5563" }}>
              <span>© {currentYear} Auto Fácil MZA. Todos los derechos reservados.</span>
              <span>
                Creado por{" "}
                <a
                  href={VISUALIK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-white transition-colors"
                  style={{ color: "#6b7280" }}
                >
                  Visualik
                </a>
              </span>
            </div>
          </div>
        </footer>

        <FloatingButtons />
      </body>
    </html>
  );
}
