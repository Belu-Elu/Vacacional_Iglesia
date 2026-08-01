import "./globals.css";

export const metadata = {
  title: "Vacacional - Sistema de Inscripción y Asistencia",
  description: "Sistema de registro y control de asistencia con QR",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-gray-50">{children}</body>
    </html>
  );
}
