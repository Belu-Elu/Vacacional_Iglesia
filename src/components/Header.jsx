export default function Header({ edicion }) {
  if (!edicion) {
    return (
      <header className="w-full bg-primary text-white py-6 px-4 text-center shadow">
        <h1 className="text-2xl font-bold">Vacacional</h1>
      </header>
    );
  }

  return (
    <header className="w-full bg-primary text-white py-6 px-4 shadow">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-3 text-center">
        {edicion.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={edicion.logo_url}
            alt={edicion.titulo}
            className="h-20 w-20 object-contain rounded-full bg-white p-1"
          />
        )}
        <h1 className="text-2xl md:text-3xl font-bold">{edicion.titulo}</h1>
        {edicion.contacto_telefono && (
          <p className="text-sm opacity-90">
            Contacto: {edicion.contacto_telefono}
          </p>
        )}
      </div>
    </header>
  );
}
