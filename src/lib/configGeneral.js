import { supabase } from "@/lib/supabase";

/**
 * Trae la fila única de configuración general (datos de la iglesia
 * organizadora: nombre y logo). Estos datos NO cambian entre ediciones.
 */
export async function fetchConfiguracionGeneral() {
  const { data, error } = await supabase
    .from("configuracion_general")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.warn("No se pudo cargar la configuración general:", error.message);
    return null;
  }

  return data;
}
