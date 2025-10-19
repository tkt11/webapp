import type { SentimentAnalysis } from '../types'
import OpenAI from 'openai'

interface NewsArticle {
  headline: string
  summary: string
  source: string
  datetime: number
  sentiment: string
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
  
  // キーワードベースの簡易分析
  const positiveKeywords = [
    'growth', 'profit', 'surge', 'beat', 'exceed', 'strong', 'rally',
    'upgrade', 'bullish', 'positive', 'gain', 'rise', 'up', 'high',
    '成長', '増益', '好調', '上昇', '上方修正'
  ]
  
  const negativeKeywords = [
    'loss', 'decline', 'fall', 'miss', 'weak', 'drop', 'downgrade',
    'bearish', 'negative', 'concern', 'risk', 'down', 'low',
    '赤字', '減益', '低迷', '下落', '下方修正', '懸念'
  ]
  
  let keywordScore = 50
  let positiveCount = 0
  let negativeCount = 0
  
  news.forEach(article => {
    const text = `${article.headline} ${article.summary}`.toLowerCase()
    
    positiveKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        keywordScore += 3
        positiveCount++
      }
    })
    
    negativeKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        keywordScore -= 3
        negativeCount++
      }
    })
  })
  
  keywordScore = Math.max(0, Math.min(100, keywordScore))
  
  // GPT-5による高度な分析
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey })
      
      const newsText = news.slice(0, 10).map(n => 
        `[${n.source}] ${n.headline}\n${n.summary}`
      ).join('\n\n')
      
      const prompt = `
あなたは金融市場の専門アナリストです。以下の${symbol}に関するニュース記事を分析し、株価への影響を評価してください。

【ニュース記事】
${newsText}

【分析項目】
1. 全体的なセンチメント（ポジティブ/ネガティブ/中立）
2. 株価への影響スコア（0-100点、50が中立）
3. 主要なポジティブ要因（3つ以内）
4. 主要なネガティブ要因（3つ以内）
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
      
      // Try GPT-5 first, fallback to GPT-4o if not available
      let response;
      try {
        response = await openai.chat.completions.create({
          model: 'gpt-5',
          messages: [
            {
              role: 'system',
              content: '金融市場の専門アナリストとしてニュース分析を行います。客観的かつ正確な評価を提供します。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          max_completion_tokens: 1000
        })
      } catch (gpt5Error) {
        console.log('GPT-5 not available, using GPT-4o:', gpt5Error)
        response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: '金融市場の専門アナリストとしてニュース分析を行います。客観的かつ正確な評価を提供します。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1000
        })
      }
      
      const gptAnalysis = JSON.parse(response.choices[0].message.content || '{}')
      
      // GPT-5のスコアとキーワードスコアを統合（GPT-5に70%の重み）
      const finalScore = (gptAnalysis.score * 0.7) + (keywordScore * 0.3)
      
      return {
        score: Math.round(finalScore),
        sentiment: gptAnalysis.sentiment || 'neutral',
        news_count: news.length,
        summary: gptAnalysis.summary || 'GPT-5分析結果を取得できませんでした',
        confidence: 90,
        gpt_insight: JSON.stringify({
          positive_factors: gptAnalysis.positive_factors || [],
          negative_factors: gptAnalysis.negative_factors || []
        }, null, 2)
      }
      
    } catch (error) {
      console.error('GPT-5分析エラー:', error)
      // GPT-5が失敗した場合はキーワードベースにフォールバック
    }
  }
  
  // キーワードベース分析の結果を返す
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
  if (keywordScore > 60) sentiment = 'positive'
  else if (keywordScore < 40) sentiment = 'negative'
  
  return {
    score: keywordScore,
    sentiment,
    news_count: news.length,
    summary: `ポジティブ: ${positiveCount}件、ネガティブ: ${negativeCount}件のキーワードを検出`,
    confidence: 60,
    gpt_insight: 'GPT-5 APIキーが提供されていないため、キーワードベース分析のみ実行'
  }
}
