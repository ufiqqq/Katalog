import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { destination, weight, courier } = await req.json();

    if (!destination || !courier) {
      return NextResponse.json({ error: "Missing required parameters (destination, courier)" }, { status: 400 });
    }

    const packageWeight = weight || 500; // default 500 grams
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    const origin = process.env.RAJAONGKIR_ORIGIN_CITY_ID || "419"; // default Sidoarjo (ID 419)

    if (!apiKey) {
      console.log(`RajaOngkir API Key not set. Simulating mock cost for courier ${courier} to destination ${destination}.`);
      
      // Dynamic mock generation based on courier and destination ID to make it feel alive!
      let services = [];
      const multiplier = (Number(destination) % 5) + 1; // variation based on city ID

      if (courier === "jne") {
        services = [
          { service: "OKE", description: "Ongkos Kirim Ekonomis", cost: 10000 + multiplier * 2000, etd: "3-4 HARI" },
          { service: "REG", description: "Layanan Reguler", cost: 13000 + multiplier * 2000, etd: "2-3 HARI" },
          { service: "YES", description: "Yakin Esok Sampai", cost: 25000 + multiplier * 3000, etd: "1 HARI" },
        ];
      } else if (courier === "pos") {
        services = [
          { service: "SDR", description: "Pos Sameday", cost: 30000 + multiplier * 4000, etd: "1 HARI" },
          { service: "KHP", description: "Pos Kilat Khusus", cost: 12000 + multiplier * 1500, etd: "2-4 HARI" },
        ];
      } else if (courier === "tiki") {
        services = [
          { service: "ECO", description: "Economy Service", cost: 9000 + multiplier * 2000, etd: "4-5 HARI" },
          { service: "REG", description: "Regular Service", cost: 14000 + multiplier * 2000, etd: "2-3 HARI" },
          { service: "ONS", description: "Over Night Service", cost: 26000 + multiplier * 3000, etd: "1 HARI" },
        ];
      } else {
        services = [
          { service: "REG", description: "Regular Service", cost: 15000, etd: "2-3 HARI" }
        ];
      }

      return NextResponse.json({
        courier,
        results: [{
          code: courier,
          name: courier === "jne" ? "JNE Express" : courier === "pos" ? "POS Indonesia" : "TIKI",
          costs: services.map(s => ({
            service: s.service,
            description: s.description,
            cost: [{ value: s.cost, etd: s.etd, note: "" }]
          }))
        }]
      });
    }

    // Call real RajaOngkir API
    const res = await fetch("https://api.rajaongkir.com/starter/cost", {
      method: "POST",
      headers: {
        key: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin,
        destination,
        weight: packageWeight,
        courier,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("RajaOngkir API Cost Error:", errText);
      return NextResponse.json({ error: "Failed to fetch cost from RajaOngkir" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      courier,
      results: data.rajaongkir.results,
    });
  } catch (error) {
    console.error("Calculate shipping cost error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
