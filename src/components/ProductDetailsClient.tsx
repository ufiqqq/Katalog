"use client";

import React, { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Product, ProductImage, ProductVariant } from "@prisma/client";
import { ShoppingBag, ChevronRight, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ProductWithRelations extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
}

export default function ProductDetailsClient({
  product,
}: {
  product: ProductWithRelations;
}) {
  const { data: session } = useSession();
  const { addItem } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Wishlist states
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const images = product.images.length > 0
    ? product.images
    : [{ id: "placeholder", url: "/images/placeholder.jpg", isPrimary: true, productId: product.id }];

  const activeImage = images[activeImageIndex];

  // Fetch wishlist status
  useEffect(() => {
    if (!session) return;
    const checkWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          const inWishlist = data.some((item: { productId: string }) => item.productId === product.id);
          setIsWishlisted(inWishlist);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkWishlist();
  }, [session, product.id]);

  const handleToggleWishlist = async () => {
    if (!session) {
      alert("Silakan login terlebih dahulu untuk menambahkan produk ke wishlist.");
      return;
    }
    setLoadingWishlist(true);
    try {
      if (isWishlisted) {
        const res = await fetch(`/api/wishlist?productId=${product.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsWishlisted(false);
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        if (res.ok) {
          setIsWishlisted(true);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const primaryImage = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "/images/placeholder.jpg";

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      size: selectedVariant.size,
      price: product.price,
      image: primaryImage,
      maxStock: selectedVariant.stock,
    });
  };

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-8">
        <Link href="/" className="hover:text-black transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-black">{product.name}</span>
      </nav>

      {/* Main product display */}
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Active Image */}
          <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-neutral-100 relative">
            <img
              src={activeImage.url}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setActiveImageIndex(index)}
                  className={`aspect-[3/4] overflow-hidden bg-neutral-50 border relative ${
                    index === activeImageIndex
                      ? "border-black"
                      : "border-neutral-200 hover:border-black"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Size Selector */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
            {product.category}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-black mb-4">
            {product.name}
          </h1>
          <div className="mb-6 flex items-center gap-3">
            {product.originalPrice && product.originalPrice > product.price ? (
              <>
                <span className="text-neutral-400 line-through text-sm font-semibold">
                  Rp {product.originalPrice.toLocaleString("id-ID")}
                </span>
                <span className="text-xl font-extrabold text-black uppercase tracking-wider">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
                <span className="bg-black text-white text-[10px] font-extrabold uppercase px-1.5 py-0.5 ml-2">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="text-xl font-extrabold text-black uppercase tracking-wider">
                Rp {product.price.toLocaleString("id-ID")}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-neutral-100 pt-6 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed font-light">
                {product.description}
              </p>
            </div>
          )}

          {/* Size Selector */}
          <div className="border-t border-neutral-100 pt-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Select Size
              </h3>
              {selectedVariant && (
                <span className="text-[10px] text-neutral-500 font-bold uppercase">
                  Stock: {selectedVariant.stock} available
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {product.variants.map((v) => {
                const isOutOfStock = v.stock <= 0;
                const isSelected = selectedVariant?.id === v.id;

                return (
                  <button
                    key={v.id}
                    onClick={() => !isOutOfStock && setSelectedVariant(v)}
                    disabled={isOutOfStock}
                    className={`h-12 w-12 flex items-center justify-center text-xs font-bold border transition-all ${
                      isOutOfStock
                        ? "bg-neutral-50 text-neutral-300 border-neutral-200 line-through cursor-not-allowed"
                        : isSelected
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-neutral-200 hover:border-black"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add to Cart & Wishlist Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              className="flex-grow btn-black py-4 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              {selectedVariant ? "Add to Cart" : "Choose a Size"}
            </button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={loadingWishlist}
              className="px-4 border border-neutral-200 hover:border-black transition-colors flex items-center justify-center rounded-none"
              title="Add to Wishlist"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-black text-black" : "text-black"}`} />
            </button>
          </div>

          {/* Additional details */}
          <div className="mt-8 border-t border-neutral-100 pt-6 text-[10px] text-neutral-400 font-bold uppercase tracking-wider space-y-2">
            <p>100% Genuine Quality</p>
            <p>Safe checkout with Virtual Account or QRIS</p>
            <p>Fast packaging and delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
