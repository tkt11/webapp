/**
 * Cloudflare Workers Environment Variables
 */

export interface Env {
  // API Keys
  ALPHA_VANTAGE_API_KEY: string;
  FINNHUB_API_KEY: string;
  OPENAI_API_KEY: string;
  FRED_API_KEY: string;
  
  // ML API
  ML_API_URL: string;
}
