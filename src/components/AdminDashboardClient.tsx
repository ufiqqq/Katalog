"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Product, ProductImage, ProductVariant, Order, OrderItem } from "@prisma/client";
import { OrderStatus } from "@/types/db-enums";
import { Plus, Edit2, Package, ShoppingCart, X, Trash2, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface ProductWithRelations extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
}

interface OrderWithUserAndItems extends Order {
  user: {
    name: string;
    email: string;
  };
  items: (OrderItem & {
    variant: ProductVariant & {
      product: Product;
    };
  })[];
}

interface AdminDashboardClientProps {
  initialProducts: ProductWithRelations[];
  initialOrders: OrderWithUserAndItems[];
}

export default function AdminDashboardClient({
  initialProducts,
  initialOrders,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "analytics">("products");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Data lists
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [orders, setOrders] = useState<OrderWithUserAndItems[]>(initialOrders);

  // Fixed list of categories as requested
  const categoriesList = ["Tees", "Shirts", "Outerwear", "Sweaters", "Pants", "Headwear", "Accessories"];

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductWithRelations | null>(null);
  
  // Input fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("Tees");
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Variant stock levels
  const [stockS, setStockS] = useState("0");
  const [stockM, setStockM] = useState("0");
  const [stockL, setStockL] = useState("0");
  const [stockXL, setStockXL] = useState("0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resiInputs, setResiInputs] = useState<{ [orderId: string]: string }>({});

  const handleOpenAddForm = () => {
    setEditProduct(null);
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setCategory("Tees");
    setImagesList([]);
    setStockS("0");
    setStockM("0");
    setStockL("0");
    setStockXL("0");
    setIsActive(true);
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (product: ProductWithRelations) => {
    setEditProduct(product);
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : "");
    setCategory(product.category);
    setImagesList(product.images.map((img) => img.url));
    
    // Find variant stocks
    const sVar = product.variants.find((v) => v.size === "S");
    const mVar = product.variants.find((v) => v.size === "M");
    const lVar = product.variants.find((v) => v.size === "L");
    const xlVar = product.variants.find((v) => v.size === "XL");

    setStockS(sVar ? sVar.stock.toString() : "0");
    setStockM(mVar ? mVar.stock.toString() : "0");
    setStockL(lVar ? lVar.stock.toString() : "0");
    setStockXL(xlVar ? xlVar.stock.toString() : "0");
    
    setIsActive(product.isActive);
    setError("");
    setIsFormOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      let loadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          loadedCount++;
          if (loadedCount === files.length) {
            setImagesList((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!category) {
      setError("Category is required");
      setLoading(false);
      return;
    }

    const variantsData = [
      { size: "S", stock: parseInt(stockS) || 0, sku: `${slug}-s` },
      { size: "M", stock: parseInt(stockM) || 0, sku: `${slug}-m` },
      { size: "L", stock: parseInt(stockL) || 0, sku: `${slug}-l` },
      { size: "XL", stock: parseInt(stockXL) || 0, sku: `${slug}-xl` },
    ];

    try {
      if (editProduct) {
        // Edit Mode: PUT /api/admin/products
        const res = await fetch("/api/admin/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editProduct.id,
            name,
            description,
            price: parseInt(price),
            originalPrice: originalPrice ? parseInt(originalPrice) : null,
            category,
            isActive,
            images: imagesList,
            variants: variantsData,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Gagal mengupdate produk.");
        } else {
          // Update local state
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editProduct.id
                ? {
                    ...p,
                    name,
                    description,
                    price: parseInt(price),
                    originalPrice: originalPrice ? parseInt(originalPrice) : null,
                    category,
                    isActive,
                    images: data.images || p.images,
                    variants: p.variants.map((v) => {
                      const match = variantsData.find((vd) => vd.size === v.size);
                      return match ? { ...v, stock: match.stock } : v;
                    }),
                  }
                : p
            )
          );
          setIsFormOpen(false);
        }
      } else {
        // Add Mode: POST /api/admin/products
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            slug,
            description,
            price: parseInt(price),
            originalPrice: originalPrice ? parseInt(originalPrice) : null,
            category,
            images: imagesList,
            variants: variantsData,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Gagal membuat produk.");
        } else {
          setProducts((prev) => [data, ...prev]);
          setIsFormOpen(false);
        }
      }
    } catch {
      setError("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert(data.error || "Gagal menghapus produk.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
        );
      } else {
        alert("Gagal mengupdate status pesanan.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleResiSubmit = async (orderId: string) => {
    const resi = resiInputs[orderId];
    if (!resi) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "SHIPPED",
          shippingResi: resi,
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "SHIPPED", shippingResi: resi } : o
          )
        );
        // Clear input state
        setResiInputs((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
      } else {
        alert("Gagal memasukkan resi.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "COMPLETED":
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const activeDiscounts = products.filter((p) => p.originalPrice && p.originalPrice > p.price).length;

    return {
      totalRevenue,
      totalOrders,
      avgOrder,
      activeDiscounts,
    };
  }, [orders, products]);

  const analyticsData = useMemo(() => {
    // 1. Daily Sales trend (last 7 days)
    const dailyMap: { [date: string]: { date: string; revenue: number; orders: number } } = {};
    const dateArray: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      dailyMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
      dateArray.push(dateStr);
    }

    orders.forEach((order) => {
      // Consider PAID, PROCESSING, SHIPPED, COMPLETED orders for analytics
      if (order.status !== "PENDING" && order.status !== "CANCELLED") {
        const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].revenue += order.totalAmount;
          dailyMap[dateStr].orders += 1;
        } else {
          // If order is outside 7 days range, add it dynamically to dateArray
          dailyMap[dateStr] = { date: dateStr, revenue: order.totalAmount, orders: 1 };
          if (!dateArray.includes(dateStr)) {
            dateArray.push(dateStr);
          }
        }
      }
    });

    const dailyData = dateArray.map((date) => dailyMap[date]);

    // 2. Category distribution
    const categoryMap: { [cat: string]: number } = {};
    orders.forEach((order) => {
      if (order.status !== "PENDING" && order.status !== "CANCELLED") {
        order.items.forEach((item) => {
          const cat = item.variant.product.category;
          categoryMap[cat] = (categoryMap[cat] || 0) + item.quantity;
        });
      }
    });

    const categoryData = Object.keys(categoryMap).map((catName) => ({
      name: catName,
      value: categoryMap[catName],
    }));

    return {
      dailyData,
      categoryData,
    };
  }, [orders]);

  return (
    <div className="flex flex-col space-y-8">
      {/* Summary Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-50 p-4 border border-neutral-200">
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Total Revenue</p>
          <p className="text-lg font-black text-black mt-1">Rp {stats.totalRevenue.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-neutral-50 p-4 border border-neutral-200">
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Total Orders</p>
          <p className="text-lg font-black text-black mt-1">{stats.totalOrders} Pesanan</p>
        </div>
        <div className="bg-neutral-50 p-4 border border-neutral-200">
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Avg. Order Value</p>
          <p className="text-lg font-black text-black mt-1">Rp {stats.avgOrder.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-neutral-50 p-4 border border-neutral-200">
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Promo / Discounts</p>
          <p className="text-lg font-black text-black mt-1">{stats.activeDiscounts} Items Active</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-4 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === "products"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          <Package className="h-4 w-4" />
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === "orders"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === "analytics"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          Analytics
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-black">
              Products Catalogue
            </h2>
            <button
              onClick={handleOpenAddForm}
              className="btn-black py-2.5 px-4 text-xs flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>

          {/* Form Modal/Section */}
          {isFormOpen && (
            <div className="bg-neutral-50 p-6 border border-neutral-200 space-y-6">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest">
                  {editProduct ? `Edit Product: ${editProduct.name}` : "Add New Product"}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-neutral-400 hover:text-black">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-2 border-red-600 p-3 text-xs text-red-800 font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. OOs Black Hoodie"
                      className="input-flat"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Product Slug (Unique URL path)
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editProduct}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/ /g, "-"))}
                      placeholder="e.g. oos-black-hoodie"
                      className="input-flat disabled:bg-neutral-100 disabled:text-neutral-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Product details..."
                      rows={3}
                      className="input-flat resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Price (IDR)
                      </label>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="350000"
                        className="input-flat"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Original Price (IDR - Optional)
                      </label>
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="e.g. 450000"
                        className="input-flat"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="input-flat appearance-none pr-8 cursor-pointer font-bold text-xs"
                      >
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                      Product Images (Select one or more from Folder)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="input-flat text-xs"
                      required={!editProduct && imagesList.length === 0}
                    />
                    {imagesList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {imagesList.map((url, idx) => (
                          <div key={idx} className="relative h-20 w-15 overflow-hidden border border-neutral-200 aspect-[3/4]">
                            <img src={url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black text-white text-[8px] font-bold p-1 leading-none rounded-none"
                              title="Remove image"
                            >
                              X
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[7px] text-white font-bold uppercase tracking-wider text-center py-0.5">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Varian Stocks */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                      Variant Stocks Management
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[9px] text-center font-bold mb-1">Size S</label>
                        <input
                          type="number"
                          value={stockS}
                          onChange={(e) => setStockS(e.target.value)}
                          className="input-flat text-center py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-center font-bold mb-1">Size M</label>
                        <input
                          type="number"
                          value={stockM}
                          onChange={(e) => setStockM(e.target.value)}
                          className="input-flat text-center py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-center font-bold mb-1">Size L</label>
                        <input
                          type="number"
                          value={stockL}
                          onChange={(e) => setStockL(e.target.value)}
                          className="input-flat text-center py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-center font-bold mb-1">Size XL</label>
                        <input
                          type="number"
                          value={stockXL}
                          onChange={(e) => setStockXL(e.target.value)}
                          className="input-flat text-center py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {editProduct && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="accent-black h-4 w-4"
                      />
                      <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                        Product is Active / Visible
                      </label>
                    </div>
                  )}

                  <div className="pt-4 flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-black py-3 text-xs"
                    >
                      {loading ? "Saving..." : "Save Product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 btn-outline py-3 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Products List Table */}
          <div className="overflow-x-auto border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs uppercase tracking-wider font-semibold">
              <thead className="bg-neutral-50 text-[10px] text-neutral-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Stock (S / M / L / XL)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {products.map((product) => {
                  const image = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "/images/placeholder.jpg";
                  const sVar = product.variants.find((v) => v.size === "S")?.stock || 0;
                  const mVar = product.variants.find((v) => v.size === "M")?.stock || 0;
                  const lVar = product.variants.find((v) => v.size === "L")?.stock || 0;
                  const xlVar = product.variants.find((v) => v.size === "XL")?.stock || 0;

                  return (
                    <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="h-12 w-9 overflow-hidden bg-neutral-100 border border-neutral-200 relative flex-shrink-0">
                          <img src={image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-extrabold text-black tracking-wide line-clamp-1">{product.name}</p>
                          <p className="text-neutral-400 text-[10px] mt-0.5 lowercase tracking-normal">/{product.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-black">
                        Rp {product.price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">{product.category}</td>
                      <td className="px-6 py-4 text-black">
                        {sVar} / {mVar} / {lVar} / {xlVar}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] font-bold border ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(product)}
                          className="p-2 border border-neutral-200 hover:border-black transition-colors inline-flex items-center gap-1"
                          title="Edit Product"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 border border-red-200 hover:bg-red-50 hover:border-red-600 text-red-600 transition-colors inline-flex items-center gap-1"
                          title="Delete Product"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-black">
            Orders Manager
          </h2>

          <div className="overflow-x-auto border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs uppercase tracking-wider font-semibold">
              <thead className="bg-neutral-50 text-[10px] text-neutral-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items Summary</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tracking Resi</th>
                  <th className="px-6 py-4 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-black">{order.id}</p>
                      <p className="text-neutral-400 text-[10px] mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-black">{order.user.name}</p>
                      <p className="text-neutral-400 text-[10px] mt-0.5 lowercase tracking-normal">
                        {order.user.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-[10px] text-neutral-600 lowercase tracking-normal">
                        {order.items.map((item) => (
                          <p key={item.id}>
                            {item.variant.product.name} (size: {item.variant.size} × {item.quantity})
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-black">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[9px] font-bold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.shippingResi ? (
                        <span className="font-extrabold text-black tracking-wider">
                          {order.shippingResi}
                        </span>
                      ) : order.status === "PROCESSING" || order.status === "PAID" ? (
                        <div className="flex gap-2 max-w-xs">
                          <input
                            type="text"
                            placeholder="Resi"
                            value={resiInputs[order.id] || ""}
                            onChange={(e) =>
                              setResiInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                            }
                            className="input-flat py-1.5 px-2 text-[10px] w-28 uppercase"
                          />
                          <button
                            onClick={() => handleResiSubmit(order.id)}
                            className="bg-black text-white text-[9px] font-bold px-2 py-1 uppercase"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">No Resi</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === "PENDING" && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, "PAID")}
                          className="px-2 py-1 text-[10px] font-bold uppercase border border-emerald-500 text-emerald-600 hover:bg-emerald-55 bg-white transition-colors"
                        >
                          Confirm Paid
                        </button>
                      )}
                      {order.status === "PAID" && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, "PROCESSING")}
                          className="px-2 py-1 text-[10px] font-bold uppercase border border-blue-500 text-blue-600 hover:bg-blue-55 bg-white transition-colors"
                        >
                          Process Pack
                        </button>
                      )}
                      {order.status === "PROCESSING" && (
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">
                          Enter Resi to Ship
                        </span>
                      )}
                      {order.status === "SHIPPED" && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, "COMPLETED")}
                          className="px-2 py-1 text-[10px] font-bold uppercase border border-neutral-500 text-black hover:bg-black hover:text-white transition-colors"
                        >
                          Complete Order
                        </button>
                      )}
                      {order.status === "COMPLETED" && (
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">
                          Finished
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-10">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-black">
              Sales Analytics & Insights
            </h2>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">
              Visualisasi tren pendapatan dan volume penjualan toko Anda
            </p>
          </div>

          {!isMounted ? (
            <div className="h-96 w-full bg-neutral-50 flex items-center justify-center border border-neutral-200 uppercase tracking-wider text-xs text-neutral-400">
              Loading Charts...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Revenue Trend */}
              <div className="bg-white p-6 border border-neutral-200">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6">
                  Tren Pendapatan Harian (IDR)
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.dailyData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: "bold" }} />
                      <YAxis tick={{ fontSize: 9, fontWeight: "bold" }} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Tooltip formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pendapatan"]} labelStyle={{ fontSize: 10, fontWeight: "bold" }} />
                      <Line type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Orders Volume */}
              <div className="bg-white p-6 border border-neutral-200">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6">
                  Volume Transaksi Harian (Pesanan)
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.dailyData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: "bold" }} />
                      <YAxis tick={{ fontSize: 9, fontWeight: "bold" }} />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Tooltip formatter={(value: any) => [value, "Jumlah Pesanan"]} labelStyle={{ fontSize: 10, fontWeight: "bold" }} />
                      <Bar dataKey="orders" fill="#000" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Category Distribution */}
              <div className="bg-white p-6 border border-neutral-200 lg:col-span-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 mb-6">
                  Volume Penjualan Produk per Kategori (Unit)
                </h3>
                {analyticsData.categoryData.length === 0 ? (
                  <p className="text-center py-20 text-xs text-neutral-400 uppercase tracking-widest">
                    Belum ada data penjualan kategori.
                  </p>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.categoryData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "bold" }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: "bold" }} />
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Tooltip formatter={(value: any) => [value, "Unit Terjual"]} labelStyle={{ fontSize: 10, fontWeight: "bold" }} />
                        <Bar dataKey="value" fill="#404040">
                          {analyticsData.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#000" : "#737373"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
