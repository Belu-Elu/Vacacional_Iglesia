"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { assignGroup } from "@/utils/assignGroup";
import ProtectedRoute from "@/components/ProtectedRoute";

function RegistroPuertaContenido() {
  const [edicion, setEdicion] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [diaHoy, setDiaHoy] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    nombres_nino: "",
    apellidos_nino: "",
    edad: "",
    alergias_medicas: "",
    nombre_representante: "",
    telefono_representante: "",
  });

  useEffect(() => {
    const cargar = async () => {
      const { data: edicionActiva } = await supabase
        .from("ediciones")
        .select("*")
        .eq("activo", true)
        .single();
      setEdicion(edicionActiva);

      if (edicionActiva) {
        const { data: gruposData } = await supabase
          .from("grupos")
          .select("*")
          .eq("edicion_id", edicionActiva.id);
        setGrupos(gruposData || []);

        const hoy = new Date().toISOString().slice(0, 10);
        const { data: dia } = await supabase
          .from("dias_vacacional")
          .select("*")
          .eq("edicion_id", edicionActiva.id)
          .eq("fecha", hoy)
          .single();
        setDiaHoy(dia || null);
      }
    };
    cargar();
  }, []);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);

    try {
      const grupo = assignGroup(Number(form.edad), grupos);

      const { data: inscripcion, error: errInsert } = await supabase
        .from("inscripciones")
        .insert({
          edicion_id: edicion.id,
          grupo_id: grupo?.id || null,
          nombres_nino: form.nombres_nino.trim(),
          apellidos_nino: form.apellidos_nino.trim(),
          edad: Number(form.edad),
          alergias_medicas: form.alergias_medicas.trim() || null,
          nombre_representante: form.nombre_representante.trim(),
          telefono_representante: form.telefono_representante.trim(),
        })
        .select()
        .single();

      if (errInsert) throw errInsert;

      // Registrar asistencia del día automáticamente, ya que llegó en persona
      if (diaHoy) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        await supabase.from("asistencias").insert({
          inscripcion_id: inscripcion.id,
          dia_id: diaHoy.id,
          registrado_por: session?.user?.id,
        });
      }

      setMensaje({ tipo: "ok", texto: "✅ Niño registrado y asistencia marcada." });
      setForm({
        nombres_nino: "",
        apellidos_nino: "",
        edad: "",
        alergias_medicas: "",
        nombre_representante: "",
        telefono_representante: "",
      });
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al registrar. Intenta de nuevo." });
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Registro rápido en puerta</h1>
        <p className="text-gray-500 text-sm mb-4">
          Para niños que llegan sin inscripción previa.
        </p>

        {mensaje && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              mensaje.tipo === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border space-y-3">
          <input
            required
            type="text"
            placeholder="Nombres"
            className="w-full border rounded-lg px-3 py-2"
            value={form.nombres_nino}
            onChange={(e) => actualizar("nombres_nino", e.target.value)}
          />
          <input
            required
            type="text"
            placeholder="Apellidos"
            className="w-full border rounded-lg px-3 py-2"
            value={form.apellidos_nino}
            onChange={(e) => actualizar("apellidos_nino", e.target.value)}
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Edad"
            className="w-full border rounded-lg px-3 py-2"
            value={form.edad}
            onChange={(e) => actualizar("edad", e.target.value)}
          />
          <textarea
            placeholder="Alergias o condiciones médicas (opcional)"
            className="w-full border rounded-lg px-3 py-2"
            value={form.alergias_medicas}
            onChange={(e) => actualizar("alergias_medicas", e.target.value)}
          />
          <input
            required
            type="text"
            placeholder="Nombre del representante"
            className="w-full border rounded-lg px-3 py-2"
            value={form.nombre_representante}
            onChange={(e) => actualizar("nombre_representante", e.target.value)}
          />
          <input
            required
            type="tel"
            placeholder="Teléfono del representante"
            className="w-full border rounded-lg px-3 py-2"
            value={form.telefono_representante}
            onChange={(e) => actualizar("telefono_representante", e.target.value)}
          />

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-lg disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Registrar e ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegistroPuertaPage() {
  return (
    <ProtectedRoute rolesPermitidos={["admin", "voluntario"]}>
      <RegistroPuertaContenido />
    </ProtectedRoute>
  );
}
