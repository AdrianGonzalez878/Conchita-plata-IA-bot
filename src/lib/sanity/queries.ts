// groq tag is used for syntax highlighting in editors
const groq = (strings: TemplateStringsArray, ...values: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");

export const ALL_PRODUCTS_QUERY = groq`
  *[_type == "product" && isAvailable == true] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    category,
    material,
    stock,
    images,
    isAvailable
  }
`;

export const PRODUCT_BY_SLUG_QUERY = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    category,
    material,
    stock,
    images,
    isAvailable
  }
`;

export const PRODUCTS_BY_CATEGORY_QUERY = groq`
  *[_type == "product" && category == $category && isAvailable == true] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    category,
    material,
    stock,
    isAvailable
  }
`;
