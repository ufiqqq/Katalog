import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const products = await db.product.findMany({
    include: {
      images: true,
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const orders = await db.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col justify-start">
      <div className="border-b border-neutral-100 pb-6 mb-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">
          Authorized Admin Panel
        </p>
        <h1 className="text-2xl font-extrabold uppercase tracking-wider text-black">
          Store Administration
        </h1>
      </div>

      <AdminDashboardClient initialProducts={products} initialOrders={orders} />
    </div>
  );
}
