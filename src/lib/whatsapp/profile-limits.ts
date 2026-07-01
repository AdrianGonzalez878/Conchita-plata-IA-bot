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
    "💎 Plata Ley .925 · filigrana, marquesita y piedras naturales. Piezas únicas hechas a mano ✨ conchitaplata.com 🛒",
  description:
    "💎 Conchita Plata — plata Ley .925 hecha a mano\n\nFiligrana · marquesita · piedras naturales · cada diseño es único ✨\n\n🛒 Compra en conchitaplata.com\nCatálogo · precios · promos\n\nAnillos · collares · aretes · pulseras · dijes · juegos\nEnvíos a todo México 🇲🇽 · pagos en línea\n\n¿Buscas un regalo o algo especial? Escríbenos 💬",
  address: "Oaxaca de Juárez, Oaxaca, México",
  email: "conchitaplatatienda@gmail.com",
  website: "https://conchitaplata.com",
} as const;

export function truncateField(value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  return value.slice(0, max);
}
