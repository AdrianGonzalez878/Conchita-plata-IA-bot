/** Límites oficiales de Meta para WhatsApp Business Profile */
export const PROFILE_LIMITS = {
  about: 139,
  description: 512,
  address: 256,
  email: 128,
  website: 256,
} as const;

export const SUGGESTED_PROFILE_TEXT = {
  about:
    "Plata Ley .925 en filigrana, marquetería y piedras naturales. Diseños únicos. Compra en conchitaplata.com",
  description:
    "Conchita Plata: joyería artesanal en plata Ley .925. Filigrana, marquetería, piedras naturales y diseños únicos hechos a mano. Compra en conchitaplata.com: catálogo, precios y promos. Anillos, collares, aretes, pulseras, dijes y juegos. Envíos a todo México. Pagos en línea. Escríbenos si tienes dudas.",
  address: "Oaxaca de Juárez, Oaxaca, México",
  email: "contacto@conchitaplata.com",
  website: "https://conchitaplata.com",
} as const;

export function truncateField(value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  return value.slice(0, max);
}
