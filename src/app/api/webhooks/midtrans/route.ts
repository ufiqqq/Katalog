import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOrderEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Midtrans Webhook Notification Received:", body);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // 1. Verify Midtrans signature key
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const payloadToHash = order_id + status_code + gross_amount + serverKey;
    const computedHash = crypto.createHash("sha512").update(payloadToHash).digest("hex");

    if (computedHash !== signature_key) {
      console.warn("Unauthorized webhook: Signature mismatch!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Find order in database
    const order = await db.order.findUnique({
      where: { id: order_id },
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

    if (!order) {
      console.error(`Order with ID ${order_id} not found.`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentStatus = order.status;
    let targetStatus = currentStatus;
    let shouldRestoreStock = false;

    // 3. Determine target order status
    if (transaction_status === "capture") {
      if (fraud_status === "accept") {
        targetStatus = "PAID";
      }
    } else if (transaction_status === "settlement") {
      targetStatus = "PAID";
    } else if (transaction_status === "pending") {
      targetStatus = "PENDING";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "expire" ||
      transaction_status === "cancel"
    ) {
      targetStatus = "CANCELLED";
      // If cancelling an order that was pending/paid, restore stock
      if (currentStatus !== "CANCELLED") {
        shouldRestoreStock = true;
      }
    }

    // 4. Update status and handle stock restoration inside a transaction
    if (targetStatus !== currentStatus) {
      await db.$transaction(async (tx) => {
        // Update Order status
        await tx.order.update({
          where: { id: order_id },
          data: { status: targetStatus },
        });

        // Restore stock if the order got cancelled/expired
        if (shouldRestoreStock) {
          console.log(`Restoring stock for cancelled order ${order_id}...`);
          for (const item of order.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      });

      // Fetch fresh order details with user & product relations to send email correctly
      const updatedOrder = await db.order.findUnique({
        where: { id: order_id },
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

      // 5. Send status notification email
      if (updatedOrder) {
        if (targetStatus === "PAID") {
          await sendOrderEmail(updatedOrder, "PAID");
        } else if (targetStatus === "CANCELLED") {
          await sendOrderEmail(updatedOrder, "CANCELLED");
        }
      }
    }

    return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Midtrans webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
