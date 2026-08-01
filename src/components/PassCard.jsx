"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { downloadElementAsPDF } from "@/utils/generatePDF";

export default function PassCard({ inscripcion, edicion }) {
  const cardRef = useRef(null);

  const grupo = inscripcion.grupos;

  const handleDownload = () => {
    downloadElementAsPDF(
      cardRef.current,
      `pase-${inscripcion.nombres_nino}-${inscripcion.apellidos_nino}`
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="w-80 bg-white rounded-2xl shadow-lg border-2 overflow-hidden"
        style={{ borderColor: grupo?.color_hex || "#6366f1" }}
      >
        <div
          className="p-4 text-center text-white"
          style={{ backgroundColor: grupo?.color_hex || "#6366f1" }}
        >
          <p className="text-xs uppercase tracking-wide opacity-90">
            {edicion?.titulo || "Vacacional"}
          </p>
          <p className="text-lg font-bold">{grupo?.nombre_grupo || "Sin grupo"}</p>
        </div>

        <div className="p-5 flex flex-col items-center gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-800">
              {inscripcion.nombres_nino} {inscripcion.apellidos_nino}
            </p>
            <p className="text-gray-500">Edad: {inscripcion.edad} años</p>
          </div>

          <div className="p-3 bg-white border rounded-xl">
            <QRCodeCanvas value={inscripcion.id} size={160} level="H" />
          </div>

          <p className="text-xs text-gray-400 text-center">
            Presenta este código en la entrada cada día
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-5 rounded-lg transition"
      >
        Descargar Pase en PDF
      </button>
    </div>
  );
}
