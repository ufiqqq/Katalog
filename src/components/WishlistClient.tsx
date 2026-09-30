"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

interface WishlistClientProps {
  initialItems: WishlistItem[];
}

export default function WishlistClient({ initialItems }: WishlistClientProps) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: string]: string }>({});
  const { addItem } = useCartStore();

  const handleRemove = async (productId: string) => {
    setLoadingId(productId);
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
      } else {
        alert("Gagal menghapus produk dari wishlist.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddToCart = (product: Product) => {
    const chosenSize = selectedSizes[product.id];
    if (!chosenSize) {
      alert("Silakan pilih ukuran (size) terlebih dahulu.");
      return;
    }

    const variant = product.variants.find((v) => v.size === chosenSize);
    if (!variant || variant.stock <= 0) {
      alert("Stok ukuran ini tidak tersedia.");
      return;
    }

    const primaryImage = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "/images/placeholder.jpg";

    addItem({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      size: chosenSize,
      price: product.price,
      image: primaryImage,
      maxStock: variant.stock,
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-neutral-200">
        <p className="text-neutral-500 text-xs uppercase tracking-widest mb-4">
          Daftar keinginan Anda kosong.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-black text-white text-xs font-bold uppercase tracking-widest px-8 py-3 hover:bg-neutral-800 transition-colors"
        >
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const product = item.product;
        const primaryImage = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "/images/placeholder.jpg";
        const hasDiscount = !!(product.originalPrice && product.originalPrice > product.price);
        const inStockVariants = product.variants.filter((v) => v.stock > 0);
        const currentSize = selectedSizes[product.id] || "";

        return (
          <div key={item.id} className="border border-neutral-200 p-4 flex flex-col justify-between bg-white relative">
            <div>
              {/* Product Image */}
              <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-neutral-100 border border-neutral-100">
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-300"
                />
                {hasDiscount && product.originalPrice && (
                  <div className="absolute top-2 right-2 bg-black text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </div>
                )}
              </Link>

              {/* Product Info */}
              <div className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black hover:text-neutral-600 transition-colors">
                  <Link href={`/products/${product.slug}`}>{product.name}</Link>
                </h3>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">
                  {product.category}
                </p>

                {/* Price */}
                <div className="mt-2 text-xs font-extrabold uppercase">
                  {hasDiscount && product.originalPrice ? (
                    <div className="flex gap-2">
                      <span className="text-neutral-400 line-through">
                        Rp {product.originalPrice.toLocaleString("id-ID")}
                      </span>
                      <span className="text-black">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-black">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Size Selector & Action Buttons */}
            <div className="mt-6 space-y-4">
              {inStockVariants.length > 0 ? (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    PILIH UKURAN:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.map((v) => {
                      const isOutOfStock = v.stock <= 0;
                      return (
                        <button
                          key={v.id}
                          disabled={isOutOfStock}
                          onClick={() =>
                            setSelectedSizes((prev) => ({
                              ...prev,
                              [product.id]: v.size,
                            }))
                          }
                          className={`px-2.5 py-1 text-[10px] font-bold border transition-colors ${
                            isOutOfStock
                              ? "bg-neutral-50 border-neutral-100 text-neutral-300 cursor-not-allowed"
                              : currentSize === v.size
                              ? "bg-black border-black text-white"
                              : "bg-white border-neutral-200 text-black hover:border-black"
                          }`}
                        >
                          {v.size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider text-center py-2">
                  STOK HABIS
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-neutral-100 pt-3">
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={inStockVariants.length === 0}
                  className="flex-1 btn-black py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Ke Keranjang
                </button>
                <button
                  onClick={() => handleRemove(product.id)}
                  disabled={loadingId === product.id}
                  className="px-3 border border-red-200 hover:bg-red-50 text-red-600 hover:border-red-500 transition-colors flex items-center justify-center"
                  title="Hapus dari Wishlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
