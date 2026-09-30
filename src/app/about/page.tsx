import React from "react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-12">
      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">
          OOs / Philosophy
        </p>
        <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-black">
          About the Brand
        </h1>
      </div>

      <div className="h-0.5 w-12 bg-black mx-auto" />

      <div className="text-xs uppercase tracking-widest leading-loose text-neutral-600 font-semibold space-y-8 max-w-xl mx-auto">
        <p>
          OOs is a single-brand fashion label rooted in minimalist streetwear. We believe in high-contrast design, clean visual layouts, and instant transaction flows.
        </p>
        <p>
          Every item is crafted with premium fabrics, tailored silhuettes, and detailed printing methods to give a distinctive urban culture aesthetic.
        </p>
        <p>
          Designed for the night, built for comfort.
        </p>
      </div>

      <div className="pt-8">
        <a
          href="/shop"
          className="inline-block bg-black text-white text-xs font-bold uppercase tracking-widest px-8 py-4 hover:bg-neutral-800 transition-colors"
        >
          View Collection
        </a>
      </div>
    </div>
  );
}
