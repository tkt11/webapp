import type { SimulationResult, BacktestResult, PredictionResult } from '../types'
import { fetchStockPrices } from './api-client'

// 投資シミュレーション
export async function runInvestmentSimulation(
  symbol: string,
  purchaseDate: string,
  sellDate: string,
  investmentAmount: number,
  apiKey: string
): Promise<SimulationResult> {
  
  // 過去の株価データを取得
  const { prices, dates } = await fetchStockPrices(symbol, apiKey)
  
  // 購入日と売却日のインデックスを検索（柔軟な日付マッチング）
  const findClosestDateIndex = (targetDate: string): number => {
    const target = new Date(targetDate).getTime()
    let closestIndex = 0
    let minDiff = Infinity
    
    dates.forEach((date, index) => {
      const current = new Date(date).getTime()
      const diff = Math.abs(current - target)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = index
      }
    })
    
    return closestIndex
  }
  
  const purchaseIndex = findClosestDateIndex(purchaseDate)
  const sellIndex = findClosestDateIndex(sellDate)
  
  if (purchaseIndex === -1 || sellIndex === -1) {
    throw new Error(`指定された日付のデータが見つかりません。利用可能な日付範囲: ${dates[0]} ~ ${dates[dates.length-1]}`)
  }
  
  if (dates.length < 2) {
    throw new Error('十分な株価データがありません')
  }
  
  if (purchaseIndex >= sellIndex) {
    throw new Error('購入日は売却日より前である必要があります')
  }
  
  const purchasePrice = prices[purchaseIndex]
  const sellPrice = prices[sellIndex]
  
  // 投資シミュレーション計算
  const shares = Math.floor(investmentAmount / purchasePrice)
  const totalCost = shares * purchasePrice
  const totalValue = shares * sellPrice
  const profit = totalValue - totalCost
  const returnRate = (profit / totalCost) * 100
  
  // 期間中のパフォーマンス追跡
  const performance = []
  for (let i = purchaseIndex; i <= sellIndex; i++) {
    const portfolioValue = shares * prices[i]
    const unrealizedProfit = portfolioValue - totalCost
    const dailyReturnRate = (unrealizedProfit / totalCost) * 100
    
    performance.push({
      date: dates[i],
      price: prices[i],
      portfolioValue,
      unrealizedProfit,
      returnRate: dailyReturnRate
    })
  }
  
  // 統計情報の計算
  const returns = performance.map((p, i) => 
    i === 0 ? 0 : (p.price - performance[i-1].price) / performance[i-1].price
  )
  
  const maxDrawdown = calculateMaxDrawdown(performance.map(p => p.portfolioValue))
  const volatility = calculateVolatility(returns)
  
  const bestDay = performance.reduce((best, current, index) => {
    if (index === 0) return best
    const dailyReturn = (current.price - performance[index-1].price) / performance[index-1].price * 100
    return dailyReturn > best.return ? { date: current.date, return: dailyReturn } : best
  }, { date: '', return: -Infinity })
  
  const worstDay = performance.reduce((worst, current, index) => {
    if (index === 0) return worst
    const dailyReturn = (current.price - performance[index-1].price) / performance[index-1].price * 100
    return dailyReturn < worst.return ? { date: current.date, return: dailyReturn } : worst
  }, { date: '', return: Infinity })
  
  return {
    summary: {
      purchaseDate,
      purchasePrice,
      sellDate,
      sellPrice,
      shares,
      investmentAmount: totalCost,
      finalValue: totalValue,
      profit,
      returnRate,
      holdingPeriodDays: sellIndex - purchaseIndex
    },
    performance,
    statistics: {
      maxDrawdown,
      volatility,
      bestDay,
      worstDay
    },
    visualization: {
      labels: performance.map(p => p.date),
      priceData: performance.map(p => p.price),
      portfolioData: performance.map(p => p.portfolioValue),
      profitData: performance.map(p => p.unrealizedProfit)
    }
  }
}

// 最大ドローダウン計算
function calculateMaxDrawdown(values: number[]): number {
  let maxDrawdown = 0
  let peak = values[0]
  
  for (const value of values) {
    if (value > peak) {
      peak = value
    }
    const drawdown = ((peak - value) / peak) * 100
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  return maxDrawdown
}

// ボラティリティ計算
function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)
  
  // 年率換算（取引日数252日として）
  return stdDev * Math.sqrt(252) * 100
}

// バックテスト実行
export async function runBacktest(
  symbol: string,
  testDate: string,
  prediction: PredictionResult,
  apiKey: string
): Promise<BacktestResult> {
  
  const { prices, dates } = await fetchStockPrices(symbol, apiKey)
  
  // 柔軟な日付マッチングを使用
  const findClosestDateIndex = (targetDate: string): number => {
    const target = new Date(targetDate).getTime()
    let closestIndex = 0
    let minDiff = Infinity
    
    dates.forEach((date, index) => {
      const current = new Date(date).getTime()
      const diff = Math.abs(current - target)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = index
      }
    })
    
    return closestIndex
  }
  
  const testIndex = findClosestDateIndex(testDate)
  if (testIndex === -1 || dates.length === 0) {
    throw new Error('指定された日付のデータが見つかりません')
  }
  
  const priceAtPrediction = prices[testIndex]
  
  // 1週間後（5取引日後）
  const index1Week = testIndex + 5
  const priceAfter1Week = index1Week < prices.length ? prices[index1Week] : prices[prices.length - 1]
  const return1Week = ((priceAfter1Week - priceAtPrediction) / priceAtPrediction) * 100
  
  // 1ヶ月後（約20取引日後）
  const index1Month = testIndex + 20
  const priceAfter1Month = index1Month < prices.length ? prices[index1Month] : prices[prices.length - 1]
  const return1Month = ((priceAfter1Month - priceAtPrediction) / priceAtPrediction) * 100
  
  // 3ヶ月後（約60取引日後）
  const index3Months = testIndex + 60
  const priceAfter3Months = index3Months < prices.length ? prices[index3Months] : prices[prices.length - 1]
  const return3Months = ((priceAfter3Months - priceAtPrediction) / priceAtPrediction) * 100
  
  // 予測の方向性が正しかったか判定
  function checkDirection(actualReturn: number, predictedAction: string): 'correct' | 'incorrect' | 'neutral' {
    if (predictedAction === 'BUY' && actualReturn > 2) return 'correct'
    if (predictedAction === 'BUY' && actualReturn < -2) return 'incorrect'
    if (predictedAction === 'SELL' && actualReturn < -2) return 'correct'
    if (predictedAction === 'SELL' && actualReturn > 2) return 'incorrect'
    return 'neutral'
  }
  
  const direction1Week = checkDirection(return1Week, prediction.action)
  const direction1Month = checkDirection(return1Month, prediction.action)
  const direction3Months = checkDirection(return3Months, prediction.action)
  
  // 総合精度スコア計算
  const correctCount = [direction1Week, direction1Month, direction3Months].filter(d => d === 'correct').length
  const overallScore = (correctCount / 3) * 100
  
  return {
    testDate,
    prediction,
    actualOutcome: {
      priceAtPrediction,
      priceAfter1Week,
      priceAfter1Month,
      priceAfter3Months,
      return1Week,
      return1Month,
      return3Months
    },
    accuracy: {
      direction1Week,
      direction1Month,
      direction3Months,
      overallScore
    }
  }
}
