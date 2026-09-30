import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import CheckoutClient from "@/components/CheckoutClient";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth?callbackUrl=/checkout");
  }

  // Load user's default saved address
  const savedAddress = await db.address.findFirst({
    where: {
      userId: session.user.id,
      isDefault: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col justify-start">
      <h1 className="text-xl font-extrabold uppercase tracking-widest mb-10 border-b border-neutral-100 pb-4 text-black">
        Checkout
      </h1>
      <CheckoutClient savedAddress={savedAddress} />
    </div>
  );
}
