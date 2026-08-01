"use client";

export default function AttendanceTable({ inscripciones, dias }) {
  const calcularPorcentaje = (insc) => {
    if (!dias.length) return 0;
    const asistidos = dias.filter((dia) =>
      insc.asistencias?.some((a) => a.dia_id === dia.id)
    ).length;
    return Math.round((asistidos / dias.length) * 100);
  };

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Niño</th>
            <th className="px-4 py-3 text-left font-semibold">Edad</th>
            <th className="px-4 py-3 text-left font-semibold">Grupo</th>
            {dias.map((dia) => (
              <th key={dia.id} className="px-4 py-3 text-center font-semibold whitespace-nowrap">
                {dia.nombre_dia}
              </th>
            ))}
            <th className="px-4 py-3 text-center font-semibold">% Asistencia</th>
          </tr>
        </thead>
        <tbody>
          {inscripciones.map((insc) => (
            <tr key={insc.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {insc.nombres_nino} {insc.apellidos_nino}
              </td>
              <td className="px-4 py-3 text-gray-600">{insc.edad}</td>
              <td className="px-4 py-3">
                <span
                  className="inline-block px-2 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: insc.grupos?.color_hex || "#6b7280" }}
                >
                  {insc.grupos?.nombre_grupo || "Sin grupo"}
                </span>
              </td>
              {dias.map((dia) => {
                const asistio = insc.asistencias?.some((a) => a.dia_id === dia.id);
                return (
                  <td key={dia.id} className="px-4 py-3 text-center">
                    {asistio ? (
                      <span className="text-green-600 font-bold">✔</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center font-semibold text-primary">
                {calcularPorcentaje(insc)}%
              </td>
            </tr>
          ))}
          {inscripciones.length === 0 && (
            <tr>
              <td colSpan={4 + dias.length} className="px-4 py-8 text-center text-gray-400">
                No hay inscripciones para mostrar
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
