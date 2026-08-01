export default function Header({ edicion }) {
  const imagenFondo = edicion?.imagen_header_url;

  return (
    <header
      className="w-full relative text-white overflow-hidden"
      style={{
        backgroundImage: imagenFondo
          ? `linear-gradient(rgba(10,40,15,0.6), rgba(10,40,15,0.6)), url(${imagenFondo})`
          : "linear-gradient(135deg, #1b5e20 0%, #2f7d32 55%, #66bb6a 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-3 text-center py-10 px-4">
        {edicion?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={edicion.logo_url}
            alt={edicion.titulo}
            className="h-24 w-24 object-contain rounded-full bg-white p-2 shadow-lg"
          />
        )}

        <h1 className="text-2xl md:text-4xl font-bold drop-shadow-sm">
          {edicion?.titulo || "Vacacional"}
        </h1>

        {edicion?.versiculo && (
          <p className="text-sm md:text-base italic max-w-xl opacity-95 drop-shadow-sm">
            &ldquo;{edicion.versiculo}&rdquo;
          </p>
        )}
      </div>
    </header>
  );
}
