import type {
  OpenMeteoForecastResponse,
  GeocodingResponse,
  GeocodingResult,
  WeatherForecastResult,
  DailyForecastDay,
  CityLocation,
} from '../types';

/**
 * Maps WMO Weather interpretation codes to Indonesian descriptions and icons.
 * Reference: https://open-meteo.com/en/docs
 */
export const getWeatherDetailsByCode = (
  code: number
): { description: string; icon: string } => {
  switch (code) {
    case 0:
      return { description: 'Cerah', icon: '☀️' };
    case 1:
      return { description: 'Sebagian Besar Cerah', icon: '🌤️' };
    case 2:
      return { description: 'Cerah Berawan', icon: '⛅' };
    case 3:
      return { description: 'Mendung', icon: '☁️' };
    case 45:
    case 48:
      return { description: 'Berkabut', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { description: 'Gerimis', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { description: 'Hujan', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { description: 'Hujan Salju Ringan', icon: '🌨️' };
    case 80:
    case 81:
    case 82:
      return { description: 'Hujan Deras / Showers', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { description: 'Hujan Disertai Petir', icon: '⛈️' };
    default:
      return { description: 'Cerah Berawan', icon: '⛅' };
  }
};

/**
 * Generates an advisory hint based on rain probability and car category.
 */
export const generateWeatherHint = (
  maxRainProbability: number,
  carCategory?: string
): string => {
  const isSuv = carCategory?.toLowerCase().includes('suv');

  if (maxRainProbability >= 60) {
    if (isSuv) {
      return `Peluang hujan tinggi (${maxRainProbability}%). Mobil SUV ini sangat ideal dengan ground clearance tinggi untuk kondisi jalan basah atau berair.`;
    }
    return `Peluang hujan tinggi (${maxRainProbability}%). Disarankan berhati-hati atau mempertimbangkan mobil bertipe SUV dengan ground clearance lebih tinggi.`;
  }

  if (maxRainProbability >= 35) {
    return `Peluang hujan sedang (${maxRainProbability}%). Kondisi jalanan umumnya baik, periksa kembali kelengkapan wiper sebelum bepergian.`;
  }

  return `Prakiraan cuaca cerah/kondusif dengan peluang hujan rendah (${maxRainProbability}%). Sangat nyaman untuk seluruh tipe kendaraan.`;
};

/**
 * Fetches daily weather forecast from Open-Meteo API.
 * Gracefully handles loading, network errors, and date ranges outside the 14-16 day forecast horizon.
 */
export const getDailyForecast = async (
  latitude: number,
  longitude: number,
  startDate?: string,
  endDate?: string,
  cityName = 'Kota Terpilih',
  carCategory?: string
): Promise<WeatherForecastResult> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Open-Meteo free forecast horizon is typically up to 16 days ahead
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 14) {
        return {
          cityName,
          latitude,
          longitude,
          days: [],
          maxRainProbability: 0,
          hint: 'Prakiraan cuaca hanya tersedia untuk jadwal dalam 14 hari ke depan.',
          isAvailable: false,
          message: 'Tanggal perjalanan lebih dari 14 hari ke depan, prakiraan cuaca belum tersedia.',
        };
      }
    }

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode',
      timezone: 'auto',
    });

    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errorJson = (await res.json().catch(() => null)) as OpenMeteoForecastResponse | null;
      const isDateRangeError = errorJson?.reason?.toLowerCase().includes('range') || res.status === 400;

      return {
        cityName,
        latitude,
        longitude,
        days: [],
        maxRainProbability: 0,
        hint: isDateRangeError
          ? 'Prakiraan cuaca detail hanya tersedia untuk tanggal dalam 14 hari ke depan.'
          : 'Prakiraan cuaca sedang tidak dapat dijangkau saat ini.',
        isAvailable: false,
        message: errorJson?.reason || 'Layanan prakiraan cuaca sedang tidak tersedia untuk rentang tanggal ini.',
      };
    }

    const data = (await res.json()) as OpenMeteoForecastResponse;

    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      return {
        cityName,
        latitude,
        longitude,
        days: [],
        maxRainProbability: 0,
        hint: 'Data prakiraan cuaca tidak ditemukan untuk tanggal tersebut.',
        isAvailable: false,
        message: 'Tidak ada data prakiraan untuk rentang tanggal yang dipilih.',
      };
    }

    const days: DailyForecastDay[] = data.daily.time.map((dateStr, idx) => {
      const code = data.daily?.weathercode?.[idx] ?? 0;
      const { description, icon } = getWeatherDetailsByCode(code);
      return {
        date: dateStr,
        tempMax: Math.round(data.daily?.temperature_2m_max?.[idx] ?? 30),
        tempMin: Math.round(data.daily?.temperature_2m_min?.[idx] ?? 23),
        precipitationProbability: Math.round(
          data.daily?.precipitation_probability_max?.[idx] ?? 0
        ),
        weatherCode: code,
        weatherDescription: description,
        weatherIcon: icon,
      };
    });

    const maxRain = days.reduce(
      (max, day) => (day.precipitationProbability > max ? day.precipitationProbability : max),
      0
    );

    const hint = generateWeatherHint(maxRain, carCategory);

    return {
      cityName,
      latitude,
      longitude,
      days,
      maxRainProbability: maxRain,
      hint,
      isAvailable: true,
    };
  } catch (err) {
    console.error('Weather forecast fetch failed:', err);
    return {
      cityName,
      latitude,
      longitude,
      days: [],
      maxRainProbability: 0,
      hint: 'Tidak dapat memuat informasi cuaca. Perjalanan tetap dapat dilanjutkan.',
      isAvailable: false,
      message: 'Gagal menghubungi server Open-Meteo. Silakan periksa koneksi internet Anda.',
    };
  }
};

/**
 * Generates a concise weather summary string for a specific city for the next 3 days,
 * used as context for the AI Advisor prompt (max 300 characters).
 */
export const getWeatherSummaryForCity = async (
  city: CityLocation,
  daysCount = 3
): Promise<string> => {
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    const future = new Date(today);
    future.setDate(future.getDate() + (daysCount - 1));
    const endDate = future.toISOString().split('T')[0];

    const forecast = await getDailyForecast(
      city.latitude,
      city.longitude,
      startDate,
      endDate,
      city.name
    );

    if (!forecast.isAvailable || forecast.days.length === 0) {
      return `Prakiraan cuaca ${city.name}: Umumnya tropis dengan potensi hujan lokal.`;
    }

    const firstDay = forecast.days[0];
    const condition = firstDay.weatherDescription;
    const maxRain = forecast.maxRainProbability;
    const tempRange = `${firstDay.tempMin}-${firstDay.tempMax}°C`;

    return `Cuaca ${city.name} (${daysCount} hari ke depan): ${condition}, peluang hujan maks ${maxRain}%, suhu ${tempRange}. ${forecast.hint}`.substring(
      0,
      300
    );
  } catch {
    return `Cuaca ${city.name}: Umumnya tropis dan potensi hujan lokal di Sulawesi Utara.`;
  }
};

/**
 * Searches city coordinates using Open-Meteo free Geocoding API.
 */
export const searchCityGeocoding = async (
  cityName: string
): Promise<GeocodingResult[]> => {
  if (!cityName.trim()) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName.trim()
      )}&count=5&language=id&format=json`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as GeocodingResponse;
    return data.results || [];
  } catch (err) {
    console.error('Geocoding search failed:', err);
    return [];
  }
};

export const weatherService = {
  getDailyForecast,
  getWeatherDetailsByCode,
  generateWeatherHint,
  getWeatherSummaryForCity,
  searchCityGeocoding,
};

export default weatherService;
