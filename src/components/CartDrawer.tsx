"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export default function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, toggleDrawer, updateQuantity, removeItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = mounted
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  const handleCheckout = () => {
    toggleDrawer(false);
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => toggleDrawer(false)}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white shadow-2xl transition-all duration-300">
          <div className="flex h-full flex-col justify-between px-6 py-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h2 className="text-sm font-extrabold tracking-widest uppercase">
                Shopping Cart ({mounted ? items.length : 0})
              </h2>
              <button
                onClick={() => toggleDrawer(false)}
                className="p-2 text-black hover:bg-neutral-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-6">
              {mounted && items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-neutral-500 text-sm uppercase tracking-wider mb-4">
                    Your cart is empty
                  </p>
                  <button
                    onClick={() => toggleDrawer(false)}
                    className="btn-black font-bold uppercase tracking-widest text-xs py-3 px-6"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {mounted &&
                    items.map((item) => (
                      <div key={item.variantId} className="flex border-b border-neutral-100 pb-6">
                        {/* Image */}
                        <div className="h-24 w-18 flex-shrink-0 overflow-hidden border border-neutral-100 bg-neutral-50 relative aspect-[3/4]">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>

                        {/* Details */}
                        <div className="ml-4 flex flex-1 flex-col">
                          <div>
                            <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                              <h3 className="line-clamp-1 pr-4">
                                <Link href={`/products/${item.slug}`} onClick={() => toggleDrawer(false)}>
                                  {item.name}
                                </Link>
                              </h3>
                              <p className="ml-4">
                                Rp {item.price.toLocaleString("id-ID")}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 uppercase tracking-widest">
                              Size: {item.size}
                            </p>
                          </div>

                          <div className="flex flex-1 items-end justify-between text-sm">
                            {/* Quantity selector */}
                            <div className="flex items-center border border-neutral-300">
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                className="p-1.5 hover:bg-neutral-100 transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-3 text-xs font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                className="p-1.5 hover:bg-neutral-100 transition-colors"
                                disabled={item.quantity >= item.maxStock}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="flex items-center text-neutral-400 hover:text-black transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {mounted && items.length > 0 && (
              <div className="border-t border-neutral-100 pt-6">
                <div className="flex justify-between text-base font-bold uppercase tracking-wider mb-2">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500 mb-6">
                  Shipping and taxes calculated at checkout.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCheckout}
                    className="w-full btn-black py-4 text-sm font-extrabold uppercase tracking-widest"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
