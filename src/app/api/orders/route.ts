import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrderEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { items, address, shippingCost, totalAmount } = await req.json();

    if (!items || items.length === 0 || !address) {
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400 }
      );
    }

    // Process order inside a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Save Address (and reset other addresses' default status if this is default)
      // Check if user already has this address or just create a new one
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      await tx.address.create({
        data: {
          userId,
          street: address.street,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          isDefault: true,
        },
      });

      // 2. Validate stock and update
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new Error(`Variant not found`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(
            `Stok untuk ${variant.product.name} (Size: ${variant.size}) tidak mencukupi. Tersisa: ${variant.stock}`
          );
        }

        // Decrement stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Create the Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingCost,
          status: "PENDING",
          items: {
            create: items.map((item: { variantId: string; quantity: number; price: number }) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    // Request Snap token from Midtrans Sandbox
    let snapToken = null;
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
      const authHeader = `Basic ${Buffer.from(serverKey + ":").toString("base64")}`;

      const snapRes = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: result.id,
            gross_amount: result.totalAmount,
          },
          credit_card: {
            secure: true,
          },
          customer_details: {
            first_name: session.user.name || "Customer",
            email: session.user.email,
          },
        }),
      });

      if (snapRes.ok) {
        const snapData = await snapRes.json();
        snapToken = snapData.token;
      } else {
        const errText = await snapRes.text();
        console.error("Midtrans API error response:", errText);
      }
    } catch (err) {
      console.error("Failed to request Midtrans Snap token:", err);
    }

    // Fetch full order details for the email and send it asynchronously
    try {
      const fullOrder = await db.order.findUnique({
        where: { id: result.id },
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
      });
      if (fullOrder) {
        await sendOrderEmail(fullOrder, "PENDING");
      }
    } catch (mailErr) {
      console.error("Failed to send order creation email:", mailErr);
    }

    return NextResponse.json({ order: result, snapToken }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
