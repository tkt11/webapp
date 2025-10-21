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
  gpt5_final_judgment?: GPT5FinalJudgment
}

export interface GPT5FinalJudgment {
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
  key_factors: {
    most_important: string[]
    supporting_data: string[]
    concerns: string[]
  }
  agreement_with_statistical_model: {
    agrees: boolean
    reason: string
  }
  risk_assessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH'
    description: string
  }
  recommendation: string
  data_sources_used: string[]
  
  // 新機能: GPT-5独自の価格予測
  price_predictions: {
    short_term: {
      day_3: { price: number; confidence: number }
      day_7: { price: number; confidence: number }
      day_14: { price: number; confidence: number }
    }
    mid_term: {
      day_30: { price: number; confidence: number }
      day_60: { price: number; confidence: number }
      day_90: { price: number; confidence: number }
    }
  }
  
  // 新機能: 最適な売買タイミング
  optimal_timing: {
    entry: {
      recommended_date: string
      price_range: { min: number; max: number }
      reasoning: string
    }
    exit: {
      recommended_date: string
      price_range: { min: number; max: number }
      reasoning: string
    }
    stop_loss: {
      price: number
      percentage: number
      reasoning: string
    }
  }
  
  // 新機能: ポートフォリオ配分提案
  portfolio_allocation: {
    conservative: { percentage: number; reasoning: string }
    moderate: { percentage: number; reasoning: string }
    aggressive: { percentage: number; reasoning: string }
  }
  
  // 新機能: シナリオ分析
  scenario_analysis: {
    best_case: {
      probability: number
      price_target: number
      timeframe: string
      conditions: string[]
    }
    base_case: {
      probability: number
      price_target: number
      timeframe: string
      conditions: string[]
    }
    worst_case: {
      probability: number
      price_target: number
      timeframe: string
      conditions: string[]
    }
  }
  
  // 新機能: 今後の重要イベント
  upcoming_events: Array<{
    date: string
    event: string
    expected_impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    description: string
  }>
  
  // GPT-5 Code Interpreterによる高度な統計計算結果（オプショナル）
  statistical_metrics?: {
    annual_volatility: number       // 年率ボラティリティ (%)
    sharpe_ratio: number            // シャープレシオ
    max_drawdown: number            // 最大ドローダウン (%)
    value_at_risk: number           // VaR (95%信頼区間での損失額)
  }
  
  // モンテカルロシミュレーション結果（オプショナル）
  monte_carlo_results?: {
    day_3_median?: number
    day_3_upper?: number
    day_3_lower?: number
    day_7_median?: number
    day_7_upper?: number
    day_7_lower?: number
    day_14_median?: number
    day_14_upper?: number
    day_14_lower?: number
    day_30_median?: number
    day_30_upper?: number
    day_30_lower?: number
    day_60_median?: number
    day_60_upper?: number
    day_60_lower?: number
    day_90_median: number
    day_90_upper: number
    day_90_lower: number
  }
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
