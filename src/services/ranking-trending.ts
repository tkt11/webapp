/**
 * 注目株ランキング
 * 
 * ニュース + ソーシャル + アナリスト評価
 */

import { NASDAQ_100_SYMBOLS, DEMO_MODE, DEMO_SYMBOLS_LIMIT } from './symbols'
import { cache, CACHE_TTL, generateCacheKey, getCachedData } from './cache'
import { TrendingScore, RankingResponse } from '../types'

/**
 * 注目株ランキング取得
 */
export async function getTrendingRanking(
  apiKeys: { alphaVantage: string; finnhub: string }
): Promise<RankingResponse<TrendingScore>> {
  const startTime = Date.now()
  const cacheKey = 'ranking:trending'
  
  // キャッシュチェック
  const cached = cache.get<RankingResponse<TrendingScore>>(cacheKey)
  if (cached) {
    return {
      ...cached,
      metadata: {
        ...cached.metadata,
        cacheHit: true
      }
    }
  }
  
  console.log('Starting trending stocks ranking...')
  
  // デモモード: 10銘柄に制限
  const symbols = DEMO_MODE ? NASDAQ_100_SYMBOLS.slice(0, DEMO_SYMBOLS_LIMIT) : NASDAQ_100_SYMBOLS
  console.log(`Analyzing ${symbols.length} symbols (Demo mode: ${DEMO_MODE})`)
  
  // 全銘柄を分析
  const analyses: TrendingScore[] = []
  
  // バッチ処理
  const batchSize = DEMO_MODE ? 10 : 70
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    
    const batchResults = await Promise.all(
      batch.map(symbol => analyzeTrending(symbol, apiKeys))
    )
    
    analyses.push(...batchResults.filter(r => r !== null) as TrendingScore[])
    
    if (i + batchSize < symbols.length) {
      await sleep(60000)
    }
  }
  
  // フィルタリング + ランキング
  // FIXED: 50点以上のフィルターが厳しすぎるため、すべての結果を返す（フィルターなし）
  const ranked = analyses
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
  
  const result: RankingResponse<TrendingScore> = {
    rankings: ranked,
    metadata: {
      totalScanned: NASDAQ_100_SYMBOLS.length,
      timestamp: new Date().toISOString(),
      cacheHit: false,
      executionTime: Date.now() - startTime
    }
  }
  
  // キャッシュに保存
  cache.set(cacheKey, result, CACHE_TTL.RANKING_TRENDING)
  
  console.log(`Trending ranking completed: ${ranked.length} symbols`)
  return result
}

/**
 * 注目度分析
 */
async function analyzeTrending(
  symbol: string,
  apiKeys: { alphaVantage: string; finnhub: string }
): Promise<TrendingScore | null> {
  try {
    const cacheKey = generateCacheKey('trending_analysis', symbol)
    return await getCachedData(cacheKey, CACHE_TTL.RANKING_TRENDING, async () => {
      // 並列でデータ取得
      const [quote, news, analyst, fundamental] = await Promise.all([
        getQuote(symbol, apiKeys.finnhub),
        getNewsScore(symbol, apiKeys.alphaVantage),
        getAnalystScore(symbol, apiKeys.finnhub),
        getFundamentalGrowth(symbol, apiKeys.finnhub)
      ])
      
      if (!quote) {
        return null
      }
      
      // null値をデフォルト値50に置き換え
      const safeNews = news || 50
      const safeAnalyst = analyst || 50
      const safeFundamental = fundamental || 50
      
      // ソーシャルスコア（簡易版：ニュースの半分）
      const socialScore = safeNews / 2
      
      // 検索トレンドスコア（未実装：デフォルト50）
      const searchScore = 50
      
      // 総合スコア
      const totalScore = (
        safeNews * 0.30 +
        socialScore * 0.25 +
        searchScore * 0.20 +
        safeAnalyst * 0.15 +
        safeFundamental * 0.10
      )
      
      // トレンド理由生成
      const reasons: string[] = []
      if (news > 70) reasons.push('大型ニュース発表')
      if (socialScore > 70) reasons.push('SNSで話題沸騰')
      if (analyst > 70) reasons.push('アナリスト評価上昇')
      if (fundamental > 70) reasons.push('業績好調')
      
      return {
        symbol,
        currentPrice: quote,
        newsScore: safeNews,
        socialScore,
        searchScore,
        analystScore: safeAnalyst,
        fundamentalGrowth: safeFundamental,
        totalScore,
        trendReason: reasons.join(' / ') || '総合的に注目度上昇'
      }
    })
  } catch (error) {
    console.error(`Error analyzing trending for ${symbol}:`, error)
    return null
  }
}

/**
 * 株価取得
 */
async function getQuote(symbol: string, apiKey: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    )
    
    // Check if response is OK
    if (!response.ok) {
      console.error(`Finnhub quote API error for ${symbol}: ${response.status}`)
      return null
    }
    
    // Check content-type to avoid HTML errors
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Finnhub quote API returned non-JSON for ${symbol}: ${contentType}`)
      return null
    }
    
    const data = await response.json()
    return data.c || null
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error)
    return null
  }
}

/**
 * ニューススコア
 */
async function getNewsScore(symbol: string, apiKey: string): Promise<number> {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const timeFrom = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '') + 'T0000'
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&time_from=${timeFrom}&apikey=${apiKey}&limit=50`
    )
    const data = await response.json()
    
    if (!data.feed) {
      return 50
    }
    
    const newsCount = data.feed.length
    
    // ニュース件数スコア（50点）
    let score = 0
    if (newsCount >= 10) score += 50
    else if (newsCount >= 5) score += 30
    else if (newsCount >= 2) score += 15
    
    // センチメントスコア（50点）
    const sentiments = data.feed
      .map((article: any) => {
        const tickerSentiment = article.ticker_sentiment?.find((t: any) => t.ticker === symbol)
        return tickerSentiment?.ticker_sentiment_score || 0
      })
      .filter((s: number) => s !== 0)
    
    if (sentiments.length > 0) {
      const avgSentiment = sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length
      score += ((avgSentiment + 1) / 2) * 50
    } else {
      score += 25  // デフォルト
    }
    
    return Math.min(score, 100)
  } catch (error) {
    return 50
  }
}

/**
 * アナリストスコア
 */
async function getAnalystScore(symbol: string, apiKey: string): Promise<number> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${apiKey}`
    )
    
    // Check if response is OK
    if (!response.ok) {
      return 50
    }
    
    // Check content-type
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return 50
    }
    
    const data = await response.json()
    
    if (!data || data.length === 0) {
      return 50
    }
    
    // 最新のレーティング
    const latest = data[0]
    const totalRatings = latest.buy + latest.hold + latest.sell
    if (totalRatings === 0) {
      return 50
    }
    const buyRatio = latest.buy / totalRatings
    
    return buyRatio * 100
  } catch (error) {
    return 50
  }
}

/**
 * ファンダメンタル成長性
 */
async function getFundamentalGrowth(symbol: string, apiKey: string): Promise<number> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`
    )
    
    // Check if response is OK
    if (!response.ok) {
      return 50
    }
    
    // Check content-type
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return 50
    }
    
    const data = await response.json()
    
    if (!data.metric) {
      return 50
    }
    
    let score = 50
    const metrics = data.metric
    
    // 売上成長率
    if (metrics.revenueGrowthTTMYoy) {
      if (metrics.revenueGrowthTTMYoy > 30) score += 30
      else if (metrics.revenueGrowthTTMYoy > 20) score += 20
      else if (metrics.revenueGrowthTTMYoy > 10) score += 10
    }
    
    // 利益成長率
    if (metrics.epsGrowthTTMYoy) {
      if (metrics.epsGrowthTTMYoy > 30) score += 20
      else if (metrics.epsGrowthTTMYoy > 20) score += 15
      else if (metrics.epsGrowthTTMYoy > 10) score += 10
    }
    
    return Math.min(score, 100)
  } catch (error) {
    return 50
  }
}

/**
 * スリープ
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
