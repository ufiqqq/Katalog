import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-[90vh]">
      {/* Hero / Splash Section */}
      <section className="relative h-[80vh] w-full bg-black overflow-hidden flex items-center justify-center">
        {/* Banner Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85 hover:scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url('/images/soul_eater.jpg')` }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-4">
            OOs / Collection 2026
          </p>
          <h1 className="text-4xl md:text-8xl font-extrabold tracking-tight uppercase mb-8">
            Streetwear MVP
          </h1>
          <Link
            href="/shop"
            className="inline-block bg-white text-black text-xs font-bold uppercase tracking-widest px-10 py-5 hover:bg-neutral-200 transition-colors"
          >
            Enter Shop
          </Link>
        </div>
      </section>

      {/* Payment & Shipment Footer Info */}
      <section className="bg-white border-t border-neutral-100 py-12 px-4 text-center space-y-8">
        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Payment Methods
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[11px] font-extrabold uppercase tracking-widest text-black">
            <span>QRIS</span>
            <span>OVO</span>
            <span>GOPAY</span>
            <span>DANA</span>
            <span>BCA</span>
            <span>Mandiri</span>
            <span>BNI</span>
            <span>BRI</span>
            <span>VISA</span>
            <span>Mastercard</span>
            <span>JCB</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Shipment Methods
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[11px] font-extrabold uppercase tracking-widest text-black">
            <span>JNE Express</span>
            <span>J&T Express</span>
            <span>Sicepat Halu</span>
          </div>
        </div>
      </section>
    </div>
  );
}
