import { NextResponse } from "next/server";

const MOCK_PROVINCES = [
  { province_id: "6", province: "DKI Jakarta" },
  { province_id: "9", province: "Jawa Barat" },
  { province_id: "10", province: "Jawa Tengah" },
  { province_id: "11", province: "Jawa Timur" },
  { province_id: "3", province: "Banten" },
  { province_id: "5", province: "DI Yogyakarta" },
  { province_id: "2", province: "Bali" },
];

export async function GET() {
  try {
    const apiKey = process.env.RAJAONGKIR_API_KEY;

    if (!apiKey) {
      console.log("RajaOngkir API Key not set. Returning mock provinces.");
      return NextResponse.json(MOCK_PROVINCES);
    }

    const res = await fetch("https://api.rajaongkir.com/starter/province", {
      method: "GET",
      headers: {
        key: apiKey,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("RajaOngkir API Error:", errText);
      return NextResponse.json({ error: "Failed to fetch provinces from RajaOngkir" }, { status: res.status });
    }

    const data = await res.json();
    const provinces = data.rajaongkir.results.map((p: { province_id: string; province: string }) => ({
      province_id: p.province_id,
      province: p.province,
    }));

    return NextResponse.json(provinces);
  } catch (error) {
    console.error("Fetch provinces error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
