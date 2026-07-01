// groq tag para syntax highlighting en editores
const groq = (strings: TemplateStringsArray, ...values: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");

// Todos los productos disponibles — usado por la IA para conocer el catálogo completo
export const ALL_PRODUCTS_QUERY = groq`
  *[_type == "producto" && disponible == true] | order(ventas desc, _createdAt desc) {
    _id,
    titulo,
    "slug": slug.current,
    precio,
    tieneDescuento,
    tipoDescuento,
    valorDescuento,
    textoBadge,
    fechaInicioDescuento,
    fechaFinDescuento,
    categoria,
    tieneOpcionExtra,
    nombreOpcionExtra,
    precioOpcionExtra,
    "descripcionTexto": pt::text(descripcion),
    imagenPrincipal,
    disponible,
    stock,
    ventas
  }
`;

// Producto individual por slug
export const PRODUCT_BY_SLUG_QUERY = groq`
  *[_type == "producto" && slug.current == $slug][0] {
    _id,
    titulo,
    "slug": slug.current,
    precio,
    tieneDescuento,
    tipoDescuento,
    valorDescuento,
    textoBadge,
    fechaInicioDescuento,
    fechaFinDescuento,
    categoria,
    tieneOpcionExtra,
    nombreOpcionExtra,
    precioOpcionExtra,
    "descripcionTexto": pt::text(descripcion),
    imagenPrincipal,
    disponible,
    stock,
    ventas
  }
`;

// Productos por categoría
export const PRODUCTS_BY_CATEGORY_QUERY = groq`
  *[_type == "producto" && categoria == $categoria && disponible == true] | order(ventas desc, _createdAt desc) {
    _id,
    titulo,
    "slug": slug.current,
    precio,
    tieneDescuento,
    tipoDescuento,
    valorDescuento,
    categoria,
    disponible,
    stock
  }
`;

// Productos con descuento activo
export const PRODUCTS_WITH_DISCOUNT_QUERY = groq`
  *[_type == "producto" && tieneDescuento == true && disponible == true] | order(_createdAt desc) {
    _id,
    titulo,
    "slug": slug.current,
    precio,
    tipoDescuento,
    valorDescuento,
    textoBadge,
    fechaInicioDescuento,
    fechaFinDescuento,
    categoria
  }
`;
