export default function Footer({ edicion }) {
  return (
    <footer className="w-full bg-gray-900 text-gray-300 py-6 px-4 text-center text-sm mt-auto">
      <p>
        {edicion?.titulo || "Vacacional"} &middot; {edicion?.anio || new Date().getFullYear()}
      </p>
      {edicion?.contacto_telefono && (
        <p className="mt-1">📞 {edicion.contacto_telefono}</p>
      )}
    </footer>
  );
}
