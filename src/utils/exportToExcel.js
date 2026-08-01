import * as XLSX from "xlsx";

/**
 * Exporta la matriz de asistencia (niños x días) a un archivo .xlsx
 * @param {Array} inscripciones - Lista de inscripciones con grupo y asistencias anidadas
 * @param {Array} dias - Lista de días de la edición (ordenados)
 * @param {string} nombreArchivo - Nombre del archivo a descargar
 */
export function exportAttendanceToExcel(inscripciones, dias, nombreArchivo = "asistencia") {
  const filas = inscripciones.map((insc) => {
    const fila = {
      Nombres: insc.nombres_nino,
      Apellidos: insc.apellidos_nino,
      Edad: insc.edad,
      Grupo: insc.grupos?.nombre_grupo || "Sin grupo",
      Representante: insc.nombre_representante,
      Telefono: insc.telefono_representante,
      Alergias: insc.alergias_medicas || "",
    };

    let diasAsistidos = 0;
    dias.forEach((dia) => {
      const asistio = insc.asistencias?.some((a) => a.dia_id === dia.id);
      fila[dia.nombre_dia] = asistio ? "✔" : "";
      if (asistio) diasAsistidos++;
    });

    fila["% Asistencia"] = dias.length
      ? `${Math.round((diasAsistidos / dias.length) * 100)}%`
      : "0%";

    return fila;
  });

  const worksheet = XLSX.utils.json_to_sheet(filas);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia");

  XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
}
