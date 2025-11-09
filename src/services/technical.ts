import type { TechnicalAnalysis } from '../types'

// 移動平均線を計算
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  const slice = prices.slice(-period)
  return slice.reduce((sum, price) => sum + price, 0) / period
}

// RSI（相対力指数）を計算
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50
  
  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }
  
  const recentChanges = changes.slice(-period)
  const gains = recentChanges.filter(c => c > 0).reduce((sum, c) => sum + c, 0) / period
  const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((sum, c) => sum + c, 0)) / period
  
  if (losses === 0) return 100
  const rs = gains / losses
  return 100 - (100 / (1 + rs))
}

// MACD（移動平均収束拡散法）を計算
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 }
  }
  
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12 - ema26
  
  // シグナル線の計算は簡略化（本来はMACD値のEMA9）
  const signal = macd * 0.9
  const histogram = macd - signal
  
  return { macd, signal, histogram }
}

// 指数移動平均を計算
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  
  const multiplier = 2 / (period + 1)
  let ema = calculateSMA(prices.slice(0, period), period)
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema
  }
  
  return ema
}

// ボリンジャーバンドを計算
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateSMA(prices, period)
  const slice = prices.slice(-period)
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
  const standardDeviation = Math.sqrt(variance)
  
  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev)
  }
}

export function performTechnicalAnalysis(prices: number[]): TechnicalAnalysis {
  if (!prices || prices.length === 0) {
    return {
      score: 50,
      sma20: 0,
      sma50: 0,
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      signals: ['データ不足'],
      confidence: 0
    }
  }
  
  const currentPrice = prices[prices.length - 1]
  const sma20 = calculateSMA(prices, 20)
  const sma50 = calculateSMA(prices, 50)
  const rsi = calculateRSI(prices, 14)
  const macd = calculateMACD(prices)
  const bollinger = calculateBollingerBands(prices, 20, 2)
  
  let score = 50
  const signals: string[] = []
  
  // SMAクロスオーバー判定
  if (sma20 > sma50) {
    score += 20
    signals.push('[OK] ゴールデンクロス（短期MA > 長期MA）')
  } else if (sma20 < sma50) {
    score -= 20
    signals.push('[ERROR] デッドクロス（短期MA < 長期MA）')
  } else {
    signals.push('⚪ 移動平均線は中立')
  }
  
  // RSI判定
  if (rsi < 30) {
    score += 15
    signals.push(`[OK] RSI売られすぎ (${rsi.toFixed(1)})`)
  } else if (rsi > 70) {
    score -= 15
    signals.push(`[ERROR] RSI買われすぎ (${rsi.toFixed(1)})`)
  } else {
    signals.push(`⚪ RSI中立 (${rsi.toFixed(1)})`)
  }
  
  // MACD判定
  if (macd.histogram > 0) {
    score += 15
    signals.push('[OK] MACD上昇トレンド')
  } else if (macd.histogram < 0) {
    score -= 15
    signals.push('[ERROR] MACD下降トレンド')
  }
  
  // ボリンジャーバンド判定
  if (currentPrice < bollinger.lower) {
    score += 10
    signals.push('[OK] ボリンジャーバンド下限突破（買いシグナル）')
  } else if (currentPrice > bollinger.upper) {
    score -= 10
    signals.push('[ERROR] ボリンジャーバンド上限突破（売りシグナル）')
  }
  
  // スコアを0-100に正規化
  score = Math.max(0, Math.min(100, score))
  
  // 信頼度計算（データ量に基づく）
  const confidence = Math.min(100, (prices.length / 50) * 100)
  
  return {
    score,
    sma20,
    sma50,
    rsi,
    macd,
    signals,
    confidence
  }
}
