export const TEMAS_PAINT = [
  'Un robot con sombrero',
  'Tu animal favorito en el espacio',
  'Una casa flotante sobre nubes',
  'Un monstruo amable haciendo yoga',
  'Un paisaje con dos soles',
  'Un vehículo del futuro',
  'Un personaje hecho solo de formas geométricas',
  'Un jardín submarino',
  'Un retrato abstracto de “la alegría”',
  'Una ciudad vista desde un globo',
]

export function temaAleatorio() {
  const i = Math.floor(Math.random() * TEMAS_PAINT.length)
  return TEMAS_PAINT[i]
}
