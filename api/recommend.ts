import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CarSummaryInput {
  id: string;
  brand: string;
  model: string;
  category: string;
  seats: number;
  transmission: string;
  fuelType: string;
  pricePerDay: number;
  available: boolean;
}

interface RequestPayload {
  query?: unknown;
  cars?: unknown;
  weather?: unknown;
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

// Known car brand names used for safety-net filtering in summary text
const KNOWN_CAR_BRANDS = [
  'toyota',
  'honda',
  'mitsubishi',
  'daihatsu',
  'suzuki',
  'hyundai',
  'nissan',
  'mazda',
  'wuling',
  'ford',
  'chevrolet',
  'bmw',
  'mercedes',
  'audi',
  'porsche',
  'ferrari',
  'tesla',
  'kia',
  'isuzu',
  'volkswagen',
  'chery',
  'byd',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Method validation (HTTP 405)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed. Only POST requests are supported.',
    });
  }

  // 2. Environment configuration validation (HTTP 500)
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server configuration error: GEMINI_API_KEY is not configured on the server.',
    });
  }

  // 3. Payload validation (HTTP 400)
  const body = req.body as RequestPayload;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      error: 'Invalid request body. JSON object expected.',
    });
  }

  const { query, cars, weather } = body;

  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({
      error: 'Parameter "query" is required and must be a non-empty string.',
    });
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 300) {
    return res.status(400).json({
      error: 'Parameter "query" exceeds maximum allowed length of 300 characters.',
    });
  }

  // Optional weather field validation
  let trimmedWeather = '';
  if (weather !== undefined && weather !== null) {
    if (typeof weather !== 'string') {
      return res.status(400).json({
        error: 'Parameter "weather" must be a string with a maximum of 300 characters.',
      });
    }
    trimmedWeather = weather.trim();
    if (trimmedWeather.length > 300) {
      return res.status(400).json({
        error: 'Parameter "weather" exceeds maximum allowed length of 300 characters.',
      });
    }
  }

  if (!Array.isArray(cars) || cars.length === 0) {
    return res.status(400).json({
      error: 'Parameter "cars" is required and must be a non-empty array of vehicles.',
    });
  }

  if (cars.length > 50) {
    return res.status(400).json({
      error: 'Parameter "cars" exceeds the maximum allowed limit of 50 vehicles.',
    });
  }

  // Basic validation on car items
  const validCars: CarSummaryInput[] = [];
  for (const item of cars) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as CarSummaryInput).id === 'string' &&
      typeof (item as CarSummaryInput).brand === 'string' &&
      typeof (item as CarSummaryInput).model === 'string'
    ) {
      validCars.push(item as CarSummaryInput);
    }
  }

  if (validCars.length === 0) {
    return res.status(400).json({
      error: 'No valid vehicle records found in the "cars" array.',
    });
  }

  // Set of valid car IDs and brands for strict response validation
  const validCarIdMap = new Map<string, CarSummaryInput>();
  validCars.forEach((c) => validCarIdMap.set(c.id, c));

  // 4. Build prompt in Indonesian
  const carsCatalogText = validCars
    .map(
      (c) =>
        `- ID: "${c.id}" | ${c.brand} ${c.model} | Kategori: ${c.category} | Kapasitas: ${c.seats} kursi | Transmisi: ${c.transmission} | Bahan Bakar: ${c.fuelType} | Tarif: Rp ${Number(c.pricePerDay).toLocaleString('id-ID')}/hari | Tersedia: ${c.available ? 'Ya' : 'Tidak'}`
    )
    .join('\n');

  const weatherSection = trimmedWeather
    ? `\nKONDISI CUACA DESTINASI (KONTEKS TAMBAHAN):\n"${trimmedWeather}"\n(Pertimbangkan kondisi cuaca ini dalam memilih kendaraan yang tepat, misalnya mobil berground clearance tinggi atau SUV jika cuaca hujan/licin, namun tetap WAJIB HANYA merekomendasikan mobil yang tertera pada daftar di bawah ini.)\n`
    : '';

  const systemPrompt = `Anda adalah penasihat rental mobil profesional, ramah, dan berpengalaman.
Tugas Anda adalah memberikan rekomendasi mobil terbaik untuk pelanggan berdasarkan kebutuhan perjalanan mereka.

PERATURAN KETAT:
1. Anda HANYA BOLEH merekomendasikan mobil yang ADA di dalam DAFTAR MOBIL YANG TERSEDIA di bawah ini.
2. DILARANG KERAS mengarang, menambahkan mobil fiktif, mengubah spesifikasi, atau memodifikasi harga.
3. Berikan MAKSIMAL 3 mobil terbaik yang paling cocok dengan kebutuhan pelanggan.
4. Nilai parameter "carId" HARUS persis sama dengan salah satu ID mobil dalam daftar.
5. ATURAN SUMMARY: Teks pada field "summary" HANYA BOLEH menyebutkan nama mobil/merek yang BENAR-BENAR ADA di dalam DAFTAR MOBIL YANG TERSEDIA. DILARANG KERAS menyebutkan nama merek atau model kendaraan lain di luar daftar pada summary.
6. ATURAN REASON: Setiap penjelasan pada field "reason" HANYA BOLEH menggunakan atribut yang tercantum pada data mobil (category, seats, transmission, fuelType, pricePerDay). DILARANG KERAS mengarang spesifikasi tambahan yang tidak tertulis (seperti kapasitas bagasi dalam liter, tenaga HP/tenaga kuda, sistem penggerak roda AWD/4WD jika tidak disebutkan, dsb).
7. Jika tidak ada mobil yang cocok dengan kebutuhan pengguna, kembalikan array "recommendations" kosong dan berikan penjelasan ramah pada "summary".
8. Output HARUS berupa JSON valid dengan skema berikut:
{
  "recommendations": [
    {
      "carId": "string ID dari daftar",
      "reason": "Penjelasan ringkas dalam bahasa Indonesia mengapa mobil ini cocok hanya berdasarkan data atribut mobil yang ada"
    }
  ],
  "summary": "Ringkasan saran umum yang ramah dan membantu untuk pengguna dalam bahasa Indonesia, hanya menyebutkan mobil dari daftar yang disediakan"
}
${weatherSection}
DAFTAR MOBIL YANG TERSEDIA:
${carsCatalogText}

PERTANYAAN / KEBUTUHAN PELANGGAN:
"${trimmedQuery}"`;

  // 5. Call Gemini API via REST fetch
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API upstream error:', response.status, errorText);
      return res.status(502).json({
        error: `Upstream AI service error (${response.status}). Please verify GEMINI_API_KEY and model availability.`,
      });
    }

    const data = (await response.json()) as GeminiResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error('Gemini API returned empty text parts:', JSON.stringify(data));
      return res.status(502).json({
        error: 'Upstream AI service returned an empty or invalid response.',
      });
    }

    // 6. Safe JSON parse
    let parsed: {
      recommendations?: Array<{ carId?: unknown; reason?: unknown }>;
      summary?: unknown;
    };

    try {
      parsed = JSON.parse(rawText.trim());
    } catch (parseErr) {
      console.error('Failed to parse Gemini output as JSON:', rawText, parseErr);
      return res.status(502).json({
        error: 'Failed to parse AI response into structured format.',
      });
    }

    // 7. Validate and filter recommendations: drop any carId that is NOT in the provided list
    const validatedRecommendations: Array<{ carId: string; reason: string }> = [];

    if (Array.isArray(parsed.recommendations)) {
      for (const rec of parsed.recommendations) {
        if (
          rec &&
          typeof rec.carId === 'string' &&
          validCarIdMap.has(rec.carId) &&
          typeof rec.reason === 'string' &&
          rec.reason.trim()
        ) {
          // Avoid duplicate carId in recommendations
          if (!validatedRecommendations.some((r) => r.carId === rec.carId)) {
            validatedRecommendations.push({
              carId: rec.carId,
              reason: rec.reason.trim(),
            });
          }
        }
      }
    }

    // Max 3 recommendations
    const finalRecommendations = validatedRecommendations.slice(0, 3);

    let summaryText =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'Berikut adalah rekomendasi kendaraan terbaik yang kami pilihkan untuk perjalanan Anda.';

    // 8. Safety net for summary: Remove sentences that mention brands/models not in the provided list
    const disallowedBrands = KNOWN_CAR_BRANDS.filter(
      (brand) => !validCars.some((c) => c.brand.toLowerCase().includes(brand))
    );

    if (disallowedBrands.length > 0) {
      // Split into sentences
      const sentences = summaryText.split(/(?<=[.!?])\s+/);
      const filteredSentences = sentences.filter((sentence) => {
        const sentenceLower = sentence.toLowerCase();
        // Check if sentence mentions any disallowed brand
        return !disallowedBrands.some((badBrand) => {
          const regex = new RegExp(`\\b${badBrand}\\b`, 'i');
          return regex.test(sentenceLower);
        });
      });

      if (filteredSentences.length > 0) {
        summaryText = filteredSentences.join(' ').trim();
      } else {
        summaryText = 'Berikut adalah rekomendasi kendaraan terbaik yang kami pilihkan untuk perjalanan Anda.';
      }
    }

    return res.status(200).json({
      recommendations: finalRecommendations,
      summary: summaryText,
    });
  } catch (err) {
    console.error('Unexpected error in /api/recommend handler:', err);
    return res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Internal server error while processing AI recommendation.',
    });
  }
}
