/**
 * ランキングサービス
 * 
 * NASDAQ-100銘柄のランキング機能を提供
 */

import { NASDAQ_100_SYMBOLS, DEMO_MODE, DEMO_SYMBOLS_LIMIT } from './symbols'
import { cache, CACHE_TTL, generateCacheKey, getCachedData } from './cache'
import {
  LightAnalysis,
  HighGrowthScore,
  ShortTermScore,
  TrendingScore,
  RecommendedScore,
  RankingResponse
} from '../types'

/**
 * 軽量スクリーニング
 * 
 * GPT-5を使わずに統計モデルのみで事前選定
 * 600銘柄 → 100銘柄（NASDAQ-100）
 */
export async function lightweightScreening(
  symbols: string[],
  apiKeys: { alphaVantage: string; finnhub: string }
): Promise<LightAnalysis[]> {
  console.log(`Starting lightweight screening for ${symbols.length} symbols...`)
  
  const results: LightAnalysis[] = []
  
  // レート制限対策: 70銘柄ずつバッチ処理（デモモードでは一括処理）
  const batchSize = DEMO_MODE ? symbols.length : 70
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map(symbol => analyzeLightweight(symbol, apiKeys))
    )
    
    results.push(...batchResults.filter(r => r !== null) as LightAnalysis[])
    
    // 次のバッチまで1分待機（Alpha Vantage: 75 req/min）
    // デモモードではスキップ
    if (!DEMO_MODE && i + batchSize < symbols.length) {
      console.log(`Completed ${i + batchSize}/${symbols.length}, waiting 60s...`)
      await sleep(60000)
    }
  }
  
  console.log(`Lightweight screening completed: ${results.length} symbols`)
  return results
}

/**
 * 単一銘柄の軽量分析
 */
async function analyzeLightweight(
  symbol: string,
  apiKeys: { alphaVantage: string; finnhub: string }
): Promise<LightAnalysis | null> {
  try {
    // キャッシュチェック
    const cacheKey = generateCacheKey('light_analysis', symbol)
    const cached = cache.get<LightAnalysis>(cacheKey)
    if (cached) {
      return cached
    }
    
    // 並列でデータ取得
    const [quote, technical, fundamental, sentiment] = await Promise.all([
      getQuoteData(symbol, apiKeys.finnhub),
      getTechnicalScore(symbol, apiKeys.alphaVantage),
      getFundamentalScore(symbol, apiKeys.finnhub),
      getSentimentScore(symbol, apiKeys.alphaVantage)
    ])
    
    if (!quote) {
      return null
    }
    
    // 予備スコア計算（nullチェック）
    const preliminaryScore = (
      (technical || 50) * 0.30 +
      (fundamental || 50) * 0.35 +
      (sentiment || 50) * 0.20 +
      50 * 0.15  // デフォルトの信頼度
    )
    
    const analysis: LightAnalysis = {
      symbol,
      technicalScore: technical || 50,
      fundamentalScore: fundamental || 50,
      sentimentScore: sentiment || 50,
      preliminaryScore,
      currentPrice: quote.price
    }
    
    // キャッシュに保存
    cache.set(cacheKey, analysis, CACHE_TTL.LIGHT_ANALYSIS)
    
    return analysis
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error)
    return null
  }
}

/**
 * 株価取得
 */
async function getQuoteData(symbol: string, apiKey: string): Promise<{ price: number } | null> {
  try {
    const cacheKey = generateCacheKey('quote', symbol)
    return await getCachedData(cacheKey, CACHE_TTL.REALTIME_QUOTE, async () => {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
      )
      const data = await response.json()
      
      if (data.c) {
        return { price: data.c }
      }
      return null
    })
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error)
    return null
  }
}

/**
 * テクニカルスコア計算（簡易版）
 */
async function getTechnicalScore(symbol: string, apiKey: string): Promise<number> {
  try {
    const cacheKey = generateCacheKey('technical_score', symbol)
    return await getCachedData(cacheKey, CACHE_TTL.DAILY_PRICE, async () => {
      // 日次データ取得
      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`
      )
      const data = await response.json()
      
      if (!data['Time Series (Daily)']) {
        return 50  // デフォルト
      }
      
      const prices = Object.values(data['Time Series (Daily)'])
        .slice(0, 50)
        .map((day: any) => parseFloat(day['4. close']))
      
      // 簡易テクニカル分析
      const sma20 = prices.slice(0, 20).reduce((a, b) => a + b, 0) / 20
      const sma50 = prices.reduce((a, b) => a + b, 0) / 50
      const currentPrice = prices[0]
      
      let score = 50  // ベーススコア
      
      // 移動平均クロス
      if (currentPrice > sma20 && sma20 > sma50) {
        score += 30  // 強気
      } else if (currentPrice > sma50) {
        score += 15  // 中立的
      }
      
      // トレンド強度
      const trendStrength = (currentPrice - prices[prices.length - 1]) / prices[prices.length - 1]
      if (trendStrength > 0.1) {
        score += 20  // 強い上昇トレンド
      } else if (trendStrength > 0) {
        score += 10
      }
      
      return Math.min(Math.max(score, 0), 100)
    })
  } catch (error) {
    console.error(`Error calculating technical score for ${symbol}:`, error)
    return 50
  }
}

/**
 * ファンダメンタルスコア計算
 */
async function getFundamentalScore(symbol: string, apiKey: string): Promise<number> {
  try {
    const cacheKey = generateCacheKey('fundamental_score', symbol)
    return await getCachedData(cacheKey, CACHE_TTL.FUNDAMENTAL, async () => {
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`
      )
      const data = await response.json()
      
      if (!data.metric) {
        return 50
      }
      
      let score = 50
      const metrics = data.metric
      
      // ROE
      if (metrics.roeTTM && metrics.roeTTM > 15) {
        score += 20
      } else if (metrics.roeTTM && metrics.roeTTM > 10) {
        score += 10
      }
      
      // 営業利益率
      if (metrics.operatingMarginTTM && metrics.operatingMarginTTM > 20) {
        score += 20
      } else if (metrics.operatingMarginTTM && metrics.operatingMarginTTM > 10) {
        score += 10
      }
      
      // 売上成長率
      if (metrics.revenueGrowthTTMYoy && metrics.revenueGrowthTTMYoy > 20) {
        score += 10
      }
      
      return Math.min(Math.max(score, 0), 100)
    })
  } catch (error) {
    console.error(`Error calculating fundamental score for ${symbol}:`, error)
    return 50
  }
}

/**
 * センチメントスコア計算
 */
async function getSentimentScore(symbol: string, apiKey: string): Promise<number> {
  try {
    const cacheKey = generateCacheKey('sentiment_score', symbol)
    return await getCachedData(cacheKey, CACHE_TTL.NEWS, async () => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const timeFrom = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '') + 'T0000'
      
      const response = await fetch(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&time_from=${timeFrom}&apikey=${apiKey}&limit=50`
      )
      const data = await response.json()
      
      if (!data.feed || data.feed.length === 0) {
        return 50
      }
      
      // センチメント分析
      const sentiments = data.feed
        .map((article: any) => {
          const tickerSentiment = article.ticker_sentiment?.find((t: any) => t.ticker === symbol)
          return tickerSentiment?.ticker_sentiment_score || 0
        })
        .filter((score: number) => score !== 0)
      
      if (sentiments.length === 0) {
        return 50
      }
      
      const avgSentiment = sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length
      
      // -1～1 を 0～100 にマッピング
      return ((avgSentiment + 1) / 2) * 100
    })
  } catch (error) {
    console.error(`Error calculating sentiment score for ${symbol}:`, error)
    return 50
  }
}

/**
 * スリープ関数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * おすすめTOP10ランキング
 */
export async function getRecommendedRanking(
  apiKeys: { alphaVantage: string; finnhub: string }
): Promise<RankingResponse<RecommendedScore>> {
  const startTime = Date.now()
  const cacheKey = 'ranking:recommended'
  
  // キャッシュチェック
  const cached = cache.get<RankingResponse<RecommendedScore>>(cacheKey)
  if (cached) {
    console.log('Returning cached recommended ranking')
    return {
      ...cached,
      metadata: {
        ...cached.metadata,
        cacheHit: true
      }
    }
  }
  
  console.log('Starting recommended ranking...')
  
  // デモモード: 10銘柄に制限
  const symbols = DEMO_MODE ? NASDAQ_100_SYMBOLS.slice(0, DEMO_SYMBOLS_LIMIT) : NASDAQ_100_SYMBOLS
  console.log(`Analyzing ${symbols.length} symbols (Demo mode: ${DEMO_MODE})`)
  
  // 軽量スクリーニング
  const analyses = await lightweightScreening(symbols, apiKeys)
  
  console.log(`Lightweight screening returned ${analyses.length} symbols`)
  
  // スコアリング
  const ranked: RecommendedScore[] = analyses
    .map(a => {
      const totalScore = a.preliminaryScore
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
      
      if (totalScore >= 75) {
        action = 'BUY'
      } else if (totalScore < 40) {
        action = 'SELL'
      }
      
      return {
        symbol: a.symbol,
        currentPrice: a.currentPrice,
        technicalScore: a.technicalScore,
        fundamentalScore: a.fundamentalScore,
        sentimentScore: a.sentimentScore,
        predictionConfidence: 50,  // デフォルト
        totalScore: totalScore,
        action: action
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
  
  const result: RankingResponse<RecommendedScore> = {
    rankings: ranked,
    metadata: {
      totalScanned: symbols.length,
      timestamp: new Date().toISOString(),
      cacheHit: false,
      executionTime: Date.now() - startTime
    }
  }
  
  console.log(`Recommended ranking completed: ${ranked.length} symbols`)
  
  // キャッシュに保存
  cache.set(cacheKey, result, CACHE_TTL.RANKING_RECOMMENDED)
  
  return result
}
