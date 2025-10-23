/**
 * 短期トレードランキング
 * 
 * テクニカル分析のみでシグナル検出
 */

import { NASDAQ_100_SYMBOLS } from './symbols'
import { cache, CACHE_TTL, generateCacheKey, getCachedData } from './cache'
import { ShortTermScore, RankingResponse } from '../types'

/**
 * 短期トレードランキング取得
 */
export async function getShortTermRanking(
  apiKeys: { alphaVantage: string; finnhub: string }
): Promise<RankingResponse<ShortTermScore>> {
  const startTime = Date.now()
  const cacheKey = 'ranking:short-term'
  
  // キャッシュチェック
  const cached = cache.get<RankingResponse<ShortTermScore>>(cacheKey)
  if (cached) {
    return {
      ...cached,
      metadata: {
        ...cached.metadata,
        cacheHit: true
      }
    }
  }
  
  console.log('Starting short-term trading ranking...')
  
  // 全銘柄をテクニカル分析
  const analyses: ShortTermScore[] = []
  
  // バッチ処理（70銘柄ずつ）
  const batchSize = 70
  for (let i = 0; i < NASDAQ_100_SYMBOLS.length; i += batchSize) {
    const batch = NASDAQ_100_SYMBOLS.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map(symbol => analyzeShortTerm(symbol, apiKeys))
    )
    
    analyses.push(...batchResults.filter(r => r !== null) as ShortTermScore[])
    
    // レート制限対策
    if (i + batchSize < NASDAQ_100_SYMBOLS.length) {
      await sleep(60000)
    }
  }
  
  // フィルタリング + ランキング
  const ranked = analyses
    .filter(a => 
      a.volatility >= 20 && 
      a.volatility <= 50 &&
      a.entryTiming !== 'AVOID'
    )
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
  
  const result: RankingResponse<ShortTermScore> = {
    rankings: ranked,
    metadata: {
      totalScanned: NASDAQ_100_SYMBOLS.length,
      timestamp: new Date().toISOString(),
      cacheHit: false,
      executionTime: Date.now() - startTime
    }
  }
  
  // キャッシュに保存
  cache.set(cacheKey, result, CACHE_TTL.RANKING_SHORT_TERM)
  
  console.log(`Short-term ranking completed: ${ranked.length} symbols`)
  return result
}

/**
 * 短期トレード分析
 */
async function analyzeShortTerm(
  symbol: string,
  apiKeys: { alphaVantage: string; finnhub: string }
): Promise<ShortTermScore | null> {
  try {
    const cacheKey = generateCacheKey('short_term_analysis', symbol)
    return await getCachedData(cacheKey, CACHE_TTL.RANKING_SHORT_TERM, async () => {
      // 5分足データ取得
      const intradayResponse = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKeys.alphaVantage}&outputsize=compact`
      )
      const intradayData = await intradayResponse.json()
      
      // 日次データも取得（ボラティリティ計算用）
      const dailyResponse = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKeys.alphaVantage}&outputsize=compact`
      )
      const dailyData = await dailyResponse.json()
      
      if (!intradayData['Time Series (5min)'] || !dailyData['Time Series (Daily)']) {
        return null
      }
      
      // 価格データ抽出
      const intradayPrices = Object.values(intradayData['Time Series (5min)'])
        .slice(0, 100)
        .map((candle: any) => parseFloat(candle['4. close']))
      
      const dailyPrices = Object.values(dailyData['Time Series (Daily)'])
        .slice(0, 30)
        .map((day: any) => parseFloat(day['4. close']))
      
      const currentPrice = intradayPrices[0]
      
      // テクニカルシグナル計算
      const technical = calculateTechnicalSignals(dailyPrices, intradayPrices)
      
      // エントリータイミング判定
      let entryTiming: 'NOW' | 'WAIT' | 'AVOID' = 'WAIT'
      if (technical.signal >= 70 && technical.rsi < 70) {
        entryTiming = 'NOW'
      } else if (technical.rsi > 75 || technical.signal < 40) {
        entryTiming = 'AVOID'
      }
      
      // 総合スコア
      const totalScore = (
        technical.signal * 0.40 +
        (technical.volatility / 50 * 100) * 0.25 +
        (technical.momentum > 0 ? technical.momentum : 0) * 0.20 +
        (technical.volumeRatio - 1) * 100 * 0.15
      )
      
      return {
        symbol,
        currentPrice,
        technicalSignal: technical.signal,
        volatility: technical.volatility,
        momentum: technical.momentum,
        volumeRatio: technical.volumeRatio,
        entryTiming,
        totalScore
      }
    })
  } catch (error) {
    console.error(`Error analyzing short-term for ${symbol}:`, error)
    return null
  }
}

/**
 * テクニカルシグナル計算
 */
function calculateTechnicalSignals(
  dailyPrices: number[],
  intradayPrices: number[]
): {
  signal: number
  rsi: number
  volatility: number
  momentum: number
  volumeRatio: number
} {
  const currentPrice = dailyPrices[0]
  
  // 移動平均
  const sma5 = dailyPrices.slice(0, 5).reduce((a, b) => a + b, 0) / 5
  const sma20 = dailyPrices.slice(0, 20).reduce((a, b) => a + b, 0) / 20
  const sma50 = dailyPrices.reduce((a, b) => a + b, 0) / Math.min(dailyPrices.length, 50)
  
  // RSI計算（14日）
  const rsi = calculateRSI(dailyPrices, 14)
  
  // ボラティリティ（年率）
  const returns = []
  for (let i = 1; i < dailyPrices.length; i++) {
    returns.push((dailyPrices[i - 1] - dailyPrices[i]) / dailyPrices[i])
  }
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length
  )
  const volatility = stdDev * Math.sqrt(252) * 100
  
  // 7日モメンタム
  const momentum = dailyPrices.length >= 7
    ? ((dailyPrices[0] - dailyPrices[6]) / dailyPrices[6]) * 100
    : 0
  
  // 出来高比率（簡易版：デフォルト1.0）
  const volumeRatio = 1.0
  
  // シグナル強度計算
  let signal = 0
  
  // 移動平均（30点）
  if (currentPrice > sma5 && sma5 > sma20 && sma20 > sma50) {
    signal += 30
  } else if (currentPrice > sma5 && sma5 > sma50) {
    signal += 15
  }
  
  // RSI（25点）
  if (rsi >= 30 && rsi <= 40) {
    signal += 25
  } else if (rsi >= 40 && rsi <= 50) {
    signal += 20
  } else if (rsi >= 60 && rsi <= 70) {
    signal += 15
  }
  
  // トレンド（25点）
  if (momentum > 5) {
    signal += 25
  } else if (momentum > 2) {
    signal += 15
  } else if (momentum > 0) {
    signal += 10
  }
  
  // ボラティリティ（20点）
  if (volatility >= 25 && volatility <= 40) {
    signal += 20
  } else if (volatility >= 20 && volatility <= 50) {
    signal += 10
  }
  
  return {
    signal,
    rsi,
    volatility,
    momentum,
    volumeRatio
  }
}

/**
 * RSI計算
 */
function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) {
    return 50
  }
  
  let gains = 0
  let losses = 0
  
  for (let i = 0; i < period; i++) {
    const change = prices[i] - prices[i + 1]
    if (change > 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) {
    return 100
  }
  
  const rs = avgGain / avgLoss
  const rsi = 100 - (100 / (1 + rs))
  
  return rsi
}

/**
 * スリープ
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
