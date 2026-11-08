import type { CarSummary, RecommendResponse } from '../types';

/**
 * Calls the backend recommendation API (/api/recommend).
 * Sends the user's natural language query and available fleet summaries.
 * The backend securely invokes Gemini API via serverless function without exposing API keys.
 */
export const getRecommendations = async (
  query: string,
  cars: CarSummary[]
): Promise<RecommendResponse> => {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query.trim(),
      cars,
    }),
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
