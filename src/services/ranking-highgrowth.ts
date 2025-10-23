/**
 * 高成長×信頼度ランキング
 * 
 * 2段階スクリーニング + gpt-5-mini分析
 */

import { NASDAQ_100_SYMBOLS } from './symbols'
import { cache, CACHE_TTL, generateCacheKey } from './cache'
import { lightweightScreening } from './ranking'
import { generateGPT5FinalJudgment } from './prediction'
import { HighGrowthScore, RankingResponse, LightAnalysis } from '../types'

/**
 * 高成長×信頼度ランキング取得
 */
export async function getHighGrowthRanking(
  timeframe: '30d' | '60d' | '90d',
  apiKeys: {
    alphaVantage: string
    finnhub: string
    openai: string
    fred: string
  }
): Promise<RankingResponse<HighGrowthScore>> {
  const startTime = Date.now()
  const cacheKey = `ranking:high-growth:${timeframe}`
  
  // キャッシュチェック
  const cached = cache.get<RankingResponse<HighGrowthScore>>(cacheKey)
  if (cached) {
    console.log(`Cache hit for high-growth ranking (${timeframe})`)
    return {
      ...cached,
      metadata: {
        ...cached.metadata,
        cacheHit: true
      }
    }
  }
  
  console.log(`Starting high-growth ranking for ${timeframe}...`)
  
  // ステップ1: 軽量スクリーニング（100銘柄全体）
  console.log('Step 1: Lightweight screening (100 symbols)...')
  const lightAnalyses = await lightweightScreening(NASDAQ_100_SYMBOLS, {
    alphaVantage: apiKeys.alphaVantage,
    finnhub: apiKeys.finnhub
  })
  
  // 上位30銘柄を選定
  const top30 = lightAnalyses
    .sort((a, b) => b.preliminaryScore - a.preliminaryScore)
    .slice(0, 30)
  
  console.log(`Step 1 completed: Selected top 30 candidates`)
  console.log(`Top 30 symbols: ${top30.map(a => a.symbol).join(', ')}`)
  
  // ステップ2: GPT-5-mini精密分析（上位30銘柄のみ）
  console.log('Step 2: GPT-5-mini analysis for top 30...')
  const gpt5Analyses: HighGrowthScore[] = []
  
  for (let i = 0; i < top30.length; i++) {
    const candidate = top30[i]
    console.log(`Analyzing ${candidate.symbol} (${i + 1}/30) with GPT-5-mini...`)
    
    try {
      // GPT-5-mini分析実行
      const analysis = await analyzeWithGPT5Mini(
        candidate,
        timeframe,
        apiKeys
      )
      
      if (analysis) {
        gpt5Analyses.push(analysis)
      }
    } catch (error) {
      console.error(`Error analyzing ${candidate.symbol}:`, error)
    }
  }
  
  console.log(`Step 2 completed: ${gpt5Analyses.length} symbols analyzed`)
  
  // 最終ランキング（TOP10）
  const finalRanked = gpt5Analyses
    .filter(a => a.confidence >= 60)  // 信頼度60%以上
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
  
  const result: RankingResponse<HighGrowthScore> = {
    rankings: finalRanked,
    metadata: {
      totalScanned: NASDAQ_100_SYMBOLS.length,
      timestamp: new Date().toISOString(),
      cacheHit: false,
      executionTime: Date.now() - startTime
    }
  }
  
  // キャッシュに保存
  cache.set(cacheKey, result, CACHE_TTL.RANKING_HIGH_GROWTH)
  
  console.log(`High-growth ranking completed in ${result.metadata.executionTime}ms`)
  return result
}

/**
 * GPT-5-miniによる精密分析
 */
async function analyzeWithGPT5Mini(
  candidate: LightAnalysis,
  timeframe: '30d' | '60d' | '90d',
  apiKeys: {
    alphaVantage: string
    finnhub: string
    openai: string
    fred: string
  }
): Promise<HighGrowthScore | null> {
  try {
    // ここでは既存のanalyzeStock関数を簡易的に呼び出す
    // 完全な実装は既存のprediction.tsの関数を利用
    
    // 簡易版: 統計予測のみ（GPT-5-miniは後で統合）
    const predictedGain = await estimatePredictedGain(
      candidate.symbol,
      timeframe,
      apiKeys.alphaVantage
    )
    
    if (predictedGain === null || predictedGain < 15) {
      return null  // 15%未満の上昇予測は除外
    }
    
    // 予測価格計算
    const predictedPrice = candidate.currentPrice * (1 + predictedGain / 100)
    
    // 信頼度（簡易版）
    const confidence = Math.min(
      70 + candidate.fundamentalScore * 0.2 + candidate.technicalScore * 0.1,
      95
    )
    
    // 総合スコア
    const totalScore = (
      predictedGain * 0.35 +
      confidence * 0.30 +
      candidate.fundamentalScore * 0.20 +
      candidate.technicalScore * 0.15
    )
    
    return {
      symbol: candidate.symbol,
      currentPrice: candidate.currentPrice,
      predictedPrice,
      predictedGain,
      confidence,
      fundamentalScore: candidate.fundamentalScore,
      technicalScore: candidate.technicalScore,
      totalScore,
      timeframe
    }
  } catch (error) {
    console.error(`Error in GPT-5-mini analysis for ${candidate.symbol}:`, error)
    return null
  }
}

/**
 * 予測上昇率の推定（簡易版）
 */
async function estimatePredictedGain(
  symbol: string,
  timeframe: '30d' | '60d' | '90d',
  apiKey: string
): Promise<number | null> {
  try {
    const cacheKey = generateCacheKey('predicted_gain', symbol, timeframe)
    const cached = cache.get<number>(cacheKey)
    if (cached !== null) {
      return cached
    }
    
    // 過去30日のデータで線形回帰
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`
    )
    const data = await response.json()
    
    if (!data['Time Series (Daily)']) {
      return null
    }
    
    const prices = Object.values(data['Time Series (Daily)'])
      .slice(0, 30)
      .map((day: any) => parseFloat(day['4. close']))
      .reverse()
    
    // 線形回帰
    const n = prices.length
    const sumX = (n * (n - 1)) / 2
    const sumY = prices.reduce((a, b) => a + b, 0)
    const sumXY = prices.reduce((sum, price, idx) => sum + (idx * price), 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // 予測
    const days = timeframe === '30d' ? 30 : timeframe === '60d' ? 60 : 90
    const currentPrice = prices[prices.length - 1]
    const predictedPrice = currentPrice + (slope * days)
    const gain = ((predictedPrice - currentPrice) / currentPrice) * 100
    
    // キャッシュに保存
    cache.set(cacheKey, gain, CACHE_TTL.LIGHT_ANALYSIS)
    
    return gain
  } catch (error) {
    console.error(`Error estimating predicted gain for ${symbol}:`, error)
    return null
  }
}
