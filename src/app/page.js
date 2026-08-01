"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { assignGroup } from "@/utils/assignGroup";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ninoVacio = () => ({
  nombres_nino: "",
  apellidos_nino: "",
  edad: "",
  alergias_medicas: "",
});

export default function LandingPage() {
  const router = useRouter();
  const [edicion, setEdicion] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const [representante, setRepresentante] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ninos, setNinos] = useState([ninoVacio()]);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: edicionActiva, error: errEdicion } = await supabase
        .from("ediciones")
        .select("*")
        .eq("activo", true)
        .single();

      if (errEdicion || !edicionActiva) {
        setError(
          "No hay ninguna edición activa configurada todavía. Contacta al administrador."
        );
        setCargando(false);
        return;
      }

      setEdicion(edicionActiva);

      const { data: gruposData } = await supabase
        .from("grupos")
        .select("*")
        .eq("edicion_id", edicionActiva.id)
        .order("edad_min", { ascending: true });

      setGrupos(gruposData || []);
      setCargando(false);
    };

    cargarDatos();
  }, []);

  const actualizarNino = (index, campo, valor) => {
    setNinos((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const agregarNino = () => setNinos((prev) => [...prev, ninoVacio()]);

  const quitarNino = (index) =>
    setNinos((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!representante.trim() || !telefono.trim()) {
      setError("Por favor completa los datos del representante.");
      return;
    }

    for (const nino of ninos) {
      if (!nino.nombres_nino.trim() || !nino.apellidos_nino.trim() || !nino.edad) {
        setError("Completa nombres, apellidos y edad de cada niño.");
        return;
      }
    }

    setEnviando(true);

    try {
      const registros = ninos.map((nino) => {
        const grupo = assignGroup(Number(nino.edad), grupos);
        return {
          edicion_id: edicion.id,
          grupo_id: grupo?.id || null,
          nombres_nino: nino.nombres_nino.trim(),
          apellidos_nino: nino.apellidos_nino.trim(),
          edad: Number(nino.edad),
          alergias_medicas: nino.alergias_medicas.trim() || null,
          nombre_representante: representante.trim(),
          telefono_representante: telefono.trim(),
        };
      });

      const { data, error: errInsert } = await supabase
        .from("inscripciones")
        .insert(registros)
        .select("id");

      if (errInsert) throw errInsert;

      const ids = data.map((r) => r.id).join(",");
      router.push(`/pase-confirmacion?ids=${ids}`);
    } catch (err) {
      setError("Ocurrió un error al guardar la inscripción. Intenta de nuevo.");
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (error && !edicion) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header edicion={edicion} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Formulario de Inscripción
        </h2>
        <p className="text-gray-500 mb-6">
          Completa los datos de tu(s) hijo(s) para participar en {edicion.titulo}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-4 rounded-xl border space-y-4">
            <h3 className="font-semibold text-gray-700">Datos del representante</h3>
            <input
              type="text"
              placeholder="Nombre completo del representante"
              className="w-full border rounded-lg px-3 py-2"
              value={representante}
              onChange={(e) => setRepresentante(e.target.value)}
            />
            <input
              type="tel"
              placeholder="Teléfono de contacto"
              className="w-full border rounded-lg px-3 py-2"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          {ninos.map((nino, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border space-y-4 relative">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">
                  Niño/a #{index + 1}
                </h3>
                {ninos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarNino(index)}
                    className="text-red-500 text-sm"
                  >
                    Quitar
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Nombres"
                className="w-full border rounded-lg px-3 py-2"
                value={nino.nombres_nino}
                onChange={(e) => actualizarNino(index, "nombres_nino", e.target.value)}
              />
              <input
                type="text"
                placeholder="Apellidos"
                className="w-full border rounded-lg px-3 py-2"
                value={nino.apellidos_nino}
                onChange={(e) => actualizarNino(index, "apellidos_nino", e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Edad"
                className="w-full border rounded-lg px-3 py-2"
                value={nino.edad}
                onChange={(e) => actualizarNino(index, "edad", e.target.value)}
              />
              <textarea
                placeholder="Alergias o condiciones médicas (opcional)"
                className="w-full border rounded-lg px-3 py-2"
                value={nino.alergias_medicas}
                onChange={(e) => actualizarNino(index, "alergias_medicas", e.target.value)}
              />

              {nino.edad && (
                <p className="text-sm text-gray-500">
                  Grupo asignado:{" "}
                  <span className="font-semibold">
                    {assignGroup(Number(nino.edad), grupos)?.nombre_grupo ||
                      "Sin grupo configurado para esta edad"}
                  </span>
                </p>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={agregarNino}
            className="w-full border-2 border-dashed border-primary text-primary font-semibold py-2 rounded-lg"
          >
            + Agregar otro hijo/a
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Inscribir"}
          </button>
        </form>
      </main>

      <Footer edicion={edicion} />
    </div>
  );
}
