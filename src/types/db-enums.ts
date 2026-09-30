export enum Role {
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}

export enum OrderStatus {
  PENDING = "PENDING",      // Menunggu pembayaran
  PAID = "PAID",            // Sudah dibayar
  PROCESSING = "PROCESSING", // Diproses admin
  SHIPPED = "SHIPPED",      // Sedang dikirim
  COMPLETED = "COMPLETED",   // Selesai
  CANCELLED = "CANCELLED",   // Dibatalkan
}
