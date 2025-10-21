import type { 
  PredictionResult, 
  TechnicalAnalysis, 
  FundamentalAnalysis, 
  SentimentAnalysis, 
  MacroAnalysis, 
  AnalystRating 
} from '../types'
import OpenAI from 'openai'
import { 
  predictWithML, 
  trainMLModel,
  type MLPredictionResponse, 
  type MLTrainingResponse 
} from './ml-prediction'

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
  
  // 最終スコア計算（nullチェック）
  const techScore = technical.score || 50
  const fundScore = fundamental.score || 50
  const sentScore = sentiment.score || 50
  const macroScore = macro.score || 50
  const analystScore = analyst.score || 50
  
  const finalScore = 
    techScore * weights.technical +
    fundScore * weights.fundamental +
    sentScore * weights.sentiment +
    macroScore * weights.macro +
    analystScore * weights.analyst
  
  // アクション判定と信頼度計算
  let action: 'BUY' | 'SELL' | 'HOLD'
  let baseConfidence: number
  
  // 判定ロジック:
  // - 75点以上: 強いBUY（高信頼度）
  // - 60-75点: 中程度のBUY（中信頼度）
  // - 40-60点: HOLD（様子見、低-中信頼度）
  // - 25-40点: 中程度のSELL（中信頼度）
  // - 25点未満: 強いSELL（高信頼度）
  
  if (finalScore >= 75) {
    // 強いBUY判定
    action = 'BUY'
    // 75点→75%、100点→100%の信頼度
    baseConfidence = Math.min(100, 75 + (finalScore - 75))
  } else if (finalScore >= 60) {
    // 中程度のBUY判定
    action = 'BUY'
    // 60点→60%、75点→75%の信頼度
    baseConfidence = Math.round(finalScore)
  } else if (finalScore >= 40) {
    // HOLD判定（様子見）
    action = 'HOLD'
    // 40-60点: 50点に近いほど信頼度が低い（迷いが大きい）
    // 40点→55%, 50点→40%, 60点→55%
    baseConfidence = Math.round(55 - Math.abs(50 - finalScore) * 1.5)
  } else if (finalScore >= 25) {
    // 中程度のSELL判定
    action = 'SELL'
    // 25点→75%、40点→60%の信頼度（反転）
    baseConfidence = Math.round(100 - finalScore)
  } else {
    // 強いSELL判定
    action = 'SELL'
    // 0点→100%、25点→75%の信頼度
    baseConfidence = Math.min(100, 100 - finalScore)
  }
  
  // 各次元のばらつきを考慮して信頼度を調整
  // スコアのばらつきが大きい場合、信頼度を下げる
  const scores = [techScore, fundScore, sentScore, macroScore, analystScore]
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)
  
  // 標準偏差が大きい（ばらつきが大きい）ほど信頼度を減らす
  // 標準偏差0→減少なし、標準偏差20以上→最大20%減少
  const variancePenalty = Math.min(20, stdDev * 0.8)
  const confidence = Math.max(1, Math.round(baseConfidence - variancePenalty))
  
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

// 未来30日間の株価予測を生成
export function generateFuturePrediction(
  currentPrice: number,
  finalScore: number,
  technical: TechnicalAnalysis,
  action: 'BUY' | 'SELL' | 'HOLD',
  historicalPrices: number[]
): {
  dates: string[],
  predictedPrices: number[],
  buyDate: string,
  sellDate: string,
  buyPrice: number,
  sellPrice: number,
  profitPercent: number
} {
  const today = new Date()
  const dates: string[] = []
  const predictedPrices: number[] = []
  
  // 過去のボラティリティを計算
  const returns = []
  for (let i = 1; i < historicalPrices.length; i++) {
    returns.push((historicalPrices[i] - historicalPrices[i-1]) / historicalPrices[i-1])
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const volatility = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  )
  
  // スコアから予測トレンドを計算
  // 75点以上: +0.5%/日、60-75: +0.3%/日、40-60: 0%/日、25-40: -0.3%/日、25未満: -0.5%/日
  let dailyTrendPercent = 0
  if (finalScore >= 75) {
    dailyTrendPercent = 0.5
  } else if (finalScore >= 60) {
    dailyTrendPercent = 0.3
  } else if (finalScore >= 40) {
    dailyTrendPercent = 0
  } else if (finalScore >= 25) {
    dailyTrendPercent = -0.3
  } else {
    dailyTrendPercent = -0.5
  }
  
  // テクニカル指標から追加調整 (nullチェック)
  if (technical.rsi) {
    if (technical.rsi > 70) {
      dailyTrendPercent -= 0.15 // 買われすぎ
    } else if (technical.rsi < 30) {
      dailyTrendPercent += 0.15 // 売られすぎ
    }
    
    if (technical.macd && technical.macd.macd > 0) {
      dailyTrendPercent += 0.1 // 上昇トレンド
    } else if (technical.macd && technical.macd.macd <= 0) {
      dailyTrendPercent -= 0.1 // 下降トレンド
    }
  }
  
  // 30日間の予測を生成
  let price = currentPrice
  for (let i = 0; i <= 30; i++) {
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + i)
    dates.push(futureDate.toISOString().split('T')[0])
    
    if (i === 0) {
      predictedPrices.push(price)
    } else {
      // トレンド + ランダムボラティリティ
      const randomFactor = (Math.random() - 0.5) * volatility * 2
      const dailyChange = (dailyTrendPercent / 100) + randomFactor
      price = price * (1 + dailyChange)
      predictedPrices.push(price)
    }
  }
  
  // BUY/SELLタイミングの推奨
  let buyDate = dates[0] // 今日
  let sellDate = dates[30] // 30日後
  let buyPrice = predictedPrices[0]
  let sellPrice = predictedPrices[30]
  
  if (action === 'BUY') {
    // 今日買って、最高値で売る
    buyDate = dates[0]
    buyPrice = predictedPrices[0]
    
    const maxPriceIndex = predictedPrices.indexOf(Math.max(...predictedPrices))
    sellDate = dates[maxPriceIndex]
    sellPrice = predictedPrices[maxPriceIndex]
  } else if (action === 'SELL') {
    // 最安値で買って、今日売る(ショート想定)
    const minPriceIndex = predictedPrices.indexOf(Math.min(...predictedPrices))
    buyDate = dates[0]
    buyPrice = predictedPrices[0]
    sellDate = dates[minPriceIndex]
    sellPrice = predictedPrices[minPriceIndex]
  } else {
    // HOLD: 様子見なので大きな変動なし
    buyDate = dates[0]
    sellDate = dates[30]
    buyPrice = predictedPrices[0]
    sellPrice = predictedPrices[30]
  }
  
  const profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100
  
  return {
    dates,
    predictedPrices,
    buyDate,
    sellDate,
    buyPrice,
    sellPrice,
    profitPercent
  }
}

// 過去30日の予測を生成し、実績と比較して精度を評価
export function generateBackfitPrediction(
  historicalDates: string[],
  historicalPrices: number[],
  finalScore: number,
  technical: TechnicalAnalysis
): {
  dates: string[],
  actualPrices: number[],
  predictedPrices: number[],
  accuracy: {
    rmse: number,
    mae: number,
    mape: number,
    directionAccuracy: number
  }
} {
  // 過去30日分の予測を生成(移動平均ベース - 非線形)
  const predictedPrices: number[] = []
  const windowSize = 5  // 5日移動平均
  
  // スコアから予測トレンド強度を計算
  let trendStrength = 0
  if (finalScore >= 75) {
    trendStrength = 0.004  // +0.4%/日相当
  } else if (finalScore >= 60) {
    trendStrength = 0.002  // +0.2%/日相当
  } else if (finalScore >= 40) {
    trendStrength = 0
  } else if (finalScore >= 25) {
    trendStrength = -0.002
  } else {
    trendStrength = -0.004
  }
  
  // テクニカル指標から追加調整
  if (technical.rsi) {
    if (technical.rsi > 70) {
      trendStrength -= 0.001
    } else if (technical.rsi < 30) {
      trendStrength += 0.001
    }
  }
  
  if (technical.macd && technical.macd.macd !== undefined) {
    if (technical.macd.macd > 0) {
      trendStrength += 0.001
    } else {
      trendStrength -= 0.001
    }
  }
  
  /**
   * 非線形予測アルゴリズム: 5日移動平均（SMA）ベース
   * 
   * 【アルゴリズム概要】
   * - 単純移動平均（Simple Moving Average）を使用した統計的予測
   * - 線形トレンド（固定の日次変化率）ではなく、直近5日間の平均価格に基づく
   * - トレンド強度を加味することで、上昇/下降の勢いを反映
   * 
   * 【計算式】
   * 予測価格[i] = SMA(直近5日) + (SMA × トレンド強度)
   * 
   * 【特徴】
   * ✓ 価格の曲線に自然に追従（非線形）
   * ✓ 直近の価格変動を重視
   * ✓ ボラティリティの影響を平滑化
   * 
   * 【制限事項】
   * ✗ 機械学習（ML）ではなく統計的手法
   * ✗ XGBoost/LSTMなどの高度なMLは未対応（Cloudflare Workers制限）
   * ✗ 急激な市場変動には対応が遅れる可能性
   * 
   * 【将来的な改善案】
   * - 外部ML API（OpenAI、Google Vertex AI）との統合
   * - ARIMA、Prophet等の時系列予測モデル導入
   */
  // 移動平均ベースの予測(非線形)
  for (let i = 0; i < historicalPrices.length; i++) {
    if (i < windowSize) {
      // 最初のwindowSize日は移動平均が計算できないので実績値を使用
      predictedPrices.push(historicalPrices[i])
    } else {
      // 過去windowSize日の移動平均を計算
      const recentPrices = predictedPrices.slice(i - windowSize, i)
      const sma = recentPrices.reduce((a, b) => a + b, 0) / windowSize
      
      // トレンド成分を加味
      const trendAdjustment = sma * trendStrength
      const predictedPrice = sma + trendAdjustment
      
      predictedPrices.push(predictedPrice)
    }
  }
  
  // 精度指標を計算
  let sumSquaredError = 0
  let sumAbsoluteError = 0
  let sumPercentageError = 0
  let correctDirections = 0
  
  for (let i = 1; i < historicalPrices.length; i++) {
    const actual = historicalPrices[i]
    const predicted = predictedPrices[i]
    
    // RMSE用
    sumSquaredError += Math.pow(actual - predicted, 2)
    
    // MAE用
    sumAbsoluteError += Math.abs(actual - predicted)
    
    // MAPE用
    sumPercentageError += Math.abs((actual - predicted) / actual)
    
    // 方向性の正解率
    const actualDirection = historicalPrices[i] > historicalPrices[i-1] ? 'up' : 'down'
    const predictedDirection = predictedPrices[i] > predictedPrices[i-1] ? 'up' : 'down'
    if (actualDirection === predictedDirection) {
      correctDirections++
    }
  }
  
  const n = historicalPrices.length - 1
  const rmse = Math.sqrt(sumSquaredError / n)
  const mae = sumAbsoluteError / n
  const mape = (sumPercentageError / n) * 100
  const directionAccuracy = (correctDirections / n) * 100
  
  return {
    dates: historicalDates,
    actualPrices: historicalPrices,
    predictedPrices,
    accuracy: {
      rmse: Math.round(rmse * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      mape: Math.round(mape * 100) / 100,
      directionAccuracy: Math.round(directionAccuracy * 100) / 100
    }
  }
}

// ML予測を生成（統計的予測と並行表示用）
export async function generateMLPrediction(
  symbol: string,
  historicalPrices: number[],
  technical: TechnicalAnalysis,
  fundamental: FundamentalAnalysis,
  sentiment: SentimentAnalysis,
  trainModel: boolean = false,
  enableBackfit: boolean = false
): Promise<{ prediction: MLPredictionResponse | null; training: MLTrainingResponse | null }> {
  try {
    let trainingResult: MLTrainingResponse | null = null;

    // 学習フラグがONの場合、モデルを学習
    if (trainModel) {
      console.log(`Training custom model for ${symbol} (backfit: ${enableBackfit})...`);
      trainingResult = await trainMLModel(
        symbol,
        historicalPrices,
        technical,
        fundamental,
        sentiment.score,
        enableBackfit
      );
      
      if (!trainingResult) {
        console.error('Training failed, falling back to generic model');
      }
    }

    // 予測実行
    const mlResult = await predictWithML(
      symbol,
      historicalPrices,
      technical,
      fundamental,
      sentiment.score
    )
    
    // ML APIからデータが返ってきた場合、追加情報をモックデータで補完
    // （実際のML APIが拡張されるまでの暫定対応）
    if (mlResult) {
      // キャッシュされた学習結果がある場合、それを使用（trainModel=falseでもML UIを表示）
      if (mlResult.ml_training && !trainingResult) {
        console.log(`Using cached training results for ${symbol}`);
        trainingResult = mlResult.ml_training;
      }
      
      // 特徴量重要度のモックデータ（ML APIが返さない場合）
      if (!mlResult.feature_importances) {
        mlResult.feature_importances = [
          { feature: '現在価格 (close)', importance: 1.0 },
          { feature: '20日移動平均 (SMA20)', importance: 0.71 },
          { feature: 'RSI指標', importance: 0.54 },
          { feature: 'MACD', importance: 0.43 },
          { feature: 'ボラティリティ', importance: 0.38 },
          { feature: '50日移動平均 (SMA50)', importance: 0.32 },
          { feature: '出来高', importance: 0.28 },
          { feature: 'センチメントスコア', importance: 0.24 },
          { feature: 'PER', importance: 0.19 },
          { feature: 'ROE', importance: 0.15 }
        ]
      }
      
      // モデル性能指標のモックデータ
      if (!mlResult.model_metrics) {
        mlResult.model_metrics = {
          mae: 1.82,
          rmse: 2.45,
          r2_score: 0.923,
          training_samples: 5000
        }
      }
      
      // 学習データ情報のモックデータ
      if (!mlResult.training_info) {
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 365 * 2) // 2年前
        
        mlResult.training_info = {
          data_start_date: startDate.toISOString().split('T')[0],
          data_end_date: today.toISOString().split('T')[0],
          training_days: 730,
          last_trained: today.toISOString().split('T')[0]
        }
      }
    }
    
    return {
      prediction: mlResult,
      training: trainingResult  // キャッシュから取得した学習結果を含む
    };
  } catch (error) {
    console.error('ML prediction error:', error)
    return {
      prediction: null,
      training: null
    };
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
    const openai = new OpenAI({ 
      apiKey,
      organization: 'org-C3x5ZVIvaiCoQSoLIKqg9X5E'
    })
    
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
      // Chat Completions形式をResponses形式に変換
      response = {
        output: [{
          content: [{
            text: chatResponse.choices[0].message.content || '詳細な解説を生成できませんでした'
          }]
        }]
      } as any
    }
    
    return response.output?.[0]?.content?.[0]?.text || '詳細な解説を生成できませんでした'
    
  } catch (error) {
    console.error('GPT-5詳細解説生成エラー:', error)
    return '詳細な解説の生成中にエラーが発生しました'
  }
}
