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
  
  // GPT-5による高度な分析（最新の Responses API）
  if (apiKey) {
    try {
      const openai = new OpenAI({ 
        apiKey,
        organization: 'org-C3x5ZVIvaiCoQSoLIKqg9X5E'
      })
      
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
      
      // GPT-5 Responses APIを試行、失敗時はgpt-4oにフォールバック
      let response;
      try {
        response = await openai.responses.create({
          model: 'gpt-5',
          input: prompt
        })
      } catch (gpt5Error: any) {
        console.warn('GPT-5 API failed, falling back to gpt-4o:', gpt5Error?.message);
        // フォールバック: gpt-4o (高性能版)
        const chatResponse = await openai.chat.completions.create({
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
          temperature: 0.7
        })
        // Chat Completions形式をResponses形式に変換
        response = {
          output: [{
            content: [{
              text: chatResponse.choices[0].message.content || '{}'
            }]
          }]
        } as any
      }
      
      // レスポンスからJSON部分を抽出
      const responseText = response.output?.[0]?.content?.[0]?.text || '{}'
      const gptAnalysis = JSON.parse(responseText)
      
      // GPT-5のスコアとキーワードスコアを統合（GPT-5に70%の重み）
      const finalScore = (gptAnalysis.score * 0.7) + (keywordScore * 0.3)
      
      // ニュース記事を個別に分類
      const articleSentiments = news.slice(0, 20).map(article => {
        const text = `${article.headline} ${article.summary}`.toLowerCase()
        let score = 0
        positiveKeywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) score++
        })
        negativeKeywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) score--
        })
        
        if (score > 0) return 'positive'
        else if (score < 0) return 'negative'
        else return 'neutral'
      })
      
      const positiveNewsCount = articleSentiments.filter(s => s === 'positive').length
      const negativeNewsCount = articleSentiments.filter(s => s === 'negative').length
      const neutralNewsCount = articleSentiments.filter(s => s === 'neutral').length
      
      // ニュース判断例を作成(最大5件) - 日付情報を追加
      const newsExamples = news.slice(0, 5).map((article, idx) => ({
        headline: article.headline,
        source: article.source,
        sentiment: articleSentiments[idx],
        summary: article.summary.substring(0, 100) + '...',
        datetime: article.datetime,  // Unix timestamp
        date_formatted: new Date(article.datetime * 1000).toISOString().split('T')[0]  // YYYY-MM-DD
      }))
      
      return {
        score: Math.round(finalScore),
        sentiment: gptAnalysis.sentiment || 'neutral',
        news_count: news.length,
        positive_count: positiveNewsCount,
        negative_count: negativeNewsCount,
        neutral_count: neutralNewsCount,
        summary: gptAnalysis.summary || 'GPT-4o分析結果を取得できませんでした',
        confidence: 90,
        news_examples: newsExamples,
        gpt_insight: JSON.stringify({
          positive_factors: gptAnalysis.positive_factors || [],
          negative_factors: gptAnalysis.negative_factors || []
        }, null, 2)
      }
      
    } catch (error) {
      console.error('GPT-4o分析エラー:', error)
      // GPT-4oが失敗した場合はキーワードベースにフォールバック
    }
  }
  
  // キーワードベース分析の結果を返す
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
  if (keywordScore > 60) sentiment = 'positive'
  else if (keywordScore < 40) sentiment = 'negative'
  
  // ニュース記事を個別に分類(キーワードベース)
  const articleSentiments = news.map(article => {
    const text = `${article.headline} ${article.summary}`.toLowerCase()
    let score = 0
    positiveKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) score++
    })
    negativeKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) score--
    })
    
    if (score > 0) return 'positive'
    else if (score < 0) return 'negative'
    else return 'neutral'
  })
  
  const positiveNewsCount = articleSentiments.filter(s => s === 'positive').length
  const negativeNewsCount = articleSentiments.filter(s => s === 'negative').length
  const neutralNewsCount = articleSentiments.filter(s => s === 'neutral').length
  
  // ニュース判断例を作成(最大5件) - 日付情報を追加
  const newsExamples = news.slice(0, 5).map((article, idx) => ({
    headline: article.headline,
    source: article.source,
    sentiment: articleSentiments[idx],
    summary: article.summary.substring(0, 100) + '...',
    datetime: article.datetime,  // Unix timestamp
    date_formatted: new Date(article.datetime * 1000).toISOString().split('T')[0]  // YYYY-MM-DD
  }))
  
  return {
    score: keywordScore,
    sentiment,
    news_count: news.length,
    positive_count: positiveNewsCount,
    negative_count: negativeNewsCount,
    neutral_count: neutralNewsCount,
    news_examples: newsExamples,
    summary: `ポジティブ: ${positiveNewsCount}件、ネガティブ: ${negativeNewsCount}件、中立: ${neutralNewsCount}件`,
    confidence: 60,
    gpt_insight: 'GPT-4o APIキーが提供されていないため、キーワードベース分析のみ実行'
  }
}
