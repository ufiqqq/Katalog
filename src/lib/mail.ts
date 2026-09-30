import nodemailer from "nodemailer";

interface MailOrderItem {
  variant?: {
    size?: string;
    product?: {
      name: string;
    } | null;
  } | null;
  quantity: number;
  price: number;
}

interface MailOrder {
  id: string;
  totalAmount: number;
  shippingResi?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  items?: MailOrderItem[];
}

export async function sendOrderEmail(order: MailOrder, type: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED") {
  // Try to read SMTP settings from environment
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "noreply@oos-streetwear.com";

  const orderUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard`;

  let subject = "";
  let html = "";

  const itemsHtml = order.items && order.items.length > 0
    ? order.items.map((item: MailOrderItem) => {
        const productName = item.variant?.product?.name || "Product Item";
        const size = item.variant?.size || "";
        return `<li>${productName} (Size: ${size}) x ${item.quantity} - Rp ${item.price.toLocaleString("id-ID")}</li>`;
      }).join("")
    : "<li>Tidak ada produk</li>";

  const totalStr = `Rp ${order.totalAmount.toLocaleString("id-ID")}`;

  switch (type) {
    case "PENDING":
      subject = `[OOs Streetwear] Pesanan Baru #${order.id} Menunggu Pembayaran`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0;">
          <h2 style="text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #000; padding-bottom: 10px;">OOs STREETWEAR</h2>
          <h1 style="font-size: 20px; font-weight: bold; margin-top: 20px;">Terima Kasih Atas Pesanan Anda!</h1>
          <p>Pesanan Anda dengan ID <strong>#${order.id}</strong> telah berhasil dibuat.</p>
          <p><strong>Detail Pesanan:</strong></p>
          <ul>${itemsHtml}</ul>
          <p>Total Pembayaran (termasuk ongkir): <strong>${totalStr}</strong></p>
          <p>Silakan selesaikan pembayaran Anda melalui Midtrans Snap di halaman checkout.</p>
          <p>Pantau status pesanan Anda di <a href="${orderUrl}" style="color: #000; font-weight: bold; text-decoration: underline;">Dashboard Anda</a>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">OOs Streetwear MVP © 2026</p>
        </div>
      `;
      break;
    case "PAID":
      subject = `[OOs Streetwear] Pembayaran Sukses untuk Pesanan #${order.id}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0;">
          <h2 style="text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #000; padding-bottom: 10px;">OOs STREETWEAR</h2>
          <h1 style="font-size: 20px; font-weight: bold; margin-top: 20px; color: #10b981;">Pembayaran Diterima!</h1>
          <p>Pembayaran untuk pesanan <strong>#${order.id}</strong> telah kami terima.</p>
          <p>Kami sedang menyiapkan produk Anda untuk segera dikirim.</p>
          <p><strong>Detail Pesanan:</strong></p>
          <ul>${itemsHtml}</ul>
          <p>Total: <strong>${totalStr}</strong></p>
          <p>Terima kasih telah berbelanja di OOs Streetwear!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">OOs Streetwear MVP © 2026</p>
        </div>
      `;
      break;
    case "SHIPPED":
      subject = `[OOs Streetwear] Pesanan #${order.id} Telah Dikirim!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0;">
          <h2 style="text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #000; padding-bottom: 10px;">OOs STREETWEAR</h2>
          <h1 style="font-size: 20px; font-weight: bold; margin-top: 20px; color: #3b82f6;">Pesanan Anda Dalam Perjalanan!</h1>
          <p>Pesanan <strong>#${order.id}</strong> telah diserahkan ke kurir pengiriman.</p>
          <p>Nomor Resi Pengiriman Anda: <strong style="font-size: 16px; letter-spacing: 0.05em; background-color: #f3f4f6; padding: 4px 8px; border: 1px solid #e5e7eb;">${order.shippingResi || "-"}</strong></p>
          <p>Silakan pantau status pengiriman menggunakan nomor resi tersebut di kurir terkait.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">OOs Streetwear MVP © 2026</p>
        </div>
      `;
      break;
    case "CANCELLED":
      subject = `[OOs Streetwear] Pesanan #${order.id} Dibatalkan`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0;">
          <h2 style="text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #000; padding-bottom: 10px;">OOs STREETWEAR</h2>
          <h1 style="font-size: 20px; font-weight: bold; margin-top: 20px; color: #ef4444;">Pesanan Dibatalkan</h1>
          <p>Pesanan Anda dengan ID <strong>#${order.id}</strong> telah dibatalkan atau kedaluwarsa karena tidak diselesaikan pembayarannya.</p>
          <p>Jika ini adalah kesalahan atau Anda ingin memesan kembali, silakan kunjungi katalog kami di website.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">OOs Streetwear MVP © 2026</p>
        </div>
      `;
      break;
  }

  const recipientEmail = order.user?.email || "customer@example.com";

  if (!host || !user || !pass) {
    console.log(`=== [MOCK EMAIL SENT (SMTP NOT CONFIGURED)] ===`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (Plain Text):\n`, html.replace(/<[^>]*>/g, "").trim());
    console.log(`===============================================`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: port === "465",
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: recipientEmail,
      subject,
      html,
    });
    console.log(`Email successfully sent to ${recipientEmail} for order ${order.id} (${type})`);
  } catch (error) {
    console.error(`Failed to send email to ${recipientEmail}:`, error);
  }
}
