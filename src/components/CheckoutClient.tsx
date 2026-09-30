"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { Address } from "@prisma/client";

interface CheckoutClientProps {
  savedAddress: Address | null;
}

const COURIER_OPTIONS = [
  { id: "jne", name: "JNE Express" },
  { id: "pos", name: "POS Indonesia" },
  { id: "tiki", name: "TIKI" },
];



interface Province {
  province_id: string;
  province: string;
}

interface City {
  city_id: string;
  city_name: string;
  type: string;
}

interface ShippingService {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: string;
}

export default function CheckoutClient({ savedAddress }: CheckoutClientProps) {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Address inputs
  const [street, setStreet] = useState(savedAddress?.street || "");
  const [city, setCity] = useState(savedAddress?.city || "");
  const [province, setProvince] = useState(savedAddress?.province || "");
  const [postalCode, setPostalCode] = useState(savedAddress?.postalCode || "");

  // RajaOngkir state variables
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [courierCode, setCourierCode] = useState("jne");
  const [shippingServices, setShippingServices] = useState<ShippingService[]>([]);
  const [selectedService, setSelectedService] = useState<ShippingService | null>(null);

  // Status/loading states
  const [loading, setLoading] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratesError, setRatesError] = useState("");



  // Load Midtrans Snap JS and fetch initial provinces
  useEffect(() => {
    setMounted(true);

    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const myMidtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "Mid-client-VWaWQHPOsd9ux_2m";

    let script = document.querySelector(`script[src="${snapScriptUrl}"]`) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.src = snapScriptUrl;
      script.setAttribute("data-client-key", myMidtransClientKey);
      script.async = true;
      document.body.appendChild(script);
    }

    // Fetch Provinces
    const fetchProvinces = async () => {
      try {
        const res = await fetch("/api/shipping/provinces");
        const data = await res.json();
        if (res.ok) {
          setProvinces(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data provinsi:", err);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch Cities when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      setSelectedCityId("");
      setShippingServices([]);
      setSelectedService(null);
      return;
    }

    const fetchCities = async () => {
      try {
        const res = await fetch(`/api/shipping/cities?provinceId=${selectedProvinceId}`);
        const data = await res.json();
        if (res.ok) {
          setCities(data);
          setSelectedCityId("");
          setShippingServices([]);
          setSelectedService(null);
        }
      } catch (err) {
        console.error("Gagal mengambil data kota:", err);
      }
    };

    fetchCities();
  }, [selectedProvinceId]);

  // Fetch rates when city or courier changes
  useEffect(() => {
    if (!selectedCityId || !courierCode) {
      setShippingServices([]);
      setSelectedService(null);
      return;
    }

    const fetchShippingRates = async () => {
      setRatesLoading(true);
      setRatesError("");
      try {
        const totalWeight = items.reduce((sum, item) => sum + item.quantity * 500, 0); // 500g per item
        const res = await fetch("/api/shipping/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: selectedCityId,
            weight: totalWeight,
            courier: courierCode,
          }),
        });

        const data = await res.json();
        if (res.ok && data.results && data.results[0] && data.results[0].costs) {
          const formattedServices = data.results[0].costs.map((c: { service: string; description: string; cost: { value: number; etd: string; note: string }[] }) => ({
            id: c.service,
            name: `${data.results[0].name} - ${c.service}`,
            description: c.description,
            cost: c.cost[0].value,
            duration: c.cost[0].etd,
          }));
          setShippingServices(formattedServices);
          if (formattedServices.length > 0) {
            setSelectedService(formattedServices[0]);
          } else {
            setSelectedService(null);
            setRatesError("Kurir tidak menyediakan layanan ke kota ini.");
          }
        } else {
          setShippingServices([]);
          setSelectedService(null);
          setRatesError(data.error || "Gagal mengambil tarif ongkir.");
        }
      } catch (err) {
        console.error(err);
        setRatesError("Gagal menghubungkan ke server ongkir.");
      } finally {
        setRatesLoading(false);
      }
    };

    fetchShippingRates();
  }, [selectedCityId, courierCode, items]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-neutral-200">
        <p className="text-neutral-500 text-sm uppercase tracking-wider mb-4">
          Your cart is empty.
        </p>
        <button
          onClick={() => router.push("/")}
          className="btn-black text-xs font-bold uppercase tracking-widest px-6 py-3"
        >
          Go Shopping
        </button>
      </div>
    );
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = selectedService ? selectedService.cost : 0;
  const totalAmount = itemsSubtotal + shippingCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!street || !city || !province || !postalCode) {
      setError("Semua field alamat pengiriman wajib diisi.");
      setLoading(false);
      return;
    }

    if (!selectedService) {
      setError("Silakan pilih layanan pengiriman terlebih dahulu.");
      setLoading(false);
      return;
    }

    try {
      const orderItems = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }));

      const addressData = {
        street,
        city,
        province,
        postalCode,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems,
          address: addressData,
          shippingCost,
          totalAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuat pesanan.");
      } else {
        if (data.snapToken) {
          const snapPay = (window as Window & { snap?: { pay: (token: string, options: Record<string, unknown>) => void } }).snap?.pay;
          if (snapPay) {
            snapPay(data.snapToken, {
              onSuccess: async () => {
                await fetch(`/api/orders/update-status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.order.id, status: "PAID" }),
                });
                clearCart();
                router.push("/dashboard?newOrder=true");
              },
              onPending: () => {
                alert("Pembayaran Anda pending. Silakan cek dashboard Anda.");
                clearCart();
                router.push("/dashboard?newOrder=true");
              },
              onError: () => {
                alert("Pembayaran gagal. Silakan coba kembali.");
              },
              onClose: () => {
                alert("Anda menutup halaman pembayaran sebelum menyelesaikan transaksi.");
              }
            } as Record<string, unknown>);
          } else {
            clearCart();
            router.push("/dashboard?newOrder=true");
          }
        } else {
          clearCart();
          router.push("/dashboard?newOrder=true");
        }
      }
    } catch {
      setError("Terjadi kesalahan koneksi saat mengirim pesanan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
      {/* Left Column: Address and Shipping Courier */}
      <div className="lg:col-span-7 space-y-10">
        {/* Shipping Address Section */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-black border-b border-neutral-100 pb-2">
            1. Shipping Address
          </h2>
          
          {error && (
            <div className="bg-red-50 border-l-2 border-red-600 p-3 text-xs text-red-800 font-bold uppercase tracking-wider">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Street Address
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Jl. Senopati No. 45, Kebayoran Baru"
                className="input-flat animate-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                  Province
                </label>
                <select
                  required
                  value={selectedProvinceId}
                  onChange={(e) => {
                    const provId = e.target.value;
                    setSelectedProvinceId(provId);
                    const provName = provinces.find(p => p.province_id === provId)?.province || "";
                    setProvince(provName);
                  }}
                  className="input-flat pr-8 cursor-pointer font-bold text-xs uppercase"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map((p) => (
                    <option key={p.province_id} value={p.province_id}>
                      {p.province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                  City
                </label>
                <select
                  required
                  disabled={!selectedProvinceId}
                  value={selectedCityId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCityId(cId);
                    const cName = cities.find(c => c.city_id === cId)?.city_name || "";
                    setCity(cName);
                  }}
                  className="input-flat pr-8 cursor-pointer font-bold text-xs uppercase disabled:bg-neutral-50 disabled:text-neutral-400"
                >
                  <option value="">Pilih Kota</option>
                  {cities.map((c) => (
                    <option key={c.city_id} value={c.city_id}>
                      {c.type} {c.city_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Postal Code
              </label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12190"
                className="input-flat animate-none"
              />
            </div>
          </div>
        </div>

        {/* Courier Section */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-black border-b border-neutral-100 pb-2">
            2. Shipping Carrier
          </h2>

          {/* Courier Selector */}
          <div className="grid grid-cols-3 gap-2">
            {COURIER_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCourierCode(c.id)}
                className={`py-2.5 text-xs font-bold uppercase border transition-colors ${
                  courierCode === c.id
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-neutral-200 hover:border-black"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Shipping Services List */}
          <div className="space-y-3 mt-4">
            {ratesLoading ? (
              <p className="text-xs text-neutral-500 uppercase tracking-wider animate-pulse py-4 text-center">
                Mencari layanan kurir terbaik...
              </p>
            ) : ratesError ? (
              <div className="bg-red-50 border-l-2 border-red-500 p-3 text-xs text-red-700 uppercase font-bold">
                {ratesError}
              </div>
            ) : shippingServices.length > 0 ? (
              shippingServices.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center justify-between p-4 border transition-all cursor-pointer ${
                    selectedService?.id === s.id
                      ? "border-black bg-neutral-50"
                      : "border-neutral-200 hover:border-black"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingService"
                      value={s.id}
                      checked={selectedService?.id === s.id}
                      onChange={() => setSelectedService(s)}
                      className="accent-black"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">{s.name}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">
                        Estimasi: {s.duration}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold uppercase">
                    Rp {s.cost.toLocaleString("id-ID")}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-xs text-neutral-400 uppercase tracking-wider text-center py-6 border border-dashed border-neutral-200">
                Pilih Provinsi dan Kota terlebih dahulu untuk melihat pilihan layanan kurir.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Cart Summary and Checkout CTA */}
      <div className="lg:col-span-5 bg-neutral-50 p-6 md:p-8 h-fit border border-neutral-100 space-y-8">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-black border-b border-neutral-200 pb-4">
          Order Summary
        </h2>

        {/* Cart items list */}
        <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item.variantId} className="flex justify-between items-start text-xs border-b border-neutral-100 pb-4">
              <div className="flex gap-3">
                <div className="h-16 w-12 bg-white border border-neutral-100 overflow-hidden relative flex-shrink-0">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wide line-clamp-1">{item.name}</p>
                  <p className="text-neutral-500 mt-1 uppercase text-[9px]">Size: {item.size} × {item.quantity}</p>
                </div>
              </div>
              <span className="font-bold">
                Rp {(item.price * item.quantity).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-3 border-b border-neutral-200 pb-6 text-xs uppercase tracking-wider font-semibold">
          <div className="flex justify-between">
            <span className="text-neutral-500">Items Subtotal</span>
            <span>Rp {itemsSubtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Shipping {selectedService ? `(${selectedService.name})` : ""}</span>
            <span>Rp {shippingCost.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold pt-2 text-black">
            <span>Total Amount</span>
            <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Checkout CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-black py-4 uppercase tracking-widest font-extrabold text-xs"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </form>
  );
}
