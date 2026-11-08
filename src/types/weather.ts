export interface CityLocation {
  name: string;
  latitude: number;
  longitude: number;
  province?: string;
  description?: string;
}

export interface OpenMeteoDailyUnits {
  time: string;
  temperature_2m_max: string;
  temperature_2m_min: string;
  precipitation_probability_max: string;
  weathercode: string;
}

export interface OpenMeteoDailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  weathercode: number[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units?: OpenMeteoDailyUnits;
  daily?: OpenMeteoDailyData;
  error?: boolean;
  reason?: string;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  country?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms?: number;
}

export interface DailyForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
}

export interface WeatherForecastResult {
  cityName: string;
  latitude: number;
  longitude: number;
  days: DailyForecastDay[];
  maxRainProbability: number;
  hint: string;
  isAvailable: boolean;
  message?: string;
}
