import type { MacroAnalysis } from '../types'

interface MacroIndicators {
  gdp_growth: number | null
  unemployment: number | null
  inflation: number | null
  interest_rate: number | null
}

export function analyzeMacroEconomics(indicators: MacroIndicators): MacroAnalysis {
  let score = 50
  const signals: string[] = []
  
  // GDP成長率判定
  if (indicators.gdp_growth !== null) {
    if (indicators.gdp_growth > 2.5) {
      score += 15
      signals.push(`[OK] 経済拡大 (GDP成長率: ${indicators.gdp_growth.toFixed(1)}%)`)
    } else if (indicators.gdp_growth < 0) {
      score -= 15
      signals.push(`[ERROR] 景気後退 (GDP成長率: ${indicators.gdp_growth.toFixed(1)}%)`)
    } else {
      signals.push(`⚪ 経済安定 (GDP成長率: ${indicators.gdp_growth.toFixed(1)}%)`)
    }
  } else {
    signals.push('[WARN] GDPデータなし')
  }
  
  // 失業率判定
  if (indicators.unemployment !== null) {
    if (indicators.unemployment < 4) {
      score += 10
      signals.push(`[OK] 完全雇用に近い (失業率: ${indicators.unemployment.toFixed(1)}%)`)
    } else if (indicators.unemployment > 7) {
      score -= 10
      signals.push(`[ERROR] 高失業率 (${indicators.unemployment.toFixed(1)}%)`)
    } else {
      signals.push(`⚪ 標準的失業率 (${indicators.unemployment.toFixed(1)}%)`)
    }
  } else {
    signals.push('[WARN] 失業率データなし')
  }
  
  // インフレ率（CPI）判定
  if (indicators.inflation !== null) {
    if (indicators.inflation > 4) {
      score -= 15
      signals.push(`[ERROR] 高インフレ (${indicators.inflation.toFixed(1)}%) - 利上げリスク`)
    } else if (indicators.inflation < 1) {
      score -= 5
      signals.push(`[WARN] 低インフレ (${indicators.inflation.toFixed(1)}%) - デフレ懸念`)
    } else if (indicators.inflation >= 2 && indicators.inflation <= 3) {
      score += 5
      signals.push(`[OK] 理想的インフレ (${indicators.inflation.toFixed(1)}%)`)
    } else {
      signals.push(`⚪ 標準的インフレ (${indicators.inflation.toFixed(1)}%)`)
    }
  } else {
    signals.push('[WARN] インフレデータなし')
  }
  
  // 金利判定
  if (indicators.interest_rate !== null) {
    if (indicators.interest_rate < 2) {
      score += 10
      signals.push(`[OK] 低金利環境 (${indicators.interest_rate.toFixed(2)}%) - 企業に有利`)
    } else if (indicators.interest_rate > 5) {
      score -= 10
      signals.push(`[ERROR] 高金利環境 (${indicators.interest_rate.toFixed(2)}%) - 企業コスト増`)
    } else {
      signals.push(`⚪ 標準的金利 (${indicators.interest_rate.toFixed(2)}%)`)
    }
  } else {
    signals.push('[WARN] 金利データなし')
  }
  
  // 総合的なマクロ環境判定
  if (indicators.gdp_growth && indicators.gdp_growth > 2 && 
      indicators.unemployment && indicators.unemployment < 5 &&
      indicators.inflation && indicators.inflation >= 2 && indicators.inflation <= 3) {
    score += 10
    signals.push('[OK] 理想的なマクロ経済環境（ゴルディロックス）')
  }
  
  // スコアを0-100に正規化
  score = Math.max(0, Math.min(100, score))
  
  // 信頼度計算
  const dataCount = Object.values(indicators).filter(v => v !== null).length
  const confidence = (dataCount / Object.keys(indicators).length) * 100
  
  return {
    score,
    gdp_growth: indicators.gdp_growth,
    unemployment: indicators.unemployment,
    inflation: indicators.inflation,
    interest_rate: indicators.interest_rate,
    signals,
    confidence
  }
}
