import type { SentimentAnalysis, NewsImpactScore } from '../types'
import OpenAI from 'openai'

interface NewsArticle {
  headline: string
  summary: string
  source: string
  source_domain: string
  url: string
  datetime: number
  ticker_sentiment_score: number
  ticker_sentiment_label: string
  relevance_score: number
}

/**
 * 影響度スコアリング
 * 
 * 配分:
 * - センチメント強度: 60点
 * - 新しさ: 20点  
 * - ソース信頼性: 20点
 */
function calculateImpactScore(article: NewsArticle): NewsImpactScore {
  const now = Date.now() / 1000 // Unix timestamp
  
  // 1. センチメント強度 (0-60点)
  // Alpha Vantage sentiment_score: -1.0 〜 +1.0 を 0-60に変換
  const sentimentComponent = Math.abs(article.ticker_sentiment_score) * 60
  
  // 2. 新しさスコア (0-20点)
  // 最新 = 20点、6日前 = 0点（線形減衰）
  const ageInHours = (now - article.datetime) / 3600
  const ageInDays = ageInHours / 24
  const recencyComponent = Math.max(0, 20 - (ageInDays / 6) * 20)
  
  // 3. ソース信頼性スコア (0-20点)
  const sourceScores: { [key: string]: number } = {
    'reuters.com': 20,
    'bloomberg.com': 20,
    'wsj.com': 19,
    'ft.com': 19,
    'cnbc.com': 17,
    'marketwatch.com': 16,
    'barrons.com': 16,
    'economist.com': 18,
    'fool.com': 13,
    'seekingalpha.com': 12,
    'benzinga.com': 10,
    'zacks.com': 10
  }
  
  let reliabilityComponent = 8 // デフォルト
  for (const [domain, score] of Object.entries(sourceScores)) {
    if (article.source_domain.includes(domain)) {
      reliabilityComponent = score
      break
    }
  }
  
  // 関連性ボーナス（Alpha Vantageのrelevance_score活用）
  const relevanceBonus = article.relevance_score * 10 // 最大+10点
  
  const impactScore = sentimentComponent + recencyComponent + reliabilityComponent + relevanceBonus
  
  return {
    article: {
      headline: article.headline,
      summary: article.summary,
      source: article.source,
      source_domain: article.source_domain,
      url: article.url,
      datetime: article.datetime,
      date_formatted: new Date(article.datetime * 1000).toISOString().split('T')[0]
    },
    sentiment_score: article.ticker_sentiment_score,
    sentiment_label: article.ticker_sentiment_label,
    relevance_score: article.relevance_score,
    impact_score: Math.min(100, impactScore),
    components: {
      sentiment_component: sentimentComponent,
      recency_component: recencyComponent,
      reliability_component: reliabilityComponent
    }
  }
}

/**
 * クリティカルネガティブアラート検出
 * 
 * 検出基準:
 * 1. センチメントスコア ≤ -0.5（強いネガティブ）
 * 2. 影響度スコア ≥ 70点（高影響度）
 */
function detectCriticalNegativeNews(newsWithImpact: NewsImpactScore[]): NewsImpactScore[] {
  return newsWithImpact.filter(n => 
    n.sentiment_score <= -0.5 &&  // 強いネガティブ
    n.impact_score >= 70          // 高影響度
  )
}

export async function performSentimentAnalysis(
  news: NewsArticle[],
  symbol: string,
  apiKey?: string
): Promise<SentimentAnalysis> {
  
  if (!news || news.length === 0) {
    return {
      score: 50,
      sentiment: 'neutral',
      news_count: 0,
      summary: 'ニュースデータがありません',
      confidence: 0
    }
  }
  
  console.log(`[Sentiment] Analyzing ${news.length} news articles for ${symbol}`)
  
  // 影響度スコアリング（全記事）
  const newsWithImpact = news.map(calculateImpactScore)
  
  // 影響度順にソート
  newsWithImpact.sort((a, b) => b.impact_score - a.impact_score)
  
  // クリティカルネガティブアラート検出
  const criticalAlerts = detectCriticalNegativeNews(newsWithImpact)
  
  console.log(`[Sentiment] Critical negative alerts: ${criticalAlerts.length}`)
  
  // センチメントスコア計算（Alpha Vantageのスコアを活用）
  let totalSentiment = 0
  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0
  
  newsWithImpact.forEach(n => {
    totalSentiment += n.sentiment_score
    
    if (n.sentiment_score >= 0.15) {
      positiveCount++
    } else if (n.sentiment_score <= -0.15) {
      negativeCount++
    } else {
      neutralCount++
    }
  })
  
  const avgSentiment = totalSentiment / newsWithImpact.length
  
  // スコアを0-100に変換（-1.0 〜 +1.0 → 0 〜 100）
  const sentimentScore = Math.round(((avgSentiment + 1) / 2) * 100)
  
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
  if (avgSentiment >= 0.15) sentiment = 'positive'
  else if (avgSentiment <= -0.15) sentiment = 'negative'
  
  // GPT-5による高度な分析（オプション）
  // コスト削減のため、ネガティブ上位2件 + ポジティブ上位2件のみ分析
  let gptInsight: string | undefined
  let finalScore = sentimentScore
  
  if (apiKey) {
    try {
      const openai = new OpenAI({ 
        apiKey,
        organization: 'org-C3x5ZVIvaiCoQSoLIKqg9X5E'
      })
      
      // ネガティブニュース（センチメント順でソート）とポジティブニュースを分離
      const negativeNews = newsWithImpact
        .filter(n => n.sentiment_score < -0.15)
        .sort((a, b) => a.sentiment_score - b.sentiment_score) // 最もネガティブから順に
        .slice(0, 2)
      
      const positiveNews = newsWithImpact
        .filter(n => n.sentiment_score > 0.15)
        .sort((a, b) => b.sentiment_score - a.sentiment_score) // 最もポジティブから順に
        .slice(0, 2)
      
      const selectedNews = [...negativeNews, ...positiveNews]
      
      if (selectedNews.length === 0) {
        // ネガティブ・ポジティブがない場合は影響度上位4件
        selectedNews.push(...newsWithImpact.slice(0, 4))
      }
      
      const newsText = selectedNews.map(n => 
        `[${n.article.source}] ${n.article.headline}\n${n.article.summary}\nセンチメント: ${n.sentiment_score} (${n.sentiment_label})\n影響度: ${Math.round(n.impact_score)}点`
      ).join('\n\n')
      
      const prompt = `
あなたは金融市場の専門アナリストです。以下の${symbol}に関する重要ニュース記事（ネガティブ上位2件 + ポジティブ上位2件）を分析し、株価への影響を評価してください。

【重要ニュース記事】
${newsText}

【分析項目】
1. 全体的なセンチメント（ポジティブ/ネガティブ/中立）
2. 株価への影響スコア（0-100点、50が中立）
3. 主要なポジティブ要因（2つ以内）
4. 主要なネガティブ要因（2つ以内）
5. 総合的な見解（100文字程度）

JSON形式で回答してください：
{
  "sentiment": "positive/negative/neutral",
  "score": 0-100,
  "positive_factors": ["要因1", "要因2"],
  "negative_factors": ["要因1", "要因2"],
  "summary": "総合的な見解"
}
`
      
      const response = await openai.responses.create({
        model: 'gpt-5',
        input: prompt
      })
      
      const responseText = response.output_text || response.output?.[0]?.content?.[0]?.text || '{}'
      const gptAnalysis = JSON.parse(responseText)
      
      // GPT-5のスコアとAlpha Vantageスコアを統合（GPT-5に70%の重み）
      finalScore = Math.round((gptAnalysis.score * 0.7) + (sentimentScore * 0.3))
      sentiment = gptAnalysis.sentiment || sentiment
      
      gptInsight = JSON.stringify({
        positive_factors: gptAnalysis.positive_factors || [],
        negative_factors: gptAnalysis.negative_factors || [],
        summary: gptAnalysis.summary || ''
      }, null, 2)
      
      console.log(`[Sentiment] GPT-5 analysis completed. Final score: ${finalScore}`)
      
    } catch (error) {
      console.error('[Sentiment] GPT-5 analysis error:', error)
      // GPT-5が失敗した場合はAlpha Vantageスコアのみ使用
    }
  }
  
  // ニュース例を作成（影響度上位20件）
  const newsExamples = newsWithImpact.slice(0, 20).map(n => ({
    headline: n.article.headline,
    source: n.article.source,
    sentiment: n.sentiment_label.toLowerCase(),
    summary: n.article.summary.substring(0, 100) + '...',
    datetime: n.article.datetime,
    date_formatted: n.article.date_formatted,
    url: n.article.url,
    impact_score: Math.round(n.impact_score),
    relevance_score: n.relevance_score
  }))
  
  // クリティカルアラート情報
  const critical_alerts = criticalAlerts.length > 0 ? criticalAlerts.map(n => ({
    headline: n.article.headline,
    source: n.article.source,
    sentiment_score: n.sentiment_score,
    impact_score: Math.round(n.impact_score),
    relevance_score: n.relevance_score,
    url: n.article.url,
    datetime: n.article.datetime,
    date_formatted: n.article.date_formatted
  })) : undefined
  
  return {
    score: finalScore,
    sentiment,
    news_count: news.length,
    positive_count: positiveCount,
    negative_count: negativeCount,
    neutral_count: neutralCount,
    news_examples: newsExamples,
    summary: `ポジティブ: ${positiveCount}件、ネガティブ: ${negativeCount}件、中立: ${neutralCount}件`,
    confidence: apiKey ? 90 : 75,
    gpt_insight: gptInsight,
    critical_alerts: critical_alerts
  }
}
