"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Envuelve una página y solo la muestra si el usuario tiene sesión
 * y su rol coincide con rolesPermitidos.
 *
 * Uso:
 * <ProtectedRoute rolesPermitidos={["admin"]}>
 *   ...contenido solo de admin...
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, rolesPermitidos = ["admin", "voluntario"] }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: perfil, error } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", session.user.id)
        .single();

      if (error || !perfil || !rolesPermitidos.includes(perfil.rol)) {
        router.replace("/login");
        return;
      }

      setAutorizado(true);
      setCargando(false);
    };

    verificar();
  }, [router, rolesPermitidos]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Verificando acceso...</p>
      </div>
    );
  }

  return autorizado ? children : null;
}
