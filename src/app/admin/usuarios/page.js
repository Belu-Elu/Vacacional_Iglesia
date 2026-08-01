"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

function UsuariosContenido() {
  const [perfiles, setPerfiles] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .order("created_at", { ascending: false });
    setPerfiles(data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === "admin" ? "voluntario" : "admin";
    const { error } = await supabase.from("perfiles").update({ rol: nuevoRol }).eq("id", id);

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al actualizar el rol." });
      return;
    }

    setMensaje({ tipo: "ok", texto: "Rol actualizado." });
    cargar();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <Link href="/admin/dashboard" className="text-primary font-semibold text-sm">
            ← Volver al dashboard
          </Link>
        </div>

        <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-4">
          Para crear un nuevo voluntario, ve a tu proyecto de Supabase →
          Authentication → Users → Add user. Aparecerá aquí automáticamente
          con el rol &quot;voluntario&quot; por defecto.
        </div>

        {mensaje && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              mensaje.tipo === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{p.nombre_completo || p.id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-white ${
                          p.rol === "admin" ? "bg-purple-600" : "bg-blue-500"
                        }`}
                      >
                        {p.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => cambiarRol(p.id, p.rol)}
                        className="text-primary font-semibold"
                      >
                        Cambiar a {p.rol === "admin" ? "voluntario" : "admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <ProtectedRoute rolesPermitidos={["admin"]}>
      <UsuariosContenido />
    </ProtectedRoute>
  );
}
