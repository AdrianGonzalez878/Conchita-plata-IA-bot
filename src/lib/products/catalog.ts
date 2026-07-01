import { urlFor } from "@/lib/sanity/client";
import type { SanityImageRef } from "@/types";

export const STORE_BASE_URL =
  process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "") ?? "https://conchitaplata.com";

export interface ProductoCatalogo {
  _id: string;
  titulo: string;
  slug: string;
  precio: number;
  tieneDescuento?: boolean;
  tipoDescuento?: "porcentaje" | "monto";
  valorDescuento?: number;
  textoBadge?: string;
  fechaInicioDescuento?: string;
  fechaFinDescuento?: string;
  categoria: string;
  tieneOpcionExtra?: boolean;
  nombreOpcionExtra?: string;
  precioOpcionExtra?: number;
  descripcionTexto?: string;
  disponible: boolean;
  stock?: number;
  ventas?: number;
  imagenPrincipal?: SanityImageRef;
}

export function buildProductUrl(slug: string): string {
  return `${STORE_BASE_URL}/productos/${slug}`;
}

export function getProductImageUrl(imagen?: SanityImageRef): string | null {
  if (!imagen?.asset?._ref) return null;
  return urlFor(imagen).width(1200).quality(85).format("jpg").url();
}

export function formatProductosParaIA(productos: ProductoCatalogo[]): string {
  return productos
    .map((p) => {
      const lines: string[] = [];
      const categoria = p.categoria.charAt(0).toUpperCase() + p.categoria.slice(1);

      lines.push(`• ${p.titulo} [${categoria}]`);
      lines.push(`  Link: ${buildProductUrl(p.slug)}`);

      if (p.tieneDescuento && p.valorDescuento) {
        const descuento =
          p.tipoDescuento === "porcentaje"
            ? `${p.valorDescuento}% OFF`
            : `$${p.valorDescuento} MXN de descuento`;
        const badge = p.textoBadge ?? descuento;
        lines.push(`  Precio: $${p.precio} MXN — Promoción: ${badge}`);
      } else {
        lines.push(`  Precio: $${p.precio} MXN`);
      }

      const stock = p.stock ?? 1;
      if (stock === 0) {
        lines.push(`  Stock: Agotado`);
      } else if (stock <= 3) {
        lines.push(`  Stock: Últimas ${stock} pieza(s)`);
      } else {
        lines.push(`  Stock: Disponible (${stock} uds.)`);
      }

      if (p.tieneOpcionExtra && p.nombreOpcionExtra) {
        lines.push(
          `  Complemento opcional: ${p.nombreOpcionExtra} (+$${p.precioOpcionExtra ?? 0} MXN)`
        );
      }

      if (p.descripcionTexto) {
        const resumen = p.descripcionTexto.slice(0, 120).replace(/\n/g, " ");
        lines.push(`  Descripción: ${resumen}${p.descripcionTexto.length > 120 ? "..." : ""}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

const PHOTO_KEYWORDS =
  /\b(foto|fotos|imagen|imagenes|imágenes|muestra|muéstrame|muestrame|verlo|verla|verlos|cómo se ve|como se ve|quiero ver|enséñame|enseñame|mandame|mándame)\b/i;

export function customerWantsPhotos(text: string): boolean {
  return PHOTO_KEYWORDS.test(text);
}

function scoreProductMatch(product: ProductoCatalogo, haystack: string): number {
  const slugPhrase = product.slug.replace(/-/g, " ");
  if (haystack.includes(slugPhrase)) return 100;
  if (haystack.includes(product.titulo.toLowerCase())) return 95;

  const words = product.titulo
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const matches = words.filter((w) => haystack.includes(w)).length;
  if (matches >= 3) return matches * 15;
  if (matches >= 2) return matches * 10;
  return 0;
}

export function findProductsForPhotos(
  userMessage: string,
  aiResponse: string,
  historyText: string,
  productos: ProductoCatalogo[],
  max = 2
): ProductoCatalogo[] {
  const haystack = `${userMessage}\n${aiResponse}\n${historyText}`.toLowerCase();

  return productos
    .map((product) => ({ product, score: scoreProductMatch(product, haystack) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ product }) => product);
}
