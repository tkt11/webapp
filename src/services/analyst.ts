import type { AnalystRating } from '../types'

interface AnalystData {
  target_price: number | null
  consensus: string | null
  buy: number
  hold: number
  sell: number
  strong_buy: number
  strong_sell: number
}

export function analyzeAnalystRating(
  data: AnalystData,
  currentPrice: number
): AnalystRating {
  
  let score = 50
  const totalRecommendations = data.buy + data.hold + data.sell + data.strong_buy + data.strong_sell
  
  // コンセンサス判定
  let consensus: 'BUY' | 'SELL' | 'HOLD' | null = null
  
  if (data.consensus) {
    const cons = data.consensus.toLowerCase()
    if (cons.includes('buy') || cons.includes('strong buy')) {
      consensus = 'BUY'
      score += 30
    } else if (cons.includes('sell') || cons.includes('strong sell')) {
      consensus = 'SELL'
      score -= 30
    } else {
      consensus = 'HOLD'
    }
  } else if (totalRecommendations > 0) {
    // コンセンサスがない場合は集計から判定
    const buyScore = (data.strong_buy * 2 + data.buy) / totalRecommendations
    const sellScore = (data.strong_sell * 2 + data.sell) / totalRecommendations
    
    if (buyScore > 0.6) {
      consensus = 'BUY'
      score += 30
    } else if (sellScore > 0.4) {
      consensus = 'SELL'
      score -= 30
    } else {
      consensus = 'HOLD'
    }
  }
  
  // 目標株価との比較
  let upside: number | null = null
  
  if (data.target_price && data.target_price > 0) {
    upside = ((data.target_price - currentPrice) / currentPrice) * 100
    
    if (upside > 20) {
      score += 20
    } else if (upside > 10) {
      score += 10
    } else if (upside < -10) {
      score -= 20
    } else if (upside < 0) {
      score -= 10
    }
  }
  
  // 推奨の分布を評価
  if (totalRecommendations > 0) {
    const strongBuyRatio = data.strong_buy / totalRecommendations
    const strongSellRatio = data.strong_sell / totalRecommendations
    
    if (strongBuyRatio > 0.3) {
      score += 10
    } else if (strongSellRatio > 0.3) {
      score -= 10
    }
  }
  
  // スコアを0-100に正規化
  score = Math.max(0, Math.min(100, score))
  
  // 信頼度計算（アナリスト数に基づく）
  const confidence = totalRecommendations > 0 
    ? Math.min(100, (totalRecommendations / 10) * 100)
    : 0
  
  return {
    score,
    consensus,
    target_price: data.target_price,
    current_price: currentPrice,
    upside,
    recommendation_count: totalRecommendations,
    confidence
  }
}
