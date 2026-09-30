import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderStatus } from "@/types/db-enums";
import { sendOrderEmail } from "@/lib/mail";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Admin get orders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId, status, shippingResi } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    // Verify if status is valid OrderStatus
    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Find the current order state
    const currentOrder = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentStatus = currentOrder.status;
    const targetStatus = status as OrderStatus;
    const shouldRestoreStock = targetStatus === "CANCELLED" && currentStatus !== "CANCELLED";

    // Perform updates inside a transaction
    const updatedOrder = await db.$transaction(async (tx) => {
      const orderUpdate = await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus,
          shippingResi: shippingResi || undefined,
        },
      });

      if (shouldRestoreStock) {
        console.log(`Admin is cancelling order ${orderId}, restoring stock...`);
        for (const item of currentOrder.items) {
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

      return orderUpdate;
    });

    // Send email notification if status changed
    if (targetStatus !== currentStatus) {
      try {
        const fullOrder = await db.order.findUnique({
          where: { id: orderId },
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
          if (targetStatus === "PAID") {
            await sendOrderEmail(fullOrder, "PAID");
          } else if (targetStatus === "SHIPPED") {
            await sendOrderEmail(fullOrder, "SHIPPED");
          } else if (targetStatus === "CANCELLED") {
            await sendOrderEmail(fullOrder, "CANCELLED");
          }
        }
      } catch (mailErr) {
        console.error("Admin order status email error:", mailErr);
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Admin update order error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
