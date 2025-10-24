/**
 * 短期トレードランキング
 * 
 * テクニカル分析のみでシグナル検出
 */

import { NASDAQ_100_SYMBOLS, DEMO_MODE, DEMO_SYMBOLS_LIMIT } from './symbols'
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
  
  console.log('[SHORT-TERM] Starting short-term trading ranking...')
  
  // DEMO_MODE: 5銘柄に制限（Cloudflare Workers 30秒タイムアウト対策）
  const symbolsToAnalyze = DEMO_MODE 
    ? NASDAQ_100_SYMBOLS.slice(0, DEMO_SYMBOLS_LIMIT)
    : NASDAQ_100_SYMBOLS
  
  console.log(`[SHORT-TERM] Analyzing ${symbolsToAnalyze.length} symbols (DEMO_MODE: ${DEMO_MODE})`)
  
  // 全銘柄をテクニカル分析（並列処理）
  const analyses: ShortTermScore[] = []
  
  // DEMO_MODEではバッチ処理不要（5銘柄のみなので並列実行）
  if (DEMO_MODE) {
    const results = await Promise.all(
      symbolsToAnalyze.map(symbol => analyzeShortTerm(symbol, apiKeys))
    )
    analyses.push(...results.filter(r => r !== null) as ShortTermScore[])
  } else {
    // 本番モード: バッチ処理（70銘柄ずつ）
    const batchSize = 70
    for (let i = 0; i < symbolsToAnalyze.length; i += batchSize) {
      const batch = symbolsToAnalyze.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(symbol => analyzeShortTerm(symbol, apiKeys))
      )
      
      analyses.push(...batchResults.filter(r => r !== null) as ShortTermScore[])
      
      // レート制限対策（本番モードのみ）
      if (i + batchSize < symbolsToAnalyze.length) {
        await sleep(60000)
      }
    }
  }
  
  console.log(`[SHORT-TERM] Analyzed ${analyses.length} symbols successfully`)
  
  if (analyses.length === 0) {
    console.warn('[SHORT-TERM] WARNING: No valid analyses returned! All symbols returned null.')
  } else {
    console.log('[SHORT-TERM] Sample analysis:', analyses[0])
  }
  
  // フィルタリング + ランキング（注目株と同じロジックでフィルタリングを緩和）
  const ranked = analyses
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)  // フィルタリングなしでTop10を取得
  
  const result: RankingResponse<ShortTermScore> = {
    rankings: ranked,
    metadata: {
      totalScanned: symbolsToAnalyze.length,
      timestamp: new Date().toISOString(),
      cacheHit: false,
      executionTime: Date.now() - startTime
    }
  }
  
  // キャッシュに保存
  cache.set(cacheKey, result, CACHE_TTL.RANKING_SHORT_TERM)
  
  console.log(`[SHORT-TERM] Ranking completed: ${ranked.length} symbols`)
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
      // 日次データ取得（5分足はAlpha Vantage無料プランで制限があるため日次のみ使用）
      const dailyResponse = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKeys.alphaVantage}&outputsize=compact`
      )
      const dailyData = await dailyResponse.json()
      
      if (!dailyData['Time Series (Daily)']) {
        console.warn(`[SHORT-TERM] No daily data for ${symbol}`)
        return null
      }
      
      // 価格データ抽出
      const dailyPrices = Object.values(dailyData['Time Series (Daily)'])
        .slice(0, 60)  // 60日分取得
        .map((day: any) => parseFloat(day['4. close']))
      
      if (dailyPrices.length < 30) {
        console.warn(`[SHORT-TERM] Insufficient data for ${symbol}: ${dailyPrices.length} days`)
        return null
      }
      
      const currentPrice = dailyPrices[0]
      
      // テクニカルシグナル計算（日次データのみ使用）
      const technical = calculateTechnicalSignals(dailyPrices, dailyPrices)
      
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
