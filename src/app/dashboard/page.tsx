import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

interface DashboardProps {
  searchParams: {
    newOrder?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth?callbackUrl=/dashboard");
  }

  const isNewOrder = searchParams?.newOrder === "true";

  // Fetch user orders directly
  const orders = await db.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch user saved addresses
  const addresses = await db.address.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      isDefault: "desc",
    },
  });

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col justify-start">
      {/* Welcome & Info banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-neutral-100 pb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
            Customer Dashboard
          </p>
          <h1 className="text-2xl font-extrabold uppercase tracking-wider text-black">
            Welcome, {session.user.name}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">{session.user.email}</p>
        </div>
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="btn-black text-xs font-bold uppercase tracking-widest py-3 px-6"
          >
            Go to Admin Dashboard
          </Link>
        )}
      </div>

      {isNewOrder && (
        <div className="mb-8 bg-neutral-900 text-white p-4 border border-black text-xs font-bold uppercase tracking-wider">
          Pesanan berhasil dibuat! Silakan lakukan pembayaran ke Virtual Account atau QRIS pilihan Anda.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Orders History List */}
        <div className="lg:col-span-8 space-y-8">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-black border-b border-neutral-100 pb-2 mb-6">
            Order History ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-200">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-4">
                You haven&apos;t placed any orders yet.
              </p>
              <Link href="/" className="btn-black text-xs font-bold uppercase tracking-widest px-6 py-3">
                Shop Our Collection
              </Link>
            </div>
          ) : (
            <div className="space-y-8 animate-none">
              {orders.map((order) => (
                <div key={order.id} className="border border-neutral-200 p-6 space-y-4">
                  {/* Order header information */}
                  <div className="flex flex-wrap justify-between items-center gap-3 border-b border-neutral-100 pb-4 text-xs">
                    <div>
                      <p className="font-bold text-neutral-500 uppercase">Order ID</p>
                      <p className="font-extrabold text-black mt-0.5">{order.id}</p>
                    </div>
                    <div>
                      <p className="font-bold text-neutral-500 uppercase">Placed On</p>
                      <p className="font-extrabold text-black mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-neutral-500 uppercase">Total Amount</p>
                      <p className="font-extrabold text-black mt-0.5">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order items lists */}
                  <div className="divide-y divide-neutral-100">
                    {order.items.map((item) => {
                      const product = item.variant.product;
                      const image = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || "/images/placeholder.jpg";

                      return (
                        <div key={item.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                          <div className="flex gap-4">
                            <div className="h-16 w-12 bg-neutral-50 overflow-hidden border border-neutral-100 relative">
                              <img src={image} alt={product.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="text-xs uppercase tracking-wide">
                              <p className="font-extrabold text-black line-clamp-1">{product.name}</p>
                              <p className="text-neutral-500 mt-1 text-[10px]">
                                Size: {item.variant.size} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Shipping Resi/Tracking info */}
                  <div className="bg-neutral-50 p-4 border border-neutral-100 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-neutral-500 uppercase text-[9px] tracking-wider">
                        Shipping Tracking Resi
                      </p>
                      <p className="font-bold text-black mt-1 uppercase tracking-wider">
                        {order.shippingResi ? order.shippingResi : "BELUM DIKIRIM / MENUNGGU RESI"}
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold text-neutral-400 uppercase">
                      Cost: Rp {order.shippingCost.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Saved Addresses List */}
        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-black border-b border-neutral-100 pb-2 mb-6">
            Shipping Addresses
          </h2>

          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-neutral-500 text-xs uppercase tracking-wider font-light">
                No addresses saved yet. They are automatically saved when you checkout.
              </p>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className="border border-neutral-200 p-4 text-xs space-y-2 relative">
                  {address.isDefault && (
                    <span className="absolute top-4 right-4 bg-black text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                      Default
                    </span>
                  )}
                  <p className="font-extrabold uppercase tracking-wider">Address Details</p>
                  <p className="text-neutral-600 leading-relaxed font-light mt-2">
                    {address.street} <br />
                    {address.city}, {address.province} <br />
                    {address.postalCode}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
