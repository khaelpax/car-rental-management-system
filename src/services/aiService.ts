import type { CarSummary, RecommendResponse } from '../types';

/**
 * Calls the backend recommendation API (/api/recommend).
 * Sends the user's natural language query, available fleet summaries,
 * and optional weather context.
 * The backend securely invokes Gemini API via serverless function without exposing API keys.
 */
export const getRecommendations = async (
  query: string,
  cars: CarSummary[],
  weather?: string
): Promise<RecommendResponse> => {
  const payload: { query: string; cars: CarSummary[]; weather?: string } = {
    query: query.trim(),
    cars,
  };

  if (weather && weather.trim()) {
    payload.weather = weather.trim().substring(0, 300);
  }

  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody?.error || `Recommendation request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as RecommendResponse;
};

export const aiService = {
  getRecommendations,
};

export default aiService;
