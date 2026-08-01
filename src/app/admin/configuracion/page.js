"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

const MAX_LOGO_MB = 2;
const MAX_HEADER_MB = 4;

function ConfiguracionContenido() {
  const [tab, setTab] = useState("vacacional"); // "vacacional" | "general"

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Configuraciones</h1>
          <Link href="/admin/dashboard" className="text-primary font-semibold text-sm">
            ← Volver al dashboard
          </Link>
        </div>

        {/* Subpestañas */}
        <div className="flex bg-white border rounded-lg p-1 mb-6 w-full md:w-fit">
          <button
            onClick={() => setTab("vacacional")}
            className={`px-4 py-2 rounded-md text-sm font-semibold flex-1 md:flex-none ${
              tab === "vacacional" ? "bg-primary text-white" : "text-gray-600"
            }`}
          >
            📅 Configuración de Vacacional
          </button>
          <button
            onClick={() => setTab("general")}
            className={`px-4 py-2 rounded-md text-sm font-semibold flex-1 md:flex-none ${
              tab === "general" ? "bg-primary text-white" : "text-gray-600"
            }`}
          >
            ⛪ Configuración General
          </button>
        </div>

        {tab === "vacacional" ? <TabVacacional /> : <TabGeneral />}
      </div>
    </div>
  );
}

/* ============================================================
   PESTAÑA 1: Configuración de Vacacional (cambia cada año)
   ============================================================ */
function TabVacacional() {
  const [ediciones, setEdiciones] = useState([]);
  const [edicionId, setEdicionId] = useState("");
  const [edicionActual, setEdicionActual] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [dias, setDias] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  const [nuevaEdicion, setNuevaEdicion] = useState({ anio: "", titulo: "", contacto_telefono: "" });
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre_grupo: "", edad_min: "", edad_max: "", color_hex: "#2f7d32" });
  const [nuevoDia, setNuevoDia] = useState({ fecha: "", nombre_dia: "" });

  // Campos editables directos de la edición (dirección, versículo, teléfono)
  const [datosEdicion, setDatosEdicion] = useState({
    direccion_vacacional: "",
    versiculo: "",
    contacto_telefono: "",
  });

  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [subiendoHeader, setSubiendoHeader] = useState(false);
  const [guardandoDatos, setGuardandoDatos] = useState(false);

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
      setDatosEdicion({
        direccion_vacacional: ed?.direccion_vacacional || "",
        versiculo: ed?.versiculo || "",
        contacto_telefono: ed?.contacto_telefono || "",
      });

      const { data: g } = await supabase.from("grupos").select("*").eq("edicion_id", edicionId).order("edad_min");
      setGrupos(g || []);

      const { data: d } = await supabase.from("dias_vacacional").select("*").eq("edicion_id", edicionId).order("fecha");
      setDias(d || []);
    };
    cargarDetalle();
  }, [edicionId]);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4500);
  };

  const validarArchivo = (file, maxMb) => {
    if (!file) return "Selecciona un archivo.";
    if (!file.type.startsWith("image/")) return "El archivo debe ser una imagen (jpg, png, webp).";
    if (file.size > maxMb * 1024 * 1024) {
      return `La imagen pesa demasiado. El máximo permitido es ${maxMb}MB.`;
    }
    return null;
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
    await supabase.from("ediciones").update({ activo: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ediciones").update({ activo: true }).eq("id", edicionId);
    mostrarMensaje("ok", "Edición marcada como activa (visible en la landing pública).");
    cargarTodo();
    setEdicionActual((prev) => ({ ...prev, activo: true }));
  };

  // ---- Guardar dirección / versículo / teléfono ----
  const guardarDatosEdicion = async (e) => {
    e.preventDefault();
    setGuardandoDatos(true);

    const { error } = await supabase
      .from("ediciones")
      .update({
        direccion_vacacional: datosEdicion.direccion_vacacional.trim() || null,
        versiculo: datosEdicion.versiculo.trim() || null,
        contacto_telefono: datosEdicion.contacto_telefono.trim() || null,
      })
      .eq("id", edicionId);

    setGuardandoDatos(false);

    if (error) {
      mostrarMensaje("error", "Error al guardar los datos.");
      return;
    }

    mostrarMensaje("ok", "Datos del vacacional actualizados. Ya se ven en el header y footer.");
    setEdicionActual((prev) => ({ ...prev, ...datosEdicion }));
  };

  // ---- Logo del vacacional (header) ----
  const subirLogo = async (file) => {
    const errorArchivo = validarArchivo(file, MAX_LOGO_MB);
    if (errorArchivo) {
      mostrarMensaje("error", errorArchivo);
      return;
    }

    setSubiendoLogo(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${edicionId}.${ext}`;

    const { error: errUpload } = await supabase.storage.from("logos").upload(path, file, { upsert: true });

    if (errUpload) {
      mostrarMensaje("error", "Error al subir el logo. Verifica que el bucket 'logos' exista y sea público.");
      setSubiendoLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    await supabase.from("ediciones").update({ logo_url: urlData.publicUrl }).eq("id", edicionId);
    setEdicionActual((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
    mostrarMensaje("ok", "Logo del vacacional actualizado.");
    setSubiendoLogo(false);
  };

  // ---- Imagen de portada del header ----
  const subirImagenHeader = async (file) => {
    const errorArchivo = validarArchivo(file, MAX_HEADER_MB);
    if (errorArchivo) {
      mostrarMensaje("error", errorArchivo);
      return;
    }

    setSubiendoHeader(true);
    const ext = file.name.split(".").pop();
    const path = `headers/${edicionId}.${ext}`;

    const { error: errUpload } = await supabase.storage.from("logos").upload(path, file, { upsert: true });

    if (errUpload) {
      mostrarMensaje("error", "Error al subir la imagen de portada.");
      setSubiendoHeader(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    await supabase.from("ediciones").update({ imagen_header_url: urlData.publicUrl }).eq("id", edicionId);
    setEdicionActual((prev) => ({ ...prev, imagen_header_url: urlData.publicUrl }));
    mostrarMensaje("ok", "Imagen de portada actualizada.");
    setSubiendoHeader(false);
  };

  const quitarImagenHeader = async () => {
    await supabase.from("ediciones").update({ imagen_header_url: null }).eq("id", edicionId);
    setEdicionActual((prev) => ({ ...prev, imagen_header_url: null }));
    mostrarMensaje("ok", "Se quitó la imagen de portada. El header vuelve al fondo verde por defecto.");
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

    setNuevoGrupo({ nombre_grupo: "", edad_min: "", edad_max: "", color_hex: "#2f7d32" });
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
    <>
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
          <select value={edicionId} onChange={(e) => setEdicionId(e.target.value)} className="border rounded-lg px-3 py-2">
            {ediciones.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.anio} - {ed.titulo} {ed.activo ? "(activo)" : ""}
              </option>
            ))}
          </select>

          {edicionActual && !edicionActual.activo && (
            <button onClick={marcarComoActiva} className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold">
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
          <button type="submit" className="md:col-span-3 bg-primary text-white py-2 rounded-lg font-semibold">
            + Crear nueva edición
          </button>
        </form>
      </section>

      {edicionActual && (
        <>
          {/* Datos que se ven en el Header y Footer públicos */}
          <section className="bg-white border rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-700 mb-1">Datos de esta edición (Header y Footer)</h2>
            <p className="text-gray-400 text-xs mb-3">
              Estos datos se muestran en la página pública y cambian cada año.
            </p>

            <form onSubmit={guardarDatosEdicion} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Versículo (aparece debajo del título en el header)
                </label>
                <textarea
                  placeholder='Ej: "Todo lo puedo en Cristo que me fortalece" - Filipenses 4:13'
                  className="w-full border rounded-lg px-3 py-2"
                  value={datosEdicion.versiculo}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, versiculo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección del vacacional (footer)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Av. Siempre Viva 123, Quito"
                  className="w-full border rounded-lg px-3 py-2"
                  value={datosEdicion.direccion_vacacional}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, direccion_vacacional: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono de contacto del vacacional actual (footer)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 0991234567"
                  className="w-full border rounded-lg px-3 py-2"
                  value={datosEdicion.contacto_telefono}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, contacto_telefono: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={guardandoDatos}
                className="bg-primary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {guardandoDatos ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </section>

          {/* Logo del vacacional */}
          <section className="bg-white border rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-700 mb-1">Logo del vacacional</h2>
            <p className="text-gray-400 text-xs mb-3">
              Aparece redondo en el header. Tamaño recomendado: imagen cuadrada de al menos 300x300px.
              Formato JPG, PNG o WEBP. Máximo {MAX_LOGO_MB}MB.
            </p>
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

          {/* Imagen de portada del header */}
          <section className="bg-white border rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-700 mb-1">Foto de portada del header (opcional)</h2>
            <p className="text-gray-400 text-xs mb-3">
              Se muestra de fondo detrás del título, con un filtro verde oscuro encima para que el texto
              siempre se lea bien. Tamaño recomendado: horizontal (ancho mayor que alto), mínimo 1200x400px.
              Formato JPG, PNG o WEBP. Máximo {MAX_HEADER_MB}MB. Si no subes ninguna, se usa el fondo verde por defecto.
            </p>

            {edicionActual.imagen_header_url && (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={edicionActual.imagen_header_url}
                  alt="Portada del header"
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                disabled={subiendoHeader}
                onChange={(e) => subirImagenHeader(e.target.files?.[0])}
              />
              {edicionActual.imagen_header_url && (
                <button onClick={quitarImagenHeader} className="text-red-500 text-sm font-semibold">
                  Quitar imagen de portada
                </button>
              )}
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
    </>
  );
}

/* ============================================================
   PESTAÑA 2: Configuración General (iglesia organizadora, fija)
   ============================================================ */
function TabGeneral() {
  const [config, setConfig] = useState(null);
  const [nombreIglesia, setNombreIglesia] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const cargar = async () => {
    const { data } = await supabase.from("configuracion_general").select("*").limit(1).single();
    setConfig(data);
    setNombreIglesia(data?.nombre_iglesia || "");
  };

  useEffect(() => {
    cargar();
  }, []);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4500);
  };

  const guardarNombre = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const { error } = await supabase
      .from("configuracion_general")
      .update({ nombre_iglesia: nombreIglesia.trim() })
      .eq("id", config.id);

    setGuardando(false);

    if (error) {
      mostrarMensaje("error", "Error al guardar el nombre de la iglesia.");
      return;
    }

    mostrarMensaje("ok", "Nombre de la iglesia actualizado en el footer.");
    setConfig((prev) => ({ ...prev, nombre_iglesia: nombreIglesia.trim() }));
  };

  const subirLogoIglesia = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      mostrarMensaje("error", "El archivo debe ser una imagen (jpg, png, webp).");
      return;
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      mostrarMensaje("error", `La imagen pesa demasiado. El máximo permitido es ${MAX_LOGO_MB}MB.`);
      return;
    }

    setSubiendoLogo(true);
    const ext = file.name.split(".").pop();
    const path = `iglesia/logo-iglesia.${ext}`;

    const { error: errUpload } = await supabase.storage.from("logos").upload(path, file, { upsert: true });

    if (errUpload) {
      mostrarMensaje("error", "Error al subir el logo de la iglesia.");
      setSubiendoLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    await supabase.from("configuracion_general").update({ logo_iglesia_url: urlData.publicUrl }).eq("id", config.id);
    setConfig((prev) => ({ ...prev, logo_iglesia_url: urlData.publicUrl }));
    mostrarMensaje("ok", "Logo de la iglesia actualizado en el footer.");
    setSubiendoLogo(false);
  };

  if (!config) {
    return <p className="text-gray-400">Cargando...</p>;
  }

  return (
    <>
      {mensaje && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            mensaje.tipo === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <section className="bg-white border rounded-xl p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-1">Iglesia organizadora</h2>
        <p className="text-gray-400 text-xs mb-4">
          Estos datos NO cambian entre ediciones/años del vacacional. Se muestran siempre en el footer,
          en la sección &quot;Organiza&quot;.
        </p>

        <form onSubmit={guardarNombre} className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la iglesia</label>
            <input
              type="text"
              placeholder="Ej: Iglesia Cristiana Evangélica Esperanza Luz de Occidente"
              className="w-full border rounded-lg px-3 py-2"
              value={nombreIglesia}
              onChange={(e) => setNombreIglesia(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar nombre"}
          </button>
        </form>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Logo de la iglesia</h3>
          <p className="text-gray-400 text-xs mb-3">
            Tamaño recomendado: imagen cuadrada de al menos 300x300px. Formato JPG, PNG o WEBP.
            Máximo {MAX_LOGO_MB}MB.
          </p>
          <div className="flex items-center gap-4">
            {config.logo_iglesia_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo_iglesia_url}
                alt="Logo de la iglesia"
                className="h-16 w-16 rounded-full object-cover border"
              />
            )}
            <input
              type="file"
              accept="image/*"
              disabled={subiendoLogo}
              onChange={(e) => subirLogoIglesia(e.target.files?.[0])}
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default function ConfiguracionPage() {
  return (
    <ProtectedRoute rolesPermitidos={["admin"]}>
      <ConfiguracionContenido />
    </ProtectedRoute>
  );
}
