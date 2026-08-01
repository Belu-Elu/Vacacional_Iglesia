"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

function ConfiguracionContenido() {
  const [ediciones, setEdiciones] = useState([]);
  const [edicionId, setEdicionId] = useState("");
  const [edicionActual, setEdicionActual] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [dias, setDias] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  // Formularios
  const [nuevaEdicion, setNuevaEdicion] = useState({ anio: "", titulo: "", contacto_telefono: "" });
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre_grupo: "", edad_min: "", edad_max: "", color_hex: "#6366f1" });
  const [nuevoDia, setNuevoDia] = useState({ fecha: "", nombre_dia: "" });
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const cargarTodo = async () => {
    const { data: edicionesData } = await supabase
      .from("ediciones")
      .select("*")
      .order("anio", { ascending: false });
    setEdiciones(edicionesData || []);

    if (edicionesData && edicionesData.length > 0 && !edicionId) {
      setEdicionId(edicionesData[0].id);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!edicionId) return;
    const cargarDetalle = async () => {
      const { data: ed } = await supabase.from("ediciones").select("*").eq("id", edicionId).single();
      setEdicionActual(ed);

      const { data: g } = await supabase.from("grupos").select("*").eq("edicion_id", edicionId).order("edad_min");
      setGrupos(g || []);

      const { data: d } = await supabase.from("dias_vacacional").select("*").eq("edicion_id", edicionId).order("fecha");
      setDias(d || []);
    };
    cargarDetalle();
  }, [edicionId]);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  // ---- Crear nueva edición ----
  const crearEdicion = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("ediciones")
      .insert({
        anio: Number(nuevaEdicion.anio),
        titulo: nuevaEdicion.titulo,
        contacto_telefono: nuevaEdicion.contacto_telefono,
        activo: false,
      })
      .select()
      .single();

    if (error) {
      mostrarMensaje("error", "Error al crear la edición (¿el año ya existe?).");
      return;
    }

    mostrarMensaje("ok", "Edición creada.");
    setNuevaEdicion({ anio: "", titulo: "", contacto_telefono: "" });
    await cargarTodo();
    setEdicionId(data.id);
  };

  const marcarComoActiva = async () => {
    // Desactivar todas, luego activar la seleccionada
    await supabase.from("ediciones").update({ activo: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ediciones").update({ activo: true }).eq("id", edicionId);
    mostrarMensaje("ok", "Edición marcada como activa (visible en la landing pública).");
    cargarTodo();
    setEdicionActual((prev) => ({ ...prev, activo: true }));
  };

  const subirLogo = async (file) => {
    if (!file || !edicionId) return;
    setSubiendoLogo(true);

    const ext = file.name.split(".").pop();
    const path = `logos/${edicionId}.${ext}`;

    const { error: errUpload } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (errUpload) {
      mostrarMensaje("error", "Error al subir el logo. Verifica que el bucket 'logos' exista y sea público.");
      setSubiendoLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);

    await supabase.from("ediciones").update({ logo_url: urlData.publicUrl }).eq("id", edicionId);
    setEdicionActual((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
    mostrarMensaje("ok", "Logo actualizado.");
    setSubiendoLogo(false);
  };

  // ---- Grupos ----
  const agregarGrupo = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("grupos").insert({
      edicion_id: edicionId,
      nombre_grupo: nuevoGrupo.nombre_grupo,
      edad_min: Number(nuevoGrupo.edad_min),
      edad_max: Number(nuevoGrupo.edad_max),
      color_hex: nuevoGrupo.color_hex,
    });

    if (error) {
      mostrarMensaje("error", "Error al agregar el grupo.");
      return;
    }

    setNuevoGrupo({ nombre_grupo: "", edad_min: "", edad_max: "", color_hex: "#6366f1" });
    const { data: g } = await supabase.from("grupos").select("*").eq("edicion_id", edicionId).order("edad_min");
    setGrupos(g || []);
  };

  const eliminarGrupo = async (id) => {
    await supabase.from("grupos").delete().eq("id", id);
    setGrupos((prev) => prev.filter((g) => g.id !== id));
  };

  // ---- Días ----
  const agregarDia = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("dias_vacacional").insert({
      edicion_id: edicionId,
      fecha: nuevoDia.fecha,
      nombre_dia: nuevoDia.nombre_dia,
    });

    if (error) {
      mostrarMensaje("error", "Error al agregar el día.");
      return;
    }

    setNuevoDia({ fecha: "", nombre_dia: "" });
    const { data: d } = await supabase.from("dias_vacacional").select("*").eq("edicion_id", edicionId).order("fecha");
    setDias(d || []);
  };

  const eliminarDia = async (id) => {
    await supabase.from("dias_vacacional").delete().eq("id", id);
    setDias((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Configuración del Evento</h1>
          <Link href="/admin/dashboard" className="text-primary font-semibold text-sm">
            ← Volver al dashboard
          </Link>
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

        {/* Selector + crear edición */}
        <section className="bg-white border rounded-xl p-4 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Ediciones / Años</h2>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={edicionId}
              onChange={(e) => setEdicionId(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              {ediciones.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.anio} - {ed.titulo} {ed.activo ? "(activo)" : ""}
                </option>
              ))}
            </select>

            {edicionActual && !edicionActual.activo && (
              <button
                onClick={marcarComoActiva}
                className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold"
              >
                Marcar como edición activa
              </button>
            )}
          </div>

          <form onSubmit={crearEdicion} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              required
              type="number"
              placeholder="Año (ej. 2027)"
              className="border rounded-lg px-3 py-2"
              value={nuevaEdicion.anio}
              onChange={(e) => setNuevaEdicion({ ...nuevaEdicion, anio: e.target.value })}
            />
            <input
              required
              type="text"
              placeholder="Título del evento"
              className="border rounded-lg px-3 py-2"
              value={nuevaEdicion.titulo}
              onChange={(e) => setNuevaEdicion({ ...nuevaEdicion, titulo: e.target.value })}
            />
            <input
              type="text"
              placeholder="Teléfono de contacto"
              className="border rounded-lg px-3 py-2"
              value={nuevaEdicion.contacto_telefono}
              onChange={(e) => setNuevaEdicion({ ...nuevaEdicion, contacto_telefono: e.target.value })}
            />
            <button
              type="submit"
              className="md:col-span-3 bg-primary text-white py-2 rounded-lg font-semibold"
            >
              + Crear nueva edición
            </button>
          </form>
        </section>

        {edicionActual && (
          <>
            {/* Logo */}
            <section className="bg-white border rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-700 mb-3">Logo del evento</h2>
              <div className="flex items-center gap-4">
                {edicionActual.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={edicionActual.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover border" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={subiendoLogo}
                  onChange={(e) => subirLogo(e.target.files?.[0])}
                />
              </div>
            </section>

            {/* Grupos */}
            <section className="bg-white border rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-700 mb-3">Grupos por edad</h2>

              <div className="space-y-2 mb-4">
                {grupos.map((g) => (
                  <div key={g.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: g.color_hex }} />
                      <span className="font-medium">{g.nombre_grupo}</span>
                      <span className="text-gray-400 text-sm">
                        ({g.edad_min}-{g.edad_max} años)
                      </span>
                    </div>
                    <button onClick={() => eliminarGrupo(g.id)} className="text-red-500 text-sm">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={agregarGrupo} className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <input
                  required
                  type="text"
                  placeholder="Nombre"
                  className="border rounded-lg px-3 py-2 col-span-2 md:col-span-1"
                  value={nuevoGrupo.nombre_grupo}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre_grupo: e.target.value })}
                />
                <input
                  required
                  type="number"
                  placeholder="Edad mín"
                  className="border rounded-lg px-3 py-2"
                  value={nuevoGrupo.edad_min}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, edad_min: e.target.value })}
                />
                <input
                  required
                  type="number"
                  placeholder="Edad máx"
                  className="border rounded-lg px-3 py-2"
                  value={nuevoGrupo.edad_max}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, edad_max: e.target.value })}
                />
                <input
                  type="color"
                  className="border rounded-lg h-full w-full"
                  value={nuevoGrupo.color_hex}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, color_hex: e.target.value })}
                />
                <button type="submit" className="bg-primary text-white rounded-lg font-semibold">
                  + Agregar
                </button>
              </form>
            </section>

            {/* Días */}
            <section className="bg-white border rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-700 mb-3">Días del vacacional</h2>

              <div className="space-y-2 mb-4">
                {dias.map((d) => (
                  <div key={d.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <span>
                      <strong>{d.nombre_dia}</strong> — {d.fecha}
                    </span>
                    <button onClick={() => eliminarDia(d.id)} className="text-red-500 text-sm">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={agregarDia} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  required
                  type="date"
                  className="border rounded-lg px-3 py-2"
                  value={nuevoDia.fecha}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, fecha: e.target.value })}
                />
                <input
                  required
                  type="text"
                  placeholder="Nombre del día (ej. Día 1 - Bienvenida)"
                  className="border rounded-lg px-3 py-2"
                  value={nuevoDia.nombre_dia}
                  onChange={(e) => setNuevoDia({ ...nuevoDia, nombre_dia: e.target.value })}
                />
                <button type="submit" className="bg-primary text-white rounded-lg font-semibold">
                  + Agregar día
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <ProtectedRoute rolesPermitidos={["admin"]}>
      <ConfiguracionContenido />
    </ProtectedRoute>
  );
}
