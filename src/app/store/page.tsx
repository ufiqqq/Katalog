import React from "react";

export default function StorePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-12">
      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">
          OOs / Locations
        </p>
        <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-black">
          Our Flagship Store
        </h1>
      </div>

      <div className="h-0.5 w-12 bg-black mx-auto" />

      <div className="text-xs uppercase tracking-widest leading-loose text-neutral-600 font-semibold space-y-8 max-w-xl mx-auto">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-400">Address</p>
          <p className="text-black">
            Jl. Kemang Raya No. 101B, Jakarta Selatan, 12730, Indonesia
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-400">Opening Hours</p>
          <p className="text-black">
            Monday - Sunday / 10:00 AM - 10:00 PM
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-400">Contact</p>
          <p className="text-black">
            store@oos-streetwear.com / +62 812-9876-5432
          </p>
        </div>
      </div>

      <div className="pt-8">
        <a
          href="/shop"
          className="inline-block bg-black text-white text-xs font-bold uppercase tracking-widest px-8 py-4 hover:bg-neutral-800 transition-colors"
        >
          Shop Online
        </a>
      </div>
    </div>
  );
}
