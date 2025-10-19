import type { 
  PredictionResult, 
  TechnicalAnalysis, 
  FundamentalAnalysis, 
  SentimentAnalysis, 
  MacroAnalysis, 
  AnalystRating 
} from '../types'
import OpenAI from 'openai'

export function generatePrediction(
  technical: TechnicalAnalysis,
  fundamental: FundamentalAnalysis,
  sentiment: SentimentAnalysis,
  macro: MacroAnalysis,
  analyst: AnalystRating,
  currentPrice: number,
  symbol: string
): PredictionResult {
  
  // 重み付け設定
  const weights = {
    technical: 0.35,
    fundamental: 0.30,
    sentiment: 0.15,
    macro: 0.10,
    analyst: 0.10
  }
  
  // 最終スコア計算
  const finalScore = 
    technical.score * weights.technical +
    fundamental.score * weights.fundamental +
    sentiment.score * weights.sentiment +
    macro.score * weights.macro +
    analyst.score * weights.analyst
  
  // アクション判定
  let action: 'BUY' | 'SELL' | 'HOLD'
  let confidence: number
  
  if (finalScore >= 65) {
    action = 'BUY'
    confidence = Math.min(95, ((finalScore - 65) / 35) * 100)
  } else if (finalScore <= 35) {
    action = 'SELL'
    confidence = Math.min(95, ((35 - finalScore) / 35) * 100)
  } else {
    action = 'HOLD'
    confidence = Math.max(50, 100 - Math.abs(50 - finalScore) * 2)
  }
  
  // 理由の収集
  const reasons: string[] = []
  const risks: string[] = []
  
  // テクニカル分析からの理由
  if (technical.score >= 60) {
    reasons.push(...technical.signals.filter(s => s.startsWith('✅')))
  } else if (technical.score <= 40) {
    risks.push(...technical.signals.filter(s => s.startsWith('❌')))
  }
  
  // ファンダメンタル分析からの理由
  if (fundamental.score >= 60) {
    reasons.push(...fundamental.signals.filter(s => s.startsWith('✅')))
  } else if (fundamental.score <= 40) {
    risks.push(...fundamental.signals.filter(s => s.startsWith('❌')))
  }
  
  // センチメント分析からの理由
  if (sentiment.score >= 60) {
    reasons.push(`✅ ポジティブなニュースセンチメント (${sentiment.news_count}件)`)
  } else if (sentiment.score <= 40) {
    risks.push(`❌ ネガティブなニュースセンチメント (${sentiment.news_count}件)`)
  }
  
  // マクロ経済からの理由
  if (macro.score >= 60) {
    reasons.push(...macro.signals.filter(s => s.startsWith('✅')))
  } else if (macro.score <= 40) {
    risks.push(...macro.signals.filter(s => s.startsWith('❌')))
  }
  
  // アナリスト評価からの理由
  if (analyst.score >= 60 && analyst.consensus) {
    reasons.push(`✅ アナリストコンセンサス: ${analyst.consensus}`)
    if (analyst.upside && analyst.upside > 0) {
      reasons.push(`✅ 目標株価まで ${analyst.upside.toFixed(1)}% の上値余地`)
    }
  } else if (analyst.score <= 40) {
    if (analyst.consensus === 'SELL') {
      risks.push(`❌ アナリストコンセンサス: SELL`)
    }
    if (analyst.upside && analyst.upside < 0) {
      risks.push(`❌ 目標株価を ${Math.abs(analyst.upside).toFixed(1)}% 上回っている`)
    }
  }
  
  // 理由が少ない場合は補足
  if (reasons.length === 0) {
    reasons.push('⚪ 明確なポジティブシグナルなし')
  }
  if (risks.length === 0) {
    risks.push('⚪ 明確なリスクシグナルなし')
  }
  
  // 目標株価の計算
  let targetPrice: number | null = null
  let expectedReturn: number | null = null
  
  if (analyst.target_price && analyst.target_price > 0) {
    targetPrice = analyst.target_price
  } else {
    // アナリスト目標価格がない場合は予測スコアから推定
    const priceMultiplier = 1 + ((finalScore - 50) / 100)
    targetPrice = currentPrice * priceMultiplier
  }
  
  if (targetPrice) {
    expectedReturn = ((targetPrice - currentPrice) / currentPrice) * 100
  }
  
  return {
    action,
    confidence: Math.round(confidence),
    score: Math.round(finalScore),
    breakdown: {
      technical: Math.round(technical.score),
      fundamental: Math.round(fundamental.score),
      sentiment: Math.round(sentiment.score),
      macro: Math.round(macro.score),
      analyst: Math.round(analyst.score)
    },
    reasons: reasons.slice(0, 8),
    risks: risks.slice(0, 8),
    target_price: targetPrice,
    expected_return: expectedReturn
  }
}

export async function generateDetailedExplanation(
  prediction: PredictionResult,
  symbol: string,
  technical: TechnicalAnalysis,
  fundamental: FundamentalAnalysis,
  sentiment: SentimentAnalysis,
  apiKey?: string
): Promise<string> {
  
  if (!apiKey) {
    return `
【${symbol} 総合分析レポート】

判定: ${prediction.action} (信頼度: ${prediction.confidence}%)
総合スコア: ${prediction.score}/100

【スコア内訳】
- テクニカル分析: ${prediction.breakdown.technical}/100
- ファンダメンタル分析: ${prediction.breakdown.fundamental}/100
- センチメント分析: ${prediction.breakdown.sentiment}/100
- マクロ経済分析: ${prediction.breakdown.macro}/100
- アナリスト評価: ${prediction.breakdown.analyst}/100

【主要ポジティブ要因】
${prediction.reasons.join('\n')}

【主要リスク要因】
${prediction.risks.join('\n')}

${prediction.target_price ? `【目標株価】
目標価格: $${prediction.target_price.toFixed(2)}
期待リターン: ${prediction.expected_return?.toFixed(1)}%` : ''}

※ GPT-5 APIキーが提供されていないため、詳細な解説は生成されていません
`
  }
  
  try {
    const openai = new OpenAI({ apiKey })
    
    const prompt = `
あなたは個人投資家向けの金融アドバイザーです。${symbol}の投資判断について、初心者にもわかりやすく説明してください。

【分析結果】
- 判定: ${prediction.action}
- 総合スコア: ${prediction.score}/100
- 信頼度: ${prediction.confidence}%

【各分析の詳細】
テクニカル分析 (${prediction.breakdown.technical}/100):
${technical.signals.join(', ')}

ファンダメンタル分析 (${prediction.breakdown.fundamental}/100):
${fundamental.signals.join(', ')}

センチメント分析 (${prediction.breakdown.sentiment}/100):
${sentiment.summary}

【主要ポジティブ要因】
${prediction.reasons.join('\n')}

【主要リスク要因】
${prediction.risks.join('\n')}

【依頼内容】
1. なぜこの判定（${prediction.action}）になったのか、初心者にわかりやすく説明
2. 具体的にどのような投資戦略が適切か提案
3. 注意すべきリスクと対策
4. 今後の見通し（1ヶ月、3ヶ月、6ヶ月）

500文字程度で、専門用語は避けて平易に説明してください。
`
    
    // Try GPT-5 first, fallback to GPT-4o if not available
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: '個人投資家向けの金融アドバイザーとして、専門的な分析をわかりやすく説明します。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 1500
      })
    } catch (gpt5Error) {
      console.log('GPT-5 not available, using GPT-4o:', gpt5Error)
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '個人投資家向けの金融アドバイザーとして、専門的な分析をわかりやすく説明します。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    }
    
    return response.choices[0].message.content || '詳細な解説を生成できませんでした'
    
  } catch (error) {
    console.error('GPT-5詳細解説生成エラー:', error)
    return '詳細な解説の生成中にエラーが発生しました'
  }
}
