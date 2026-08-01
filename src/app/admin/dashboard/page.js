"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import AttendanceTable from "@/components/AttendanceTable";
import { exportAttendanceToExcel } from "@/utils/exportToExcel";
import { generateGroupListPDF } from "@/utils/generatePDF";

function DashboardContenido() {
  const [ediciones, setEdiciones] = useState([]);
  const [edicionId, setEdicionId] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [grupoFiltro, setGrupoFiltro] = useState("todos");
  const [dias, setDias] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEdiciones = async () => {
      const { data } = await supabase
        .from("ediciones")
        .select("*")
        .order("anio", { ascending: false });

      setEdiciones(data || []);

      const activa = data?.find((e) => e.activo) || data?.[0];
      if (activa) setEdicionId(activa.id);
      setCargando(false);
    };
    cargarEdiciones();
  }, []);

  useEffect(() => {
    if (!edicionId) return;

    const cargarDatosEdicion = async () => {
      setCargando(true);

      const [{ data: gruposData }, { data: diasData }, { data: inscripcionesData }] =
        await Promise.all([
          supabase.from("grupos").select("*").eq("edicion_id", edicionId).order("edad_min"),
          supabase
            .from("dias_vacacional")
            .select("*")
            .eq("edicion_id", edicionId)
            .order("fecha"),
          supabase
            .from("inscripciones")
            .select("*, grupos(*), asistencias(*)")
            .eq("edicion_id", edicionId),
        ]);

      setGrupos(gruposData || []);
      setDias(diasData || []);
      setInscripciones(inscripcionesData || []);
      setGrupoFiltro("todos");
      setCargando(false);
    };

    cargarDatosEdicion();
  }, [edicionId]);

  const inscripcionesFiltradas =
    grupoFiltro === "todos"
      ? inscripciones
      : inscripciones.filter((i) => i.grupo_id === grupoFiltro);

  const handleExportExcel = () => {
    exportAttendanceToExcel(inscripcionesFiltradas, dias, "matriz-asistencia");
  };

  const handleExportPDF = () => {
    const nombreGrupo =
      grupoFiltro === "todos"
        ? "Todos los grupos"
        : grupos.find((g) => g.id === grupoFiltro)?.nombre_grupo || "Grupo";
    generateGroupListPDF(inscripcionesFiltradas, nombreGrupo);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl font-bold text-gray-800">Dashboard Administrador</h1>
          <nav className="flex gap-3 text-sm">
            <Link href="/admin/configuracion" className="text-primary font-semibold">
              ⚙️ Configuración
            </Link>
            <Link href="/admin/usuarios" className="text-primary font-semibold">
              👥 Usuarios
            </Link>
            <Link href="/voluntario/asistencia" className="text-primary font-semibold">
              📷 Escáner
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={edicionId}
            onChange={(e) => setEdicionId(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            {ediciones.map((ed) => (
              <option key={ed.id} value={ed.id}>
                Año: {ed.anio} {ed.activo ? "(activo)" : ""}
              </option>
            ))}
          </select>

          <select
            value={grupoFiltro}
            onChange={(e) => setGrupoFiltro(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre_grupo}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            📊 Exportar Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            📄 Exportar PDF
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total inscritos" value={inscripciones.length} />
          <StatCard label="Grupos" value={grupos.length} />
          <StatCard label="Días configurados" value={dias.length} />
          <StatCard
            label="En este filtro"
            value={inscripcionesFiltradas.length}
          />
        </div>

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : (
          <AttendanceTable inscripciones={inscripcionesFiltradas} dias={dias} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute rolesPermitidos={["admin"]}>
      <DashboardContenido />
    </ProtectedRoute>
  );
}
