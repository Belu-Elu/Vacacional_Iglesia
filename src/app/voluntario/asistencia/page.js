"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import QRScanner from "@/components/QRScanner";
import { generateGroupListPDF } from "@/utils/generatePDF";

function AsistenciaContenido() {
  const [edicion, setEdicion] = useState(null);
  const [diaHoy, setDiaHoy] = useState(null);
  const [modo, setModo] = useState("escaner"); // "escaner" | "buscador"
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok'|'error', texto }
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [procesandoQR, setProcesandoQR] = useState(false);

  const [grupos, setGrupos] = useState([]);
  const [grupoFiltro, setGrupoFiltro] = useState("todos");
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const { data: edicionActiva } = await supabase
        .from("ediciones")
        .select("*")
        .eq("activo", true)
        .single();

      setEdicion(edicionActiva);

      if (edicionActiva) {
        const hoy = new Date().toISOString().slice(0, 10);
        const { data: dia } = await supabase
          .from("dias_vacacional")
          .select("*")
          .eq("edicion_id", edicionActiva.id)
          .eq("fecha", hoy)
          .single();

        setDiaHoy(dia || null);

        const { data: gruposData } = await supabase
          .from("grupos")
          .select("*")
          .eq("edicion_id", edicionActiva.id)
          .order("edad_min");

        setGrupos(gruposData || []);
      }
    };
    cargar();
  }, []);

  const registrarAsistencia = useCallback(
    async (inscripcionId) => {
      if (!diaHoy) {
        setMensaje({ tipo: "error", texto: "No hay un día del vacacional configurado para hoy." });
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error } = await supabase.from("asistencias").insert({
        inscripcion_id: inscripcionId,
        dia_id: diaHoy.id,
        registrado_por: session?.user?.id,
      });

      if (error) {
        if (error.code === "23505") {
          setMensaje({ tipo: "error", texto: "Este niño ya tiene asistencia registrada hoy." });
        } else {
          setMensaje({ tipo: "error", texto: "Error al registrar asistencia." });
        }
        return;
      }

      setMensaje({ tipo: "ok", texto: "✅ Asistencia registrada correctamente." });
    },
    [diaHoy]
  );

  const handleScanSuccess = async (decodedText) => {
    if (procesandoQR) return;
    setProcesandoQR(true);
    await registrarAsistencia(decodedText.trim());
    setTimeout(() => setProcesandoQR(false), 2000);
  };

  const buscar = async (texto) => {
    setBusqueda(texto);
    if (!edicion || texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);

    let query = supabase
      .from("inscripciones")
      .select("*, grupos(*), asistencias(*)")
      .eq("edicion_id", edicion.id)
      .or(`nombres_nino.ilike.%${texto}%,apellidos_nino.ilike.%${texto}%`)
      .limit(20);

    if (grupoFiltro !== "todos") {
      query = query.eq("grupo_id", grupoFiltro);
    }

    const { data } = await query;
    setResultados(data || []);
    setBuscando(false);
  };

  // Descarga la lista en PDF del grupo seleccionado (o de todos), con alergias
  // incluidas. No incluye datos del representante: eso lo maneja el admin.
  const descargarListaGrupo = async () => {
    if (!edicion) return;
    setDescargando(true);

    let query = supabase
      .from("inscripciones")
      .select("*, grupos(*)")
      .eq("edicion_id", edicion.id);

    if (grupoFiltro !== "todos") {
      query = query.eq("grupo_id", grupoFiltro);
    }

    const { data, error } = await query;

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al generar la lista." });
      setDescargando(false);
      return;
    }

    const nombreGrupo =
      grupoFiltro === "todos"
        ? "Todos los grupos"
        : grupos.find((g) => g.id === grupoFiltro)?.nombre_grupo || "Grupo";

    generateGroupListPDF(data || [], nombreGrupo, {
      incluirRepresentante: false,
      incluirAlergias: true,
    });

    setDescargando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Control de Asistencia</h1>
        <p className="text-gray-500 text-sm mb-4">
          {diaHoy ? `Día: ${diaHoy.nombre_dia}` : "No hay día configurado para hoy"}
        </p>

        {/* Filtro de grupo + descarga de lista (con alergias) */}
        <div className="bg-white border rounded-lg p-3 mb-4 space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Mi grupo / aula
          </label>
          <select
            value={grupoFiltro}
            onChange={(e) => {
              setGrupoFiltro(e.target.value);
              if (busqueda.trim().length >= 2) buscar(busqueda);
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre_grupo}
              </option>
            ))}
          </select>
          <button
            onClick={descargarListaGrupo}
            disabled={descargando}
            className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {descargando ? "Generando..." : "📄 Descargar lista de mi grupo (con alergias)"}
          </button>
        </div>

        <div className="flex bg-white rounded-lg border p-1 mb-4">
          <button
            onClick={() => setModo("escaner")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold ${
              modo === "escaner" ? "bg-primary text-white" : "text-gray-600"
            }`}
          >
            📷 Escáner
          </button>
          <button
            onClick={() => setModo("buscador")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold ${
              modo === "buscador" ? "bg-primary text-white" : "text-gray-600"
            }`}
          >
            🔍 Buscador
          </button>
        </div>

        {mensaje && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              mensaje.tipo === "ok"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {modo === "escaner" && diaHoy && (
          <QRScanner onScanSuccess={handleScanSuccess} />
        )}

        {modo === "buscador" && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o apellido..."
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={busqueda}
              onChange={(e) => buscar(e.target.value)}
            />

            {buscando && <p className="text-gray-400 text-sm">Buscando...</p>}

            <div className="space-y-2">
              {resultados.map((insc) => {
                const yaAsistio = insc.asistencias?.some((a) => a.dia_id === diaHoy?.id);
                return (
                  <div
                    key={insc.id}
                    className="bg-white border rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {insc.nombres_nino} {insc.apellidos_nino}
                      </p>
                      <span
                        className="inline-block text-xs text-white px-2 py-0.5 rounded-full mt-1"
                        style={{ backgroundColor: insc.grupos?.color_hex || "#6b7280" }}
                      >
                        {insc.grupos?.nombre_grupo || "Sin grupo"}
                      </span>
                    </div>
                    <button
                      disabled={yaAsistio}
                      onClick={() => registrarAsistencia(insc.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${
                        yaAsistio
                          ? "bg-gray-200 text-gray-400"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`}
                    >
                      {yaAsistio ? "Registrado" : "Marcar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AsistenciaPage() {
  return (
    <ProtectedRoute rolesPermitidos={["admin", "voluntario"]}>
      <AsistenciaContenido />
    </ProtectedRoute>
  );
}
