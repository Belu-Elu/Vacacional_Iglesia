export default function Footer({ edicion, configGeneral }) {
  return (
    <footer className="w-full bg-primary-dark text-green-50 py-8 px-4 mt-auto">
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2 text-sm">
        {/* Datos del vacacional vigente */}
        <div>
          <p className="font-bold text-white text-base mb-1">
            {edicion?.titulo || "Vacacional"}
          </p>
          {edicion?.direccion_vacacional && (
            <p className="opacity-90">📍 {edicion.direccion_vacacional}</p>
          )}
          {edicion?.contacto_telefono && (
            <p className="opacity-90">📞 {edicion.contacto_telefono}</p>
          )}
        </div>

        {/* Iglesia organizadora (fija, no cambia entre ediciones) */}
        <div className="flex items-center gap-3 md:justify-end">
          {configGeneral?.logo_iglesia_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={configGeneral.logo_iglesia_url}
              alt={configGeneral?.nombre_iglesia || "Iglesia"}
              className="h-12 w-12 object-contain rounded-full bg-white p-1"
            />
          )}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">Organiza</p>
            <p className="font-semibold text-white">
              {configGeneral?.nombre_iglesia || "Iglesia"}
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs opacity-50 mt-6">
        {edicion?.titulo || "Vacacional"} &middot; {edicion?.anio || new Date().getFullYear()}
      </p>
    </footer>
  );
}
