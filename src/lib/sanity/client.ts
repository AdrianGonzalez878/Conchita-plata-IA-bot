import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export function getSanityClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2024-01-01",
    useCdn: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: any) {
  return imageUrlBuilder(getSanityClient()).image(source);
}
