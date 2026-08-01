/**
 * Determina a qué grupo pertenece un niño según su edad,
 * comparando contra los rangos (edad_min - edad_max) de los grupos
 * configurados para la edición activa.
 *
 * @param {number} edad - Edad del niño
 * @param {Array} grupos - Lista de grupos de la edición (con edad_min, edad_max, id)
 * @returns {object|null} El grupo correspondiente o null si no hay coincidencia
 */
export function assignGroup(edad, grupos) {
  if (!edad || !Array.isArray(grupos)) return null;

  const grupoEncontrado = grupos.find(
    (g) => edad >= g.edad_min && edad <= g.edad_max
  );

  return grupoEncontrado || null;
}
