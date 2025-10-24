import type { FundamentalAnalysis } from '../types'

interface FinancialMetrics {
  pe_ratio: number | null
  pb_ratio: number | null
  roe: number | null
  eps: number | null
  dividend_yield: number | null
  market_cap: number | null
  revenue_growth: number | null
  profit_margin: number | null
  debt_to_equity: number | null
}

export function performFundamentalAnalysis(metrics: FinancialMetrics): FundamentalAnalysis {
  let score = 50
  const signals: string[] = []
  
  // PER（株価収益率）判定
  if (metrics.pe_ratio !== null) {
    if (metrics.pe_ratio < 15) {
      score += 20
      signals.push(`[OK] PER割安 (${metrics.pe_ratio.toFixed(2)})`)
    } else if (metrics.pe_ratio > 30) {
      score -= 15
      signals.push(`[ERROR] PER割高 (${metrics.pe_ratio.toFixed(2)})`)
    } else {
      signals.push(`⚪ PER適正 (${metrics.pe_ratio.toFixed(2)})`)
    }
  } else {
    signals.push('[WARN] PERデータなし')
  }
  
  // PBR（株価純資産倍率）判定
  if (metrics.pb_ratio !== null) {
    if (metrics.pb_ratio < 1) {
      score += 15
      signals.push(`[OK] PBR超割安 (${metrics.pb_ratio.toFixed(2)})`)
    } else if (metrics.pb_ratio > 3) {
      score -= 10
      signals.push(`[ERROR] PBR割高 (${metrics.pb_ratio.toFixed(2)})`)
    } else {
      signals.push(`⚪ PBR適正 (${metrics.pb_ratio.toFixed(2)})`)
    }
  } else {
    signals.push('[WARN] PBRデータなし')
  }
  
  // ROE（自己資本利益率）判定
  if (metrics.roe !== null) {
    if (metrics.roe > 15) {
      score += 15
      signals.push(`[OK] ROE優良 (${metrics.roe.toFixed(2)}%)`)
    } else if (metrics.roe < 5) {
      score -= 10
      signals.push(`[ERROR] ROE低迷 (${metrics.roe.toFixed(2)}%)`)
    } else {
      signals.push(`⚪ ROE標準 (${metrics.roe.toFixed(2)}%)`)
    }
  } else {
    signals.push('[WARN] ROEデータなし')
  }
  
  // 配当利回り判定
  if (metrics.dividend_yield !== null) {
    if (metrics.dividend_yield > 3) {
      score += 10
      signals.push(`[OK] 高配当 (${metrics.dividend_yield.toFixed(2)}%)`)
    } else if (metrics.dividend_yield > 0) {
      signals.push(`⚪ 配当あり (${metrics.dividend_yield.toFixed(2)}%)`)
    } else {
      signals.push('⚪ 無配当')
    }
  }
  
  // 売上成長率判定
  if (metrics.revenue_growth !== null) {
    if (metrics.revenue_growth > 20) {
      score += 10
      signals.push(`[OK] 高成長 (売上+${metrics.revenue_growth.toFixed(1)}%)`)
    } else if (metrics.revenue_growth < 0) {
      score -= 10
      signals.push(`[ERROR] 売上減少 (${metrics.revenue_growth.toFixed(1)}%)`)
    }
  }
  
  // 利益率判定
  if (metrics.profit_margin !== null) {
    if (metrics.profit_margin > 20) {
      score += 5
      signals.push(`[OK] 高利益率 (${metrics.profit_margin.toFixed(1)}%)`)
    } else if (metrics.profit_margin < 5) {
      score -= 5
      signals.push(`[ERROR] 低利益率 (${metrics.profit_margin.toFixed(1)}%)`)
    }
  }
  
  // 負債比率判定
  if (metrics.debt_to_equity !== null) {
    if (metrics.debt_to_equity < 0.5) {
      score += 5
      signals.push(`[OK] 健全な財務 (D/E: ${metrics.debt_to_equity.toFixed(2)})`)
    } else if (metrics.debt_to_equity > 2) {
      score -= 5
      signals.push(`[ERROR] 高負債 (D/E: ${metrics.debt_to_equity.toFixed(2)})`)
    }
  }
  
  // スコアを0-100に正規化
  score = Math.max(0, Math.min(100, score))
  
  // 信頼度計算（データの充実度に基づく）
  const dataCount = Object.values(metrics).filter(v => v !== null).length
  const confidence = (dataCount / Object.keys(metrics).length) * 100
  
  return {
    score,
    pe_ratio: metrics.pe_ratio,
    pb_ratio: metrics.pb_ratio,
    roe: metrics.roe,
    eps: metrics.eps,
    dividend_yield: metrics.dividend_yield,
    market_cap: metrics.market_cap,
    signals,
    confidence
  }
}
