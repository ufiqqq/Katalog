import { NextResponse } from "next/server";

const MOCK_CITIES: { [provinceId: string]: { city_id: string; city_name: string; type: string }[] } = {
  "6": [
    { city_id: "151", city_name: "Jakarta Barat", type: "Kota" },
    { city_id: "152", city_name: "Jakarta Pusat", type: "Kota" },
    { city_id: "153", city_name: "Jakarta Selatan", type: "Kota" },
    { city_id: "154", city_name: "Jakarta Timur", type: "Kota" },
    { city_id: "155", city_name: "Jakarta Utara", type: "Kota" },
  ],
  "9": [
    { city_id: "23", city_name: "Bandung", type: "Kabupaten" },
    { city_id: "24", city_name: "Bandung", type: "Kota" },
    { city_id: "78", city_name: "Bogor", type: "Kota" },
    { city_id: "115", city_name: "Depok", type: "Kota" },
    { city_id: "54", city_name: "Bekasi", type: "Kota" },
  ],
  "10": [
    { city_id: "399", city_name: "Semarang", type: "Kota" },
    { city_id: "427", city_name: "Surakarta", type: "Kota" },
    { city_id: "249", city_name: "Magelang", type: "Kota" },
  ],
  "11": [
    { city_id: "444", city_name: "Surabaya", type: "Kota" },
    { city_id: "419", city_name: "Sidoarjo", type: "Kabupaten" },
    { city_id: "255", city_name: "Malang", type: "Kota" },
    { city_id: "222", city_name: "Kediri", type: "Kota" },
  ],
  "3": [
    { city_id: "457", city_name: "Tangerang", type: "Kota" },
    { city_id: "458", city_name: "Tangerang Selatan", type: "Kota" },
    { city_id: "392", city_name: "Serang", type: "Kota" },
    { city_id: "106", city_name: "Cilegon", type: "Kota" },
  ],
  "5": [
    { city_id: "501", city_name: "Yogyakarta", type: "Kota" },
    { city_id: "418", city_name: "Sleman", type: "Kabupaten" },
    { city_id: "39", city_name: "Bantul", type: "Kabupaten" },
  ],
  "2": [
    { city_id: "114", city_name: "Denpasar", type: "Kota" },
    { city_id: "32", city_name: "Badung", type: "Kabupaten" },
  ],
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provinceId = searchParams.get("provinceId");

    if (!provinceId) {
      return NextResponse.json({ error: "Missing provinceId parameter" }, { status: 400 });
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;

    if (!apiKey) {
      console.log(`RajaOngkir API Key not set. Returning mock cities for province ${provinceId}.`);
      const cities = MOCK_CITIES[provinceId] || [];
      return NextResponse.json(cities);
    }

    const res = await fetch(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
      method: "GET",
      headers: {
        key: apiKey,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("RajaOngkir API Error:", errText);
      return NextResponse.json({ error: "Failed to fetch cities from RajaOngkir" }, { status: res.status });
    }

    const data = await res.json();
    const cities = data.rajaongkir.results.map((c: { city_id: string; city_name: string; type: string }) => ({
      city_id: c.city_id,
      city_name: c.city_name,
      type: c.type,
    }));

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Fetch cities error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
