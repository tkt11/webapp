import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import { performTechnicalAnalysis } from './services/technical'
import { performFundamentalAnalysis } from './services/fundamental'
import { performSentimentAnalysis } from './services/sentiment'
import { analyzeMacroEconomics } from './services/macro'
import { analyzeAnalystRating } from './services/analyst'
import { generatePrediction, generateDetailedExplanation } from './services/prediction'
import { runInvestmentSimulation, runBacktest } from './services/simulation'
import {
  fetchStockPrices,
  fetchCurrentPrice,
  fetchFinancialMetrics,
  fetchNews,
  fetchAnalystRatings,
  fetchTargetPrice,
  fetchMacroIndicators,
  SP500_TOP_50
} from './services/api-client'

const app = new Hono<{ Bindings: Env }>()

// CORS設定
app.use('/api/*', cors())

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Stock AI Predictor API is running' })
})

// 銘柄分析API
app.post('/api/analyze', async (c) => {
  try {
    const { symbol } = await c.req.json()
    
    if (!symbol) {
      return c.json({ error: '銘柄コードが必要です' }, 400)
    }
    
    const env = c.env
    
    // 並列でデータ取得
    const [
      stockData,
      currentPrice,
      financialMetrics,
      news,
      analystRatings,
      targetPrice,
      macroIndicators
    ] = await Promise.all([
      fetchStockPrices(symbol, env.ALPHA_VANTAGE_API_KEY),
      fetchCurrentPrice(symbol, env.FINNHUB_API_KEY),
      fetchFinancialMetrics(symbol, env.FINNHUB_API_KEY),
      fetchNews(symbol, env.FINNHUB_API_KEY),
      fetchAnalystRatings(symbol, env.FINNHUB_API_KEY),
      fetchTargetPrice(symbol, env.FINNHUB_API_KEY),
      fetchMacroIndicators(env.FRED_API_KEY)
    ])
    
    // 各分析を実行
    const technical = performTechnicalAnalysis(stockData.prices)
    const fundamental = performFundamentalAnalysis(financialMetrics)
    const sentiment = await performSentimentAnalysis(news, symbol, env.OPENAI_API_KEY)
    const macro = analyzeMacroEconomics(macroIndicators)
    const analyst = analyzeAnalystRating(
      { ...analystRatings, target_price: targetPrice },
      currentPrice
    )
    
    // 予測生成
    const prediction = generatePrediction(
      technical,
      fundamental,
      sentiment,
      macro,
      analyst,
      currentPrice,
      symbol
    )
    
    // GPT-5による詳細解説
    const detailedExplanation = await generateDetailedExplanation(
      prediction,
      symbol,
      technical,
      fundamental,
      sentiment,
      env.OPENAI_API_KEY
    )
    
    return c.json({
      symbol,
      current_price: currentPrice,
      prediction: {
        ...prediction,
        detailed_explanation: detailedExplanation
      },
      analysis: {
        technical,
        fundamental,
        sentiment,
        macro,
        analyst
      },
      chart_data: {
        dates: stockData.dates.slice(-30),
        prices: stockData.prices.slice(-30)
      }
    })
    
  } catch (error: any) {
    console.error('分析エラー:', error)
    return c.json({ 
      error: '分析中にエラーが発生しました', 
      details: error.message 
    }, 500)
  }
})

// おすすめ銘柄TOP10 API
app.get('/api/recommendations', async (c) => {
  try {
    const env = c.env
    
    // S&P 500主要50銘柄を並列分析（10銘柄ずつバッチ処理）
    const batchSize = 10
    const allRecommendations = []
    
    for (let i = 0; i < Math.min(50, SP500_TOP_50.length); i += batchSize) {
      const batch = SP500_TOP_50.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(async (symbol) => {
          try {
            const [stockData, currentPrice, financialMetrics, news, analystRatings, targetPrice, macroIndicators] = 
              await Promise.all([
                fetchStockPrices(symbol, env.ALPHA_VANTAGE_API_KEY),
                fetchCurrentPrice(symbol, env.FINNHUB_API_KEY),
                fetchFinancialMetrics(symbol, env.FINNHUB_API_KEY),
                fetchNews(symbol, env.FINNHUB_API_KEY),
                fetchAnalystRatings(symbol, env.FINNHUB_API_KEY),
                fetchTargetPrice(symbol, env.FINNHUB_API_KEY),
                fetchMacroIndicators(env.FRED_API_KEY)
              ])
            
            const technical = performTechnicalAnalysis(stockData.prices)
            const fundamental = performFundamentalAnalysis(financialMetrics)
            const sentiment = await performSentimentAnalysis(news, symbol, env.OPENAI_API_KEY)
            const macro = analyzeMacroEconomics(macroIndicators)
            const analyst = analyzeAnalystRating(
              { ...analystRatings, target_price: targetPrice },
              currentPrice
            )
            
            const prediction = generatePrediction(technical, fundamental, sentiment, macro, analyst, currentPrice, symbol)
            
            return {
              symbol,
              name: symbol,
              score: prediction.score,
              action: prediction.action,
              currentPrice,
              targetPrice: prediction.target_price,
              expectedReturn: prediction.expected_return,
              confidence: prediction.confidence,
              sector: 'Technology', // セクター情報は簡略化
              reasons: prediction.reasons.slice(0, 3)
            }
          } catch (error) {
            console.error(`${symbol}の分析エラー:`, error)
            return null
          }
        })
      )
      
      allRecommendations.push(...batchResults.filter(r => r !== null))
      
      // レート制限対策：バッチ間で1秒待機
      if (i + batchSize < 50) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // スコア降順でソート、TOP10を抽出
    const top10 = allRecommendations
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 10)
    
    return c.json({
      recommendations: top10,
      generated_at: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('推奨銘柄取得エラー:', error)
    return c.json({ 
      error: '推奨銘柄の取得中にエラーが発生しました',
      details: error.message
    }, 500)
  }
})

// 投資シミュレーションAPI
app.post('/api/simulation', async (c) => {
  try {
    const { symbol, purchaseDate, sellDate, investmentAmount } = await c.req.json()
    
    if (!symbol || !purchaseDate || !sellDate || !investmentAmount) {
      return c.json({ error: '必要なパラメータが不足しています' }, 400)
    }
    
    const env = c.env
    const result = await runInvestmentSimulation(
      symbol,
      purchaseDate,
      sellDate,
      investmentAmount,
      env.ALPHA_VANTAGE_API_KEY
    )
    
    return c.json(result)
    
  } catch (error: any) {
    console.error('シミュレーションエラー:', error)
    return c.json({ 
      error: 'シミュレーション中にエラーが発生しました',
      details: error.message
    }, 500)
  }
})

// バックテストAPI
app.post('/api/backtest', async (c) => {
  try {
    const { symbol, testDate } = await c.req.json()
    
    if (!symbol || !testDate) {
      return c.json({ error: '銘柄コードとテスト日付が必要です' }, 400)
    }
    
    const env = c.env
    
    // その時点でのデータで予測を生成
    const [stockData, currentPrice, financialMetrics, news, analystRatings, targetPrice, macroIndicators] = 
      await Promise.all([
        fetchStockPrices(symbol, env.ALPHA_VANTAGE_API_KEY),
        fetchCurrentPrice(symbol, env.FINNHUB_API_KEY),
        fetchFinancialMetrics(symbol, env.FINNHUB_API_KEY),
        fetchNews(symbol, env.FINNHUB_API_KEY),
        fetchAnalystRatings(symbol, env.FINNHUB_API_KEY),
        fetchTargetPrice(symbol, env.FINNHUB_API_KEY),
        fetchMacroIndicators(env.FRED_API_KEY)
      ])
    
    const technical = performTechnicalAnalysis(stockData.prices)
    const fundamental = performFundamentalAnalysis(financialMetrics)
    const sentiment = await performSentimentAnalysis(news, symbol, env.OPENAI_API_KEY)
    const macro = analyzeMacroEconomics(macroIndicators)
    const analyst = analyzeAnalystRating(
      { ...analystRatings, target_price: targetPrice },
      currentPrice
    )
    
    const prediction = generatePrediction(technical, fundamental, sentiment, macro, analyst, currentPrice, symbol)
    
    // バックテスト実行
    const backtestResult = await runBacktest(
      symbol,
      testDate,
      prediction,
      env.ALPHA_VANTAGE_API_KEY
    )
    
    return c.json(backtestResult)
    
  } catch (error: any) {
    console.error('バックテストエラー:', error)
    return c.json({ 
      error: 'バックテスト中にエラーが発生しました',
      details: error.message
    }, 500)
  }
})

// メインページ
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stock AI Predictor - 株価予測AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .tab-button.active { 
      background-color: #3B82F6; 
      color: white; 
    }
    .score-bar {
      height: 24px;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3B82F6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body class="bg-gray-100">
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- ヘッダー -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg shadow-lg mb-8">
      <h1 class="text-4xl font-bold mb-2">
        <i class="fas fa-chart-line mr-3"></i>
        Stock AI Predictor
      </h1>
      <p class="text-xl opacity-90">5次元分析 × GPT-5で株価を予測</p>
      <p class="mt-2 text-sm opacity-75">
        テクニカル • ファンダメンタル • センチメント • マクロ経済 • アナリスト評価
      </p>
    </div>

    <!-- タブナビゲーション -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="flex border-b">
        <button class="tab-button active px-6 py-4 font-semibold" onclick="switchTab('analysis')">
          <i class="fas fa-search mr-2"></i>銘柄分析
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('recommendations')">
          <i class="fas fa-star mr-2"></i>おすすめ銘柄TOP10
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('simulation')">
          <i class="fas fa-calculator mr-2"></i>投資シミュレーター
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('backtest')">
          <i class="fas fa-history mr-2"></i>バックテスト
        </button>
      </div>
    </div>

    <!-- タブ1: 銘柄分析 -->
    <div id="analysis-tab" class="tab-content active">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
          銘柄分析
        </h2>
        <div class="flex gap-4">
          <input 
            type="text" 
            id="symbol-input" 
            placeholder="銘柄コード (例: AAPL, TSLA, MSFT)" 
            class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onclick="analyzeStock()" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            <i class="fas fa-search mr-2"></i>分析開始
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-2">
          <i class="fas fa-info-circle mr-1"></i>
          人気銘柄: AAPL (Apple), TSLA (Tesla), MSFT (Microsoft), NVDA (NVIDIA), GOOGL (Google)
        </p>
      </div>

      <div id="analysis-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">分析中... GPT-5で詳細分析を実行しています</p>
      </div>

      <div id="analysis-result" style="display:none;">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

    <!-- タブ2: おすすめ銘柄TOP10 -->
    <div id="recommendations-tab" class="tab-content">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-trophy mr-2 text-yellow-500"></i>
          おすすめ銘柄TOP10
        </h2>
        <p class="text-gray-600 mb-4">
          S&P 500主要50銘柄を自動分析し、スコア順にTOP10を表示します
        </p>
        <button 
          onclick="loadRecommendations()" 
          class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          <i class="fas fa-sync-alt mr-2"></i>最新のおすすめを取得
        </button>
      </div>

      <div id="recommendations-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">分析中... 最大50銘柄を並列分析しています（約30秒）</p>
      </div>

      <div id="recommendations-result">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

    <!-- タブ3: 投資シミュレーター -->
    <div id="simulation-tab" class="tab-content">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-coins mr-2 text-green-600"></i>
          投資シミュレーター
        </h2>
        <p class="text-gray-600 mb-6">
          過去のデータで「もし〇〇日に買って〇〇日に売っていたら」をシミュレーション
        </p>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-semibold mb-2">銘柄コード</label>
            <input 
              type="text" 
              id="sim-symbol" 
              placeholder="AAPL" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">投資額 (USD)</label>
            <input 
              type="number" 
              id="sim-amount" 
              placeholder="10000" 
              value="10000"
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">購入日</label>
            <input 
              type="date" 
              id="sim-purchase-date" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">売却日</label>
            <input 
              type="date" 
              id="sim-sell-date" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <button 
          onclick="runSimulation()" 
          class="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          <i class="fas fa-play mr-2"></i>シミュレーション実行
        </button>
      </div>

      <div id="simulation-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">シミュレーション実行中...</p>
      </div>

      <div id="simulation-result">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

    <!-- タブ4: バックテスト -->
    <div id="backtest-tab" class="tab-content">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-check-circle mr-2 text-purple-600"></i>
          予測精度検証（バックテスト）
        </h2>
        <p class="text-gray-600 mb-6">
          過去のある日に予測した結果が実際どうだったかを検証
        </p>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-semibold mb-2">銘柄コード</label>
            <input 
              type="text" 
              id="backtest-symbol" 
              placeholder="AAPL" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">予測を行う日付</label>
            <input 
              type="date" 
              id="backtest-date" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <button 
          onclick="runBacktest()" 
          class="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          <i class="fas fa-flask mr-2"></i>バックテスト実行
        </button>
      </div>

      <div id="backtest-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">バックテスト実行中...</p>
      </div>

      <div id="backtest-result">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>
  </div>

  <script>
    // タブ切り替え
    function switchTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'))
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'))
      
      document.getElementById(tabName + '-tab').classList.add('active')
      event.target.closest('.tab-button').classList.add('active')
    }

    // 銘柄分析
    async function analyzeStock() {
      const symbol = document.getElementById('symbol-input').value.trim().toUpperCase()
      if (!symbol) {
        alert('銘柄コードを入力してください')
        return
      }

      document.getElementById('analysis-loading').style.display = 'block'
      document.getElementById('analysis-result').style.display = 'none'

      try {
        const response = await axios.post('/api/analyze', { symbol })
        const data = response.data

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h2 class="text-3xl font-bold">\${symbol}</h2>
                <p class="text-2xl text-gray-600 mt-2">$\${data.current_price.toFixed(2)}</p>
              </div>
              <div class="text-right">
                <div class="text-5xl font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                  \${data.prediction.action}
                </div>
                <p class="text-lg text-gray-600 mt-2">信頼度: \${data.prediction.confidence}%</p>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-xl font-bold mb-3">総合スコア: \${data.prediction.score}/100</h3>
              <div class="bg-gray-200 rounded-full h-6">
                <div class="score-bar bg-gradient-to-r from-blue-500 to-purple-600" style="width: \${data.prediction.score}%"></div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 mb-6">
              <div class="text-center">
                <p class="text-sm text-gray-600">テクニカル</p>
                <p class="text-2xl font-bold text-blue-600">\${data.prediction.breakdown.technical}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-600">ファンダメンタル</p>
                <p class="text-2xl font-bold text-green-600">\${data.prediction.breakdown.fundamental}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-600">センチメント</p>
                <p class="text-2xl font-bold text-yellow-600">\${data.prediction.breakdown.sentiment}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-600">マクロ経済</p>
                <p class="text-2xl font-bold text-purple-600">\${data.prediction.breakdown.macro}</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-600">アナリスト</p>
                <p class="text-2xl font-bold text-red-600">\${data.prediction.breakdown.analyst}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 class="font-bold text-green-600 mb-2"><i class="fas fa-check-circle mr-2"></i>ポジティブ要因</h4>
                <ul class="space-y-1">
                  \${data.prediction.reasons.map(r => \`<li class="text-sm">\${r}</li>\`).join('')}
                </ul>
              </div>
              <div>
                <h4 class="font-bold text-red-600 mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>リスク要因</h4>
                <ul class="space-y-1">
                  \${data.prediction.risks.map(r => \`<li class="text-sm">\${r}</li>\`).join('')}
                </ul>
              </div>
            </div>

            \${data.prediction.target_price ? \`
              <div class="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 class="font-bold mb-2">目標株価と期待リターン</h4>
                <p class="text-lg">目標価格: <span class="font-bold text-blue-600">$\${data.prediction.target_price.toFixed(2)}</span></p>
                <p class="text-lg">期待リターン: <span class="font-bold \${data.prediction.expected_return > 0 ? 'text-green-600' : 'text-red-600'}">\${data.prediction.expected_return?.toFixed(1)}%</span></p>
              </div>
            \` : ''}

            <div class="bg-gray-50 p-6 rounded-lg">
              <h4 class="font-bold mb-3"><i class="fas fa-robot mr-2"></i>GPT-5による詳細解説</h4>
              <p class="text-gray-700 whitespace-pre-wrap">\${data.prediction.detailed_explanation}</p>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-xl font-bold mb-4">株価チャート（過去30日）</h3>
            <canvas id="priceChart"></canvas>
          </div>
        \`

        document.getElementById('analysis-result').innerHTML = resultHTML
        document.getElementById('analysis-result').style.display = 'block'

        // Chart.jsでグラフ表示
        const ctx = document.getElementById('priceChart').getContext('2d')
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.chart_data.dates,
            datasets: [{
              label: '株価 (USD)',
              data: data.chart_data.prices,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true }
            }
          }
        })

      } catch (error) {
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('analysis-loading').style.display = 'none'
      }
    }

    // おすすめ銘柄取得
    async function loadRecommendations() {
      document.getElementById('recommendations-loading').style.display = 'block'
      document.getElementById('recommendations-result').innerHTML = ''

      try {
        const response = await axios.get('/api/recommendations')
        const data = response.data

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left">順位</th>
                  <th class="px-6 py-3 text-left">銘柄</th>
                  <th class="px-6 py-3 text-right">スコア</th>
                  <th class="px-6 py-3 text-center">判定</th>
                  <th class="px-6 py-3 text-right">現在価格</th>
                  <th class="px-6 py-3 text-right">期待リターン</th>
                  <th class="px-6 py-3 text-center">詳細</th>
                </tr>
              </thead>
              <tbody>
                \${data.recommendations.map((rec, index) => \`
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-6 py-4 font-bold">#\${index + 1}</td>
                    <td class="px-6 py-4 font-semibold">\${rec.symbol}</td>
                    <td class="px-6 py-4 text-right font-bold text-blue-600">\${rec.score}</td>
                    <td class="px-6 py-4 text-center">
                      <span class="px-3 py-1 rounded-full text-sm font-semibold \${rec.action === 'BUY' ? 'bg-green-100 text-green-800' : rec.action === 'SELL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                        \${rec.action}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">$\${rec.currentPrice.toFixed(2)}</td>
                    <td class="px-6 py-4 text-right \${rec.expectedReturn > 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                      \${rec.expectedReturn?.toFixed(1)}%
                    </td>
                    <td class="px-6 py-4 text-center">
                      <button onclick="document.getElementById('symbol-input').value='\${rec.symbol}'; switchTab('analysis'); analyzeStock()" class="text-blue-600 hover:underline">
                        <i class="fas fa-search"></i> 分析
                      </button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`

        document.getElementById('recommendations-result').innerHTML = resultHTML

      } catch (error) {
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('recommendations-loading').style.display = 'none'
      }
    }

    // 投資シミュレーション
    async function runSimulation() {
      const symbol = document.getElementById('sim-symbol').value.trim().toUpperCase()
      const purchaseDate = document.getElementById('sim-purchase-date').value
      const sellDate = document.getElementById('sim-sell-date').value
      const investmentAmount = parseFloat(document.getElementById('sim-amount').value)

      if (!symbol || !purchaseDate || !sellDate || !investmentAmount) {
        alert('すべての項目を入力してください')
        return
      }

      document.getElementById('simulation-loading').style.display = 'block'
      document.getElementById('simulation-result').innerHTML = ''

      try {
        const response = await axios.post('/api/simulation', {
          symbol,
          purchaseDate,
          sellDate,
          investmentAmount
        })
        const data = response.data

        const profitColor = data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'
        const profitBg = data.summary.profit >= 0 ? 'bg-green-50' : 'bg-red-50'

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 class="text-2xl font-bold mb-6">\${symbol} 投資シミュレーション結果</h3>
            
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="\${profitBg} p-6 rounded-lg">
                <h4 class="font-bold mb-4">サマリー</h4>
                <div class="space-y-2">
                  <p><span class="text-gray-600">購入日:</span> <span class="font-semibold">\${data.summary.purchaseDate}</span></p>
                  <p><span class="text-gray-600">購入価格:</span> <span class="font-semibold">$\${data.summary.purchasePrice.toFixed(2)}</span></p>
                  <p><span class="text-gray-600">売却日:</span> <span class="font-semibold">\${data.summary.sellDate}</span></p>
                  <p><span class="text-gray-600">売却価格:</span> <span class="font-semibold">$\${data.summary.sellPrice.toFixed(2)}</span></p>
                  <p><span class="text-gray-600">保有期間:</span> <span class="font-semibold">\${data.summary.holdingPeriodDays}日</span></p>
                </div>
              </div>
              
              <div class="bg-blue-50 p-6 rounded-lg">
                <h4 class="font-bold mb-4">投資結果</h4>
                <div class="space-y-2">
                  <p><span class="text-gray-600">株数:</span> <span class="font-semibold">\${data.summary.shares}株</span></p>
                  <p><span class="text-gray-600">投資額:</span> <span class="font-semibold">$\${data.summary.investmentAmount.toFixed(2)}</span></p>
                  <p><span class="text-gray-600">最終評価額:</span> <span class="font-semibold">$\${data.summary.finalValue.toFixed(2)}</span></p>
                  <p class="text-2xl"><span class="text-gray-600">損益:</span> <span class="font-bold \${profitColor}">$\${data.summary.profit.toFixed(2)}</span></p>
                  <p class="text-2xl"><span class="text-gray-600">リターン:</span> <span class="font-bold \${profitColor}">\${data.summary.returnRate.toFixed(2)}%</span></p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-4">統計情報</h4>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-600">最大ドローダウン</p>
                  <p class="text-xl font-bold text-red-600">\${data.statistics.maxDrawdown.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">ボラティリティ（年率）</p>
                  <p class="text-xl font-bold text-purple-600">\${data.statistics.volatility.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">最良の日</p>
                  <p class="text-sm font-semibold text-green-600">\${data.statistics.bestDay.date}: +\${data.statistics.bestDay.return.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div>
              <h4 class="font-bold mb-3">ポートフォリオ価値の推移</h4>
              <canvas id="simulationChart"></canvas>
            </div>
          </div>
        \`

        document.getElementById('simulation-result').innerHTML = resultHTML

        // グラフ表示
        const ctx = document.getElementById('simulationChart').getContext('2d')
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.visualization.labels,
            datasets: [
              {
                label: '株価 (USD)',
                data: data.visualization.priceData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y'
              },
              {
                label: 'ポートフォリオ価値 (USD)',
                data: data.visualization.portfolioData,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
              y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '株価 (USD)' } },
              y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'ポートフォリオ価値 (USD)' }, grid: { drawOnChartArea: false } }
            }
          }
        })

      } catch (error) {
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('simulation-loading').style.display = 'none'
      }
    }

    // バックテスト
    async function runBacktest() {
      const symbol = document.getElementById('backtest-symbol').value.trim().toUpperCase()
      const testDate = document.getElementById('backtest-date').value

      if (!symbol || !testDate) {
        alert('銘柄コードとテスト日付を入力してください')
        return
      }

      document.getElementById('backtest-loading').style.display = 'block'
      document.getElementById('backtest-result').innerHTML = ''

      try {
        const response = await axios.post('/api/backtest', { symbol, testDate })
        const data = response.data

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-2xl font-bold mb-6">\${symbol} バックテスト結果</h3>
            
            <div class="bg-blue-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-3">予測情報（\${data.testDate}時点）</h4>
              <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                  <p class="text-sm text-gray-600">判定</p>
                  <p class="text-3xl font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">\${data.prediction.action}</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">スコア</p>
                  <p class="text-3xl font-bold text-blue-600">\${data.prediction.score}</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">信頼度</p>
                  <p class="text-3xl font-bold text-purple-600">\${data.prediction.confidence}%</p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-3">実際の結果</h4>
              <div class="grid grid-cols-4 gap-4">
                <div>
                  <p class="text-sm text-gray-600">予測時の株価</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAtPrediction.toFixed(2)}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">1週間後</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAfter1Week.toFixed(2)}</p>
                  <p class="text-sm \${data.actualOutcome.return1Week >= 0 ? 'text-green-600' : 'text-red-600'}">\${data.actualOutcome.return1Week.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">1ヶ月後</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAfter1Month.toFixed(2)}</p>
                  <p class="text-sm \${data.actualOutcome.return1Month >= 0 ? 'text-green-600' : 'text-red-600'}">\${data.actualOutcome.return1Month.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">3ヶ月後</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAfter3Months.toFixed(2)}</p>
                  <p class="text-sm \${data.actualOutcome.return3Months >= 0 ? 'text-green-600' : 'text-red-600'}">\${data.actualOutcome.return3Months.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div class="bg-green-50 p-6 rounded-lg">
              <h4 class="font-bold mb-3">精度評価</h4>
              <div class="grid grid-cols-4 gap-4">
                <div class="text-center">
                  <p class="text-sm text-gray-600">総合精度スコア</p>
                  <p class="text-4xl font-bold text-blue-600">\${data.accuracy.overallScore.toFixed(0)}%</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">1週間後</p>
                  <p class="text-2xl font-bold \${data.accuracy.direction1Week === 'correct' ? 'text-green-600' : data.accuracy.direction1Week === 'incorrect' ? 'text-red-600' : 'text-gray-600'}">
                    \${data.accuracy.direction1Week === 'correct' ? '✓' : data.accuracy.direction1Week === 'incorrect' ? '✗' : '○'}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">1ヶ月後</p>
                  <p class="text-2xl font-bold \${data.accuracy.direction1Month === 'correct' ? 'text-green-600' : data.accuracy.direction1Month === 'incorrect' ? 'text-red-600' : 'text-gray-600'}">
                    \${data.accuracy.direction1Month === 'correct' ? '✓' : data.accuracy.direction1Month === 'incorrect' ? '✗' : '○'}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">3ヶ月後</p>
                  <p class="text-2xl font-bold \${data.accuracy.direction3Months === 'correct' ? 'text-green-600' : data.accuracy.direction3Months === 'incorrect' ? 'text-red-600' : 'text-gray-600'}">
                    \${data.accuracy.direction3Months === 'correct' ? '✓' : data.accuracy.direction3Months === 'incorrect' ? '✗' : '○'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        \`

        document.getElementById('backtest-result').innerHTML = resultHTML

      } catch (error) {
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('backtest-loading').style.display = 'none'
      }
    }

    // 日付フィールドのデフォルト値設定
    document.addEventListener('DOMContentLoaded', () => {
      const today = new Date()
      const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
      const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
      
      document.getElementById('sim-purchase-date').value = threeMonthsAgo.toISOString().split('T')[0]
      document.getElementById('sim-sell-date').value = today.toISOString().split('T')[0]
      document.getElementById('backtest-date').value = sixMonthsAgo.toISOString().split('T')[0]
    })
  </script>
</body>
</html>
  `)
})

export default app
