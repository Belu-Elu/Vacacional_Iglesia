"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchConfiguracionGeneral } from "@/lib/configGeneral";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PassCard from "@/components/PassCard";

function ConfirmacionContenido() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",") || [];

  const [edicion, setEdicion] = useState(null);
  const [configGeneral, setConfigGeneral] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      if (ids.length === 0) {
        setCargando(false);
        return;
      }

      const { data: inscripcionesData } = await supabase
        .from("inscripciones")
        .select("*, grupos(*)")
        .in("id", ids);

      setInscripciones(inscripcionesData || []);

      if (inscripcionesData && inscripcionesData.length > 0) {
        const { data: edicionData } = await supabase
          .from("ediciones")
          .select("*")
          .eq("id", inscripcionesData[0].edicion_id)
          .single();
        setEdicion(edicionData);
      }

      const configData = await fetchConfiguracionGeneral();
      setConfigGeneral(configData);

      setCargando(false);
    };

    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando pases...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header edicion={edicion} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          ¡Inscripción exitosa! 🎉
        </h2>
        <p className="text-gray-500 text-center mb-8">
          Guarda o descarga el(los) pase(s) de tu(s) hijo(s). Deberás
          presentarlo cada día en la entrada.
        </p>

        <div className="flex flex-wrap justify-center gap-8">
          {inscripciones.map((insc) => (
            <PassCard key={insc.id} inscripcion={insc} edicion={edicion} />
          ))}
        </div>

        {inscripciones.length === 0 && (
          <p className="text-center text-gray-400">
            No se encontraron pases para mostrar.
          </p>
        )}
      </main>

      <Footer edicion={edicion} configGeneral={configGeneral} />
    </div>
  );
}

export default function PaseConfirmacionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ConfirmacionContenido />
    </Suspense>
  );
}
