"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, RotateCcw, Heart } from "lucide-react";
import { useSession } from "next-auth/react";

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string;
  createdAt: string | Date;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ShopClientProps {
  initialProducts: Product[];
}

export default function ShopClient({ initialProducts }: ShopClientProps) {
  // Sidebar expand/collapse states
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isProductTypeExpanded, setIsProductTypeExpanded] = useState(true);
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState(true);
  const [isPriceExpanded, setIsPriceExpanded] = useState(true);
  const [isSizeExpanded, setIsSizeExpanded] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [productType, setProductType] = useState<"all" | "discount">("all");
  const [availability, setAvailability] = useState<"all" | "in-stock">("all");
  const [priceRange, setPriceRange] = useState<"all" | "under-370" | "370-690" | "690-1000" | "above-1000">("all");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Sort state
  const [sort, setSort] = useState("recent");

  // Wishlist states
  const { data: session } = useSession();
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);
  const [loadingWishlistId, setLoadingWishlistId] = useState<string | null>(null);

  // Fetch wishlist
  useEffect(() => {
    if (!session) return;
    const fetchWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          setWishlistProductIds(data.map((item: { productId: string }) => item.productId));
        }
      } catch (err) {
        console.error("Gagal mengambil wishlist:", err);
      }
    };
    fetchWishlist();
  }, [session]);

  const handleToggleWishlist = async (productId: string) => {
    if (!session) {
      alert("Silakan login terlebih dahulu untuk menandai produk favorit Anda.");
      return;
    }
    setLoadingWishlistId(productId);
    try {
      const isWishlisted = wishlistProductIds.includes(productId);
      if (isWishlisted) {
        const res = await fetch(`/api/wishlist?productId=${productId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setWishlistProductIds((prev) => prev.filter((id) => id !== productId));
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          setWishlistProductIds((prev) => [...prev, productId]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoadingWishlistId(null);
    }
  };

  // Constant list of categories
  const categoriesList = ["Tees", "Shirts", "Outerwear", "Sweaters", "Pants", "Headwear", "Accessories"];
  const sizesList = ["S", "M", "L", "XL"];

  // Toggle category select
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setProductType("all");
    setAvailability("all");
    setPriceRange("all");
    setSelectedSize(null);
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      search !== "" ||
      selectedCategories.length > 0 ||
      productType !== "all" ||
      availability !== "all" ||
      priceRange !== "all" ||
      selectedSize !== null
    );
  }, [search, selectedCategories, productType, availability, priceRange, selectedSize]);

  // Dynamic filtering & sorting
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. Search Filter
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // 2. Categories Filter (Multiple selection)
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // 3. Product Type Filter (Discount)
    if (productType === "discount") {
      result = result.filter((p) => p.originalPrice && p.originalPrice > p.price);
    }

    // 4. Availability Filter
    if (availability === "in-stock") {
      result = result.filter((p) => p.variants.some((v) => v.stock > 0));
    }

    // 5. Price Range Filter
    if (priceRange !== "all") {
      result = result.filter((p) => {
        if (priceRange === "under-370") return p.price < 370000;
        if (priceRange === "370-690") return p.price >= 370000 && p.price <= 690000;
        if (priceRange === "690-1000") return p.price >= 690000 && p.price <= 1000000;
        if (priceRange === "above-1000") return p.price > 1000000;
        return true;
      });
    }

    // 6. Size Filter
    if (selectedSize !== null) {
      result = result.filter((p) =>
        p.variants.some((v) => v.size === selectedSize && v.stock > 0)
      );
    }

    // 7. Sort
    result.sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === "price-asc") {
        return a.price - b.price;
      }
      if (sort === "price-desc") {
        return b.price - a.price;
      }
      if (sort === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sort === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      // default / featured
      return 0;
    });

    return result;
  }, [initialProducts, search, selectedCategories, productType, availability, priceRange, selectedSize, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR FILTER */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
          
          {/* Search Box & Remove Filter Row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2.5 border border-neutral-200 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-black rounded-none"
              />
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest transition-colors"
                title="Remove all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Categories Accordion */}
          <div className="border-b border-neutral-100 pb-4">
            <button
              onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
              className="flex justify-between items-center w-full text-left py-2"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-black">
                Categories
              </span>
              {isCategoriesExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            
            {isCategoriesExpanded && (
              <div className="mt-3 space-y-2.5">
                {categoriesList.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                      className="h-4 w-4 border-neutral-300 text-black focus:ring-black rounded-none"
                    />
                    <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700 group-hover:text-black transition-colors">
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Product Type Accordion */}
          <div className="border-b border-neutral-100 pb-4">
            <button
              onClick={() => setIsProductTypeExpanded(!isProductTypeExpanded)}
              className="flex justify-between items-center w-full text-left py-2"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-black">
                Product Type
              </span>
              {isProductTypeExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            
            {isProductTypeExpanded && (
              <div className="mt-3 space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    checked={productType === "all"}
                    onChange={() => setProductType("all")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    All Products
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    checked={productType === "discount"}
                    onChange={() => setProductType("discount")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    Discount
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Availability Accordion */}
          <div className="border-b border-neutral-100 pb-4">
            <button
              onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
              className="flex justify-between items-center w-full text-left py-2"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-black">
                Availability
              </span>
              {isAvailabilityExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            
            {isAvailabilityExpanded && (
              <div className="mt-3 space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availability === "all"}
                    onChange={() => setAvailability("all")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    All
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availability === "in-stock"}
                    onChange={() => setAvailability("in-stock")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    In Stock
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Price Range Accordion */}
          <div className="border-b border-neutral-100 pb-4">
            <button
              onClick={() => setIsPriceExpanded(!isPriceExpanded)}
              className="flex justify-between items-center w-full text-left py-2"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-black">
                Price
              </span>
              {isPriceExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            
            {isPriceExpanded && (
              <div className="mt-3 space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceRange === "all"}
                    onChange={() => setPriceRange("all")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    All Prices
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceRange === "under-370"}
                    onChange={() => setPriceRange("under-370")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    Under Rp 370,000
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceRange === "370-690"}
                    onChange={() => setPriceRange("370-690")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    Rp 370,000 - Rp 690,000
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceRange === "690-1000"}
                    onChange={() => setPriceRange("690-1000")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    Rp 690,000 - Rp 1,000,000
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceRange === "above-1000"}
                    onChange={() => setPriceRange("above-1000")}
                    className="h-4 w-4 border-neutral-300 text-black focus:ring-black"
                  />
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700">
                    Rp 1,000,000 +
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Size Accordion */}
          <div>
            <button
              onClick={() => setIsSizeExpanded(!isSizeExpanded)}
              className="flex justify-between items-center w-full text-left py-2"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-black">
                Size
              </span>
              {isSizeExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              )}
            </button>
            
            {isSizeExpanded && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {sizesList.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                    className={`py-2 text-xs font-bold uppercase border transition-colors ${
                      selectedSize === sz
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-neutral-200 hover:border-black"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            )}
          </div>

        </aside>

        {/* RIGHT CATALOG / PRODUCT GRID AREA */}
        <main className="flex-grow space-y-6">
          
          {/* Header Row: Title and Sort Dropdown */}
          <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-black">
                All Products
              </h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">
                Showing {filteredProducts.length} items
              </p>
            </div>

            {/* Sort Select Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Sort:
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-neutral-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-black rounded-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="recent">Recent</option>
                <option value="oldest">Oldest</option>
                <option value="price-asc">Lowest Price</option>
                <option value="price-desc">Highest Price</option>
                <option value="name-asc">Product Name (A-Z)</option>
                <option value="name-desc">Product Name (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-200">
              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-4">
                No products match the selected filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-neutral-800 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
              {filteredProducts.map((product) => {
                const primaryImage = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "/images/placeholder.jpg";
                const secondaryImage = product.images[1]?.url || primaryImage;
                const hasStock = product.variants.some((v) => v.stock > 0);

                // Real database-driven discount check
                const isDiscounted = !!(product.originalPrice && product.originalPrice > product.price);

                return (
                  <div key={product.id} className="group relative flex flex-col">
                    
                    {/* Image Container with 3:4 aspect ratio */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 border border-neutral-100">
                      <Link href={`/products/${product.slug}`} className="block h-full w-full">
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover object-center transition-opacity duration-300 group-hover:opacity-0"
                        />
                        <img
                          src={secondaryImage}
                          alt={`${product.name} alternate`}
                          className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                      </Link>

                      {/* Floating Heart Wishlist Button */}
                      <button
                        type="button"
                        disabled={loadingWishlistId === product.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleWishlist(product.id);
                        }}
                        className="absolute top-2 left-2 z-10 bg-white/80 hover:bg-white text-black p-1.5 transition-colors border border-neutral-100 rounded-none shadow-sm backdrop-blur-sm"
                        title="Add to Wishlist"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            wishlistProductIds.includes(product.id) ? "fill-black text-black" : "text-black"
                          }`}
                        />
                      </button>
                      
                      {/* Discount Badge */}
                      {isDiscounted && product.originalPrice && (
                        <div className="absolute top-2 right-2 bg-black text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </div>
                      )}

                      {/* Sold Out Label */}
                      {!hasStock && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-3 flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black transition-colors line-clamp-2">
                          <Link href={`/products/${product.slug}`}>
                            {product.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-[9px] text-neutral-400 uppercase tracking-widest">
                          {product.category}
                        </p>
                      </div>

                      {/* Price (Standard or Discounted) */}
                      <div className="mt-2 text-xs font-extrabold uppercase">
                        {isDiscounted && product.originalPrice ? (
                          <div className="space-y-0.5">
                            <span className="text-neutral-400 line-through mr-2 font-semibold">
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
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
