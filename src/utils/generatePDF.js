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

  // Tamaño tipo tarjeta (credencial), orientación retrato
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`${nombreArchivo}.pdf`);
}

/**
 * Genera un PDF de lista de asistencia por aula (tabla simple en texto).
 * @param {Array} inscripciones - Niños de un grupo específico
 * @param {string} nombreGrupo - Nombre del aula/grupo
 */
export function generateGroupListPDF(inscripciones, nombreGrupo = "Grupo") {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;

  pdf.setFontSize(18);
  pdf.text(`Lista de asistencia - ${nombreGrupo}`, marginX, y);
  y += 30;

  pdf.setFontSize(11);
  pdf.text("#", marginX, y);
  pdf.text("Nombre completo", marginX + 30, y);
  pdf.text("Edad", marginX + 300, y);
  pdf.text("Representante", marginX + 360, y);
  y += 10;
  pdf.line(marginX, y, 555, y);
  y += 20;

  inscripciones.forEach((insc, index) => {
    if (y > 780) {
      pdf.addPage();
      y = 50;
    }
    pdf.text(String(index + 1), marginX, y);
    pdf.text(`${insc.nombres_nino} ${insc.apellidos_nino}`, marginX + 30, y);
    pdf.text(String(insc.edad), marginX + 300, y);
    pdf.text(insc.nombre_representante, marginX + 360, y);
    y += 22;
  });

  pdf.save(`lista-${nombreGrupo.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
