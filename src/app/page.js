"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { assignGroup } from "@/utils/assignGroup";
import { fetchConfiguracionGeneral } from "@/lib/configGeneral";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ninoVacio = () => ({
  nombres_nino: "",
  apellidos_nino: "",
  edad: "",
  alergias_medicas: "",
});

const erroresNinoVacio = () => ({
  nombres_nino: "",
  apellidos_nino: "",
  edad: "",
});

export default function LandingPage() {
  const router = useRouter();
  const [edicion, setEdicion] = useState(null);
  const [configGeneral, setConfigGeneral] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const [representante, setRepresentante] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ninos, setNinos] = useState([ninoVacio()]);

  // Errores por campo
  const [errores, setErrores] = useState({
    representante: "",
    telefono: "",
    ninos: [erroresNinoVacio()],
  });

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: edicionActiva, error: errEdicion } = await supabase
        .from("ediciones")
        .select("*")
        .eq("activo", true)
        .single();

      if (errEdicion || !edicionActiva) {
        setErrorGeneral(
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

      const configData = await fetchConfiguracionGeneral();
      setConfigGeneral(configData);

      setCargando(false);
    };

    cargarDatos();
  }, []);

  // ---------- Helpers de campos ----------

  const actualizarNino = (index, campo, valor) => {
    setNinos((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
    // Limpiar el error de ese campo específico al escribir
    setErrores((prev) => {
      const copiaNinos = [...prev.ninos];
      copiaNinos[index] = { ...copiaNinos[index], [campo]: "" };
      return { ...prev, ninos: copiaNinos };
    });
  };

  const agregarNino = () => {
    setNinos((prev) => [...prev, ninoVacio()]);
    setErrores((prev) => ({ ...prev, ninos: [...prev.ninos, erroresNinoVacio()] }));
  };

  const quitarNino = (index) => {
    setNinos((prev) => prev.filter((_, i) => i !== index));
    setErrores((prev) => ({
      ...prev,
      ninos: prev.ninos.filter((_, i) => i !== index),
    }));
  };

  const handleRepresentanteChange = (valor) => {
    setRepresentante(valor);
    setErrores((prev) => ({ ...prev, representante: "" }));
  };

  // El teléfono solo permite dígitos y máximo 10 caracteres
  const handleTelefonoChange = (valor) => {
    const soloNumeros = valor.replace(/\D/g, "").slice(0, 10);
    setTelefono(soloNumeros);
    setErrores((prev) => ({ ...prev, telefono: "" }));
  };

  // ---------- Validación ----------

  const validarFormulario = () => {
    const nuevosErrores = {
      representante: "",
      telefono: "",
      ninos: ninos.map(() => erroresNinoVacio()),
    };
    let esValido = true;

    if (!representante.trim()) {
      nuevosErrores.representante = "Este campo es obligatorio. Ingresa el nombre completo del representante.";
      esValido = false;
    }

    if (!telefono.trim()) {
      nuevosErrores.telefono = "Este campo es obligatorio. Ingresa un número de celular.";
      esValido = false;
    } else if (!/^\d{10}$/.test(telefono)) {
      nuevosErrores.telefono = "El número debe tener exactamente 10 dígitos, solo números (ej: 0991234567).";
      esValido = false;
    }

    ninos.forEach((nino, index) => {
      if (!nino.nombres_nino.trim()) {
        nuevosErrores.ninos[index].nombres_nino = "Este campo es obligatorio. Escribe el/los nombre(s) del niño/a.";
        esValido = false;
      }

      if (!nino.apellidos_nino.trim()) {
        nuevosErrores.ninos[index].apellidos_nino = "Este campo es obligatorio. Escribe el/los apellido(s) del niño/a.";
        esValido = false;
      }

      if (!String(nino.edad).trim()) {
        nuevosErrores.ninos[index].edad = "Este campo es obligatorio. Ingresa la edad del niño/a en años.";
        esValido = false;
      } else if (!/^\d+$/.test(String(nino.edad)) || Number(nino.edad) <= 0 || Number(nino.edad) > 17) {
        nuevosErrores.ninos[index].edad = "Ingresa una edad válida entre 1 y 17 años.";
        esValido = false;
      }
    });

    setErrores(nuevosErrores);
    return esValido;
  };

  // ---------- Envío ----------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral("");

    if (!validarFormulario()) {
      return;
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
      setErrorGeneral("Ocurrió un error al guardar la inscripción. Intenta de nuevo.");
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

  if (errorGeneral && !edicion) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-red-500 text-center">{errorGeneral}</p>
      </div>
    );
  }

  // Clases reutilizables para inputs, con estado de error
  const claseInput = (tieneError) =>
    `w-full border rounded-lg px-3 py-2 outline-none transition placeholder:text-gray-400 ${
      tieneError
        ? "border-red-500 focus:ring-2 focus:ring-red-200"
        : "border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary"
    }`;

  return (
    <div className="flex flex-col min-h-screen">
      <Header edicion={edicion} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Formulario de Inscripción
        </h2>
        <p className="text-gray-500 mb-1">
          Completa los datos de tu(s) hijo(s) para participar en {edicion.titulo}.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Los campos marcados con <span className="text-red-500 font-semibold">*</span> son obligatorios.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* ---------- Datos del representante ---------- */}
          <div className="bg-white p-4 rounded-xl border space-y-4">
            <h3 className="font-semibold text-gray-700">Datos del representante</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo del representante <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Luis Vera"
                className={claseInput(errores.representante)}
                value={representante}
                onChange={(e) => handleRepresentanteChange(e.target.value)}
              />
              {errores.representante && (
                <p className="text-red-500 text-sm mt-1">⚠ {errores.representante}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de contacto <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Ej: 0991234567"
                maxLength={10}
                className={claseInput(errores.telefono)}
                value={telefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
              />
              {errores.telefono ? (
                <p className="text-red-500 text-sm mt-1">⚠ {errores.telefono}</p>
              ) : (
                <p className="text-gray-400 text-xs mt-1">
                  Solo números, 10 dígitos (celular).
                </p>
              )}
            </div>
          </div>

          {/* ---------- Datos de cada niño ---------- */}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sofía"
                  className={claseInput(errores.ninos[index]?.nombres_nino)}
                  value={nino.nombres_nino}
                  onChange={(e) => actualizarNino(index, "nombres_nino", e.target.value)}
                />
                {errores.ninos[index]?.nombres_nino && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errores.ninos[index].nombres_nino}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Vera Ramírez"
                  className={claseInput(errores.ninos[index]?.apellidos_nino)}
                  value={nino.apellidos_nino}
                  onChange={(e) => actualizarNino(index, "apellidos_nino", e.target.value)}
                />
                {errores.ninos[index]?.apellidos_nino && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errores.ninos[index].apellidos_nino}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="17"
                  placeholder="Ej: 5"
                  className={claseInput(errores.ninos[index]?.edad)}
                  value={nino.edad}
                  onChange={(e) => actualizarNino(index, "edad", e.target.value)}
                />
                {errores.ninos[index]?.edad && (
                  <p className="text-red-500 text-sm mt-1">⚠ {errores.ninos[index].edad}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alergias o condiciones médicas <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  placeholder="Ej: Alergia a la penicilina, asma, ninguna"
                  className={claseInput(false)}
                  value={nino.alergias_medicas}
                  onChange={(e) => actualizarNino(index, "alergias_medicas", e.target.value)}
                />
              </div>

              {nino.edad && !errores.ninos[index]?.edad && (
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

          {errorGeneral && <p className="text-red-500 text-sm">{errorGeneral}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Inscribir"}
          </button>
        </form>
      </main>

      <Footer edicion={edicion} configGeneral={configGeneral} />
    </div>
  );
}
