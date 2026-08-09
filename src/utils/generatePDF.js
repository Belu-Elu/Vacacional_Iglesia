import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Convierte un elemento HTML (por ejemplo, la tarjeta de un pase) en un PDF descargable.
 * @param {HTMLElement} elementRef - El nodo DOM a capturar
 * @param {string} nombreArchivo - Nombre del archivo PDF
 */
export async function downloadElementAsPDF(elementRef, nombreArchivo = "pase") {
  if (!elementRef) return;

  const canvas = await html2canvas(elementRef, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`${nombreArchivo}.pdf`);
}

/**
 * Genera un PDF de lista de asistencia por aula, incluyendo alergias/condiciones
 * médicas de cada niño (información crítica para los profesores/voluntarios).
 *
 * @param {Array} inscripciones - Niños de un grupo específico
 * @param {string} nombreGrupo - Nombre del aula/grupo
 * @param {object} opciones - { incluirRepresentante: boolean, incluirAlergias: boolean }
 */
export function generateGroupListPDF(inscripciones, nombreGrupo = "Grupo", opciones = {}) {
  const { incluirRepresentante = true, incluirAlergias = true } = opciones;

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const marginX = 40;
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 50;

  pdf.setFontSize(18);
  pdf.text(`Lista de asistencia - ${nombreGrupo}`, marginX, y);
  y += 16;
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(`Generado: ${new Date().toLocaleDateString("es-EC")} - Total: ${inscripciones.length} niño(s)`, marginX, y);
  pdf.setTextColor(0);
  y += 25;

  // Definición dinámica de columnas según las opciones recibidas
  const columnas = [
    { key: "num", label: "#", x: marginX, width: 20 },
    { key: "nombre", label: "Nombre completo", x: marginX + 25, width: 160 },
    { key: "edad", label: "Edad", x: marginX + 195, width: 40 },
  ];
  let siguienteX = marginX + 245;

  if (incluirAlergias) {
    columnas.push({ key: "alergias", label: "Alergias / condiciones médicas", x: siguienteX, width: 280 });
    siguienteX += 290;
  }
  if (incluirRepresentante) {
    columnas.push({ key: "representante", label: "Representante", x: siguienteX, width: 150 });
    siguienteX += 160;
  }

  pdf.setFontSize(11);
  pdf.setFont(undefined, "bold");
  columnas.forEach((col) => pdf.text(col.label, col.x, y));
  pdf.setFont(undefined, "normal");
  y += 8;
  pdf.line(marginX, y, siguienteX - 15, y);
  y += 18;

  inscripciones.forEach((insc, index) => {
    const alergiasTexto = insc.alergias_medicas?.trim() || "Ninguna registrada";
    const colAlergias = columnas.find((c) => c.key === "alergias");
    const alergiasLineas = incluirAlergias ? pdf.splitTextToSize(alergiasTexto, colAlergias.width) : [];
    const filaAltura = Math.max(20, alergiasLineas.length * 12 + 8);

    // Salto de página si no cabe la fila completa
    if (y + filaAltura > pageHeight - 40) {
      pdf.addPage();
      y = 50;
    }

    columnas.forEach((col) => {
      if (col.key === "num") pdf.text(String(index + 1), col.x, y);
      if (col.key === "nombre") pdf.text(`${insc.nombres_nino} ${insc.apellidos_nino}`, col.x, y);
      if (col.key === "edad") pdf.text(String(insc.edad), col.x, y);
      if (col.key === "representante") pdf.text(insc.nombre_representante || "", col.x, y);
      if (col.key === "alergias") pdf.text(alergiasLineas, col.x, y);
    });

    y += filaAltura;
  });

  pdf.save(`lista-${nombreGrupo.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
