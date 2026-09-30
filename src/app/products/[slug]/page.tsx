import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductDetailsClient from "@/components/ProductDetailsClient";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: true,
      variants: true,
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  // Sort variants by size S, M, L, XL
  const sizeOrder = ["S", "M", "L", "XL"];
  product.variants.sort((a, b) => {
    return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
      <ProductDetailsClient product={product} />
    </div>
  );
}
