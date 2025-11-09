/**
 * 高成長×信頼度ランキング
 * 
 * 2段階スクリーニング + gpt-5-mini分析
 */

import { NASDAQ_100_SYMBOLS } from './symbols'
import { cache, CACHE_TTL, generateCacheKey } from './cache'
import { lightweightScreening } from './ranking'
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
    // キャッシュキー
    const cacheKey = generateCacheKey('gpt5mini_analysis', candidate.symbol, timeframe)
    const cached = cache.get<HighGrowthScore>(cacheKey)
    if (cached) {
      console.log(`Cache hit for GPT-5-mini analysis: ${candidate.symbol}`)
      return cached
    }
    
    console.log(`Calling GPT-5-mini for ${candidate.symbol}...`)
    
    // OpenAI クライアント初期化
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: apiKeys.openai
    })
    
    // 追加データ取得：ニュース、ファンダメンタル
    const [newsData, fundamentalData] = await Promise.all([
      fetchNewsData(candidate.symbol, apiKeys.alphaVantage),
      fetchFundamentalData(candidate.symbol, apiKeys.finnhub)
    ])
    
    // GPT-5-miniへのプロンプト構築
    const prompt = `あなたは株式アナリストです。以下の銘柄データを分析し、${timeframe}後の成長可能性を評価してください。

【銘柄】${candidate.symbol}
【現在価格】$${candidate.currentPrice}
【テクニカルスコア】${candidate.technicalScore}/100
【ファンダメンタルスコア】${candidate.fundamentalScore}/100
【センチメントスコア】${candidate.sentimentScore}/100

【最新ニュース】
${newsData.slice(0, 5).map((n: any) => `- ${n.headline}: ${n.summary}`).join('\n')}

【財務指標】
${fundamentalData ? JSON.stringify(fundamentalData, null, 2) : '取得失敗'}

【分析要求】
1. ${timeframe}後の予測価格を算出
2. 予測上昇率（%）を計算
3. 信頼度（60-95%）を評価
4. 総合判断理由を簡潔に述べる

【出力形式】JSON形式で以下を返してください：
{
  "predictedPrice": 数値,
  "predictedGain": 数値（%）,
  "confidence": 数値（60-95）,
  "reasoning": "判断理由（100文字以内）"
}

注意：predictedGainが15%未満の場合、その銘柄は推奨しません。`

    // GPT-5-mini API呼び出し
    const response = await openai.responses.create({
      model: 'gpt-5-mini',
      input: prompt
    })
    
    // レスポンス解析
    const responseText = response.output_text || ''
    console.log(`GPT-5-mini response for ${candidate.symbol}:`, responseText.substring(0, 200))
    
    // JSON抽出
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`Failed to parse GPT-5-mini response for ${candidate.symbol}`)
      return null
    }
    
    const gpt5Result = JSON.parse(jsonMatch[0])
    
    // 予測上昇率が15%未満は除外
    if (gpt5Result.predictedGain < 15) {
      console.log(`${candidate.symbol}: predictedGain ${gpt5Result.predictedGain}% < 15%, skipping`)
      return null
    }
    
    // 信頼度の範囲チェック
    const confidence = Math.max(60, Math.min(95, gpt5Result.confidence))
    
    // 総合スコア計算
    const totalScore = (
      gpt5Result.predictedGain * 0.35 +
      confidence * 0.30 +
      candidate.fundamentalScore * 0.20 +
      candidate.technicalScore * 0.15
    )
    
    const result: HighGrowthScore = {
      symbol: candidate.symbol,
      currentPrice: candidate.currentPrice,
      predictedPrice: gpt5Result.predictedPrice,
      predictedGain: gpt5Result.predictedGain,
      confidence,
      fundamentalScore: candidate.fundamentalScore,
      technicalScore: candidate.technicalScore,
      totalScore,
      timeframe
    }
    
    // キャッシュに保存
    cache.set(cacheKey, result, CACHE_TTL.GPT5_ANALYSIS)
    
    console.log(`GPT-5-mini analysis completed for ${candidate.symbol}: gain=${gpt5Result.predictedGain}%, confidence=${confidence}%`)
    
    return result
  } catch (error) {
    console.error(`Error in GPT-5-mini analysis for ${candidate.symbol}:`, error)
    return null
  }
}

/**
 * ニュースデータ取得
 */
async function fetchNewsData(symbol: string, apiKey: string): Promise<any[]> {
  try {
    const cacheKey = generateCacheKey('news', symbol)
    const cached = cache.get<any[]>(cacheKey)
    if (cached) {
      return cached
    }
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}&limit=10`
    )
    const data = await response.json()
    
    const news = data.feed || []
    cache.set(cacheKey, news, CACHE_TTL.NEWS)
    
    return news
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error)
    return []
  }
}

/**
 * ファンダメンタルデータ取得
 */
async function fetchFundamentalData(symbol: string, apiKey: string): Promise<any | null> {
  try {
    const cacheKey = generateCacheKey('fundamental', symbol)
    const cached = cache.get<any>(cacheKey)
    if (cached) {
      return cached
    }
    
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`
    )
    const data = await response.json()
    
    if (!data.metric) {
      return null
    }
    
    // 重要な指標のみ抽出
    const fundamentals = {
      peRatio: data.metric.peNormalizedAnnual,
      pbRatio: data.metric.pbAnnual,
      roe: data.metric.roeTTM,
      revenueGrowth: data.metric.revenueGrowthTTMYoy,
      operatingMargin: data.metric.operatingMarginTTM
    }
    
    cache.set(cacheKey, fundamentals, CACHE_TTL.FUNDAMENTAL)
    
    return fundamentals
  } catch (error) {
    console.error(`Error fetching fundamental data for ${symbol}:`, error)
    return null
  }
}
