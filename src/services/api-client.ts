// 外部API通信クライアント

interface AlphaVantageResponse {
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string
      '2. high': string
      '3. low': string
      '4. close': string
      '5. volume': string
    }
  }
  'Meta Data': {
    '2. Symbol': string
    '3. Last Refreshed': string
  }
}

interface FinnhubQuoteResponse {
  c: number  // current price
  h: number  // high
  l: number  // low
  o: number  // open
  pc: number // previous close
  t: number  // timestamp
}

interface FinnhubMetricsResponse {
  metric: {
    peNormalizedAnnual: number | null
    pbAnnual: number | null
    roeTTM: number | null
    epsBasicExclExtraItemsTTM: number | null
    dividendYieldIndicatedAnnual: number | null
    marketCapitalization: number | null
    revenueGrowthTTMYoy: number | null
    netMarginAnnual: number | null
    'totalDebt/totalEquityAnnual': number | null
  }
}

// Alpha Vantage: 株価データ取得
export async function fetchStockPrices(symbol: string, apiKey: string): Promise<{
  prices: number[]
  dates: string[]
  current_price: number
}> {
  // outputsize=full で最大20年分のデータを取得（学習用に十分なデータ確保）
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`
  
  console.log(`[API] Fetching stock prices for ${symbol}...`)
  const response = await fetch(url)
  const data = await response.json() as AlphaVantageResponse
  
  console.log(`[API] Alpha Vantage response keys:`, Object.keys(data))
  
  // エラーメッセージチェック
  if (data['Error Message']) {
    console.error(`[API] Alpha Vantage error:`, data['Error Message'])
    throw new Error(`Alpha Vantage API error: ${data['Error Message']}`)
  }
  
  // レート制限チェック
  if (data['Note']) {
    console.error(`[API] Alpha Vantage rate limit:`, data['Note'])
    throw new Error(`Alpha Vantage rate limit exceeded. Please try again later.`)
  }
  
  // 情報メッセージチェック
  if (data['Information']) {
    console.error(`[API] Alpha Vantage info:`, data['Information'])
    throw new Error(`Alpha Vantage: ${data['Information']}`)
  }
  
  if (!data['Time Series (Daily)']) {
    console.error(`[API] No time series data found. Response:`, JSON.stringify(data).substring(0, 500))
    throw new Error(`株価データの取得に失敗しました。APIレスポンス: ${JSON.stringify(Object.keys(data))}`)
  }
  
  const timeSeries = data['Time Series (Daily)']
  // 最新から最大730日分（2年間）を取得してソート
  const dates = Object.keys(timeSeries).sort().slice(-730)
  const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']))
  
  console.log(`[API] Fetched ${prices.length} days of price data for ${symbol}`);
  
  return {
    prices,
    dates,
    current_price: prices[prices.length - 1]
  }
}

// Finnhub: リアルタイム株価取得
export async function fetchCurrentPrice(symbol: string, apiKey: string): Promise<number> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json() as FinnhubQuoteResponse
  
  return data.c || 0
}

// Finnhub: 財務指標取得
export async function fetchFinancialMetrics(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json() as FinnhubMetricsResponse
  
  const metric = data.metric || {}
  
  return {
    pe_ratio: metric.peNormalizedAnnual ?? null,
    pb_ratio: metric.pbAnnual ?? null,
    roe: metric.roeTTM ?? null,
    eps: metric.epsBasicExclExtraItemsTTM ?? null,
    dividend_yield: metric.dividendYieldIndicatedAnnual ?? null,
    market_cap: metric.marketCapitalization ?? null,
    revenue_growth: metric.revenueGrowthTTMYoy ?? null,
    profit_margin: metric.netMarginAnnual ?? null,
    debt_to_equity: metric['totalDebt/totalEquityAnnual'] ?? null
  }
}

// Finnhub: ニュース取得
export async function fetchNews(symbol: string, apiKey: string, limit: number = 20) {
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const fromDate = weekAgo.toISOString().split('T')[0]
  const toDate = today.toISOString().split('T')[0]
  
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  // limit パラメータで取得件数を制限（デフォルト20件）
  return Array.isArray(data) ? data.slice(0, limit) : []
}

// Finnhub: アナリスト推奨取得
export async function fetchAnalystRatings(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (!Array.isArray(data) || data.length === 0) {
    return {
      buy: 0,
      hold: 0,
      sell: 0,
      strong_buy: 0,
      strong_sell: 0,
      consensus: null
    }
  }
  
  const latest = data[0]
  return {
    buy: latest.buy || 0,
    hold: latest.hold || 0,
    sell: latest.sell || 0,
    strong_buy: latest.strongBuy || 0,
    strong_sell: latest.strongSell || 0,
    consensus: null  // コンセンサスは計算で求める
  }
}

// Finnhub: 目標株価取得
export async function fetchTargetPrice(symbol: string, apiKey: string): Promise<number | null> {
  const url = `https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  return data.targetMean || data.targetMedian || null
}

// FRED: マクロ経済指標取得
export async function fetchMacroIndicators(apiKey: string) {
  try {
    // GDP成長率
    const gdpUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=A191RL1Q225SBEA&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    const gdpResponse = await fetch(gdpUrl)
    const gdpData = await gdpResponse.json()
    const gdpGrowth = gdpData.observations?.[0]?.value ? parseFloat(gdpData.observations[0].value) : null
    
    // 失業率
    const unempUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    const unempResponse = await fetch(unempUrl)
    const unempData = await unempResponse.json()
    const unemployment = unempData.observations?.[0]?.value ? parseFloat(unempData.observations[0].value) : null
    
    // インフレ率（CPI）
    const cpiUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${apiKey}&file_type=json&limit=13&sort_order=desc`
    const cpiResponse = await fetch(cpiUrl)
    const cpiData = await cpiResponse.json()
    let inflation: number | null = null
    if (cpiData.observations && cpiData.observations.length >= 13) {
      const current = parseFloat(cpiData.observations[0].value)
      const yearAgo = parseFloat(cpiData.observations[12].value)
      inflation = ((current - yearAgo) / yearAgo) * 100
    }
    
    // 金利（Federal Funds Rate）
    const rateUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=DFF&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    const rateResponse = await fetch(rateUrl)
    const rateData = await rateResponse.json()
    const interestRate = rateData.observations?.[0]?.value ? parseFloat(rateData.observations[0].value) : null
    
    return {
      gdp_growth: gdpGrowth,
      unemployment,
      inflation,
      interest_rate: interestRate
    }
  } catch (error) {
    console.error('マクロ経済指標取得エラー:', error)
    return {
      gdp_growth: null,
      unemployment: null,
      inflation: null,
      interest_rate: null
    }
  }
}

// S&P 500主要50銘柄リスト
export const SP500_TOP_50 = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
  'XOM', 'V', 'PG', 'JPM', 'MA', 'HD', 'CVX', 'LLY', 'ABBV', 'MRK',
  'PEP', 'KO', 'AVGO', 'COST', 'TMO', 'WMT', 'MCD', 'CSCO', 'DIS', 'ACN',
  'ABT', 'VZ', 'ADBE', 'NKE', 'CRM', 'NFLX', 'CMCSA', 'INTC', 'PFE', 'DHR',
  'TXN', 'PM', 'NEE', 'UNP', 'RTX', 'WFC', 'BMY', 'HON', 'QCOM', 'AMD'
]
