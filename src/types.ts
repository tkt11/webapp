// 型定義ファイル

export interface TechnicalAnalysis {
  score: number
  sma20: number
  sma50: number
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  signals: string[]
  confidence: number
}

export interface FundamentalAnalysis {
  score: number
  pe_ratio: number | null
  pb_ratio: number | null
  roe: number | null
  eps: number | null
  dividend_yield: number | null
  market_cap: number | null
  signals: string[]
  confidence: number
}

export interface SentimentAnalysis {
  score: number
  sentiment: 'positive' | 'negative' | 'neutral'
  news_count: number
  positive_count?: number
  negative_count?: number
  neutral_count?: number
  news_examples?: Array<{
    headline: string
    source: string
    sentiment: string
    summary: string
    datetime: number
    date_formatted: string
  }>
  summary: string
  confidence: number
  gpt_insight?: string
}

export interface MacroAnalysis {
  score: number
  gdp_growth: number | null
  unemployment: number | null
  inflation: number | null
  interest_rate: number | null
  signals: string[]
  confidence: number
}

export interface AnalystRating {
  score: number
  consensus: 'BUY' | 'SELL' | 'HOLD' | null
  target_price: number | null
  current_price: number
  upside: number | null
  recommendation_count: number
  confidence: number
}

export interface PredictionResult {
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  score: number
  breakdown: {
    technical: number
    fundamental: number
    sentiment: number
    macro: number
    analyst: number
  }
  reasons: string[]
  risks: string[]
  target_price: number | null
  expected_return: number | null
  detailed_explanation?: string
}

export interface StockData {
  symbol: string
  name: string
  current_price: number
  currency: string
  exchange: string
  timestamp: string
  prices: number[]
  dates: string[]
}

export interface SimulationResult {
  summary: {
    purchaseDate: string
    purchasePrice: number
    sellDate: string
    sellPrice: number
    shares: number
    investmentAmount: number
    finalValue: number
    profit: number
    returnRate: number
    holdingPeriodDays: number
  }
  performance: Array<{
    date: string
    price: number
    portfolioValue: number
    unrealizedProfit: number
    returnRate: number
  }>
  statistics: {
    maxDrawdown: number
    volatility: number
    bestDay: { date: string; return: number }
    worstDay: { date: string; return: number }
  }
  visualization: {
    labels: string[]
    priceData: number[]
    portfolioData: number[]
    profitData: number[]
  }
}

export interface BacktestResult {
  testDate: string
  prediction: PredictionResult
  actualOutcome: {
    priceAtPrediction: number
    priceAfter1Week: number
    priceAfter1Month: number
    priceAfter3Months: number
    return1Week: number
    return1Month: number
    return3Months: number
  }
  accuracy: {
    direction1Week: 'correct' | 'incorrect' | 'neutral'
    direction1Month: 'correct' | 'incorrect' | 'neutral'
    direction3Months: 'correct' | 'incorrect' | 'neutral'
    overallScore: number
  }
}

export interface RecommendationItem {
  symbol: string
  name: string
  score: number
  action: 'BUY' | 'SELL' | 'HOLD'
  currentPrice: number
  targetPrice: number | null
  expectedReturn: number | null
  confidence: number
  sector: string
  reasons: string[]
}

export interface Env {
  ALPHA_VANTAGE_API_KEY: string
  FINNHUB_API_KEY: string
  FRED_API_KEY: string
  OPENAI_API_KEY: string
}
