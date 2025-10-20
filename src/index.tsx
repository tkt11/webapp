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
    
    // GPT-4oによる詳細解説
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
    
    // S&P 500主要銘柄を並列分析（軽量化: 15銘柄のみ）
    const batchSize = 5
    const allRecommendations = []
    const maxStocks = 15  // 15銘柄に制限
    
    for (let i = 0; i < Math.min(maxStocks, SP500_TOP_50.length); i += batchSize) {
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
      
      // レート制限対策：バッチ間で0.5秒待機
      if (i + batchSize < maxStocks) {
        await new Promise(resolve => setTimeout(resolve, 500))
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
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.6);
      animation: fadeIn 0.3s;
    }
    .modal.active {
      display: block;
    }
    .modal-content {
      background-color: #fefefe;
      margin: 5% auto;
      padding: 0;
      border-radius: 12px;
      width: 90%;
      max-width: 900px;
      max-height: 85vh;
      overflow-y: auto;
      animation: slideDown 0.3s;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .score-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      border-radius: 8px;
      padding: 12px;
    }
    .score-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      border-color: #3B82F6;
      background-color: #F8FAFC;
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
      <p class="text-xl opacity-90">5次元分析 × GPT-4oで株価を予測</p>
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
        <p class="text-center text-gray-600">分析中... GPT-4oで詳細分析を実行しています</p>
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

  <!-- 詳細分析モーダル -->
  <div id="detailModal" class="modal">
    <div class="modal-content">
      <div id="modal-body">
        <!-- モーダルの内容はJavaScriptで動的に挿入 -->
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
        
        // グローバルに保存してモーダルから参照可能にする
        currentAnalysisData = data

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
              <div class="score-card text-center" onclick="showDetailModal('technical')">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-chart-line mr-1"></i>テクニカル</p>
                <p class="text-2xl font-bold text-blue-600">\${data.prediction.breakdown.technical}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div class="score-card text-center" onclick="showDetailModal('fundamental')">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-building mr-1"></i>ファンダメンタル</p>
                <p class="text-2xl font-bold text-green-600">\${data.prediction.breakdown.fundamental}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div class="score-card text-center" onclick="showDetailModal('sentiment')">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-newspaper mr-1"></i>センチメント</p>
                <p class="text-2xl font-bold text-yellow-600">\${data.prediction.breakdown.sentiment}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div class="score-card text-center" onclick="showDetailModal('macro')">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-globe mr-1"></i>マクロ経済</p>
                <p class="text-2xl font-bold text-purple-600">\${data.prediction.breakdown.macro}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div class="score-card text-center" onclick="showDetailModal('analyst')">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-user-tie mr-1"></i>アナリスト</p>
                <p class="text-2xl font-bold text-red-600">\${data.prediction.breakdown.analyst}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-4 text-center"><i class="fas fa-chart-radar mr-2"></i>5次元分析レーダーチャート</h4>
              <canvas id="radarChart" style="max-height: 300px;"></canvas>
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
              <h4 class="font-bold mb-3"><i class="fas fa-robot mr-2"></i>GPT-4oによる詳細解説</h4>
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

        // 5次元分析レーダーチャート
        const radarCtx = document.getElementById('radarChart').getContext('2d')
        new Chart(radarCtx, {
          type: 'radar',
          data: {
            labels: [
              'テクニカル (35%)',
              'ファンダメンタル (30%)',
              'センチメント (15%)',
              'マクロ経済 (10%)',
              'アナリスト (10%)'
            ],
            datasets: [{
              label: '各次元のスコア',
              data: [
                data.prediction.breakdown.technical,
                data.prediction.breakdown.fundamental,
                data.prediction.breakdown.sentiment,
                data.prediction.breakdown.macro,
                data.prediction.breakdown.analyst
              ],
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 2,
              pointBackgroundColor: 'rgb(99, 102, 241)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(99, 102, 241)',
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed.r + '点'
                  }
                }
              }
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

    // グローバルに分析データを保存
    let currentAnalysisData = null

    // 詳細モーダル表示
    function showDetailModal(dimension) {
      if (!currentAnalysisData) {
        alert('先に銘柄分析を実行してください')
        return
      }
      
      const data = currentAnalysisData
      const modal = document.getElementById('detailModal')
      const modalBody = document.getElementById('modal-body')
      
      let content = ''
      
      if (dimension === 'technical') {
        const tech = data.analysis.technical
        content = \`
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-chart-line mr-3"></i>テクニカル分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-blue-100">過去の価格データから統計的指標を算出</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-blue-800"><i class="fas fa-star mr-2"></i>テクニカルスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-blue-600">\${tech.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 35%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(tech.score * 0.35).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-blue-800"><i class="fas fa-chart-bar mr-2"></i>主要指標</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="border-l-4 border-blue-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">RSI (相対力指数)</p>
                  <p class="text-2xl font-bold">\${tech.indicators.rsi.toFixed(2)}</p>
                  <p class="text-xs text-gray-500 mt-1">\${tech.indicators.rsi < 30 ? '売られすぎ' : tech.indicators.rsi > 70 ? '買われすぎ' : '中立'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">MACD</p>
                  <p class="text-2xl font-bold">\${tech.indicators.macd.toFixed(4)}</p>
                  <p class="text-xs text-gray-500 mt-1">\${tech.indicators.macd > 0 ? '上昇トレンド' : '下降トレンド'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">短期MA (20日)</p>
                  <p class="text-2xl font-bold">$\${tech.indicators.sma20.toFixed(2)}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">長期MA (50日)</p>
                  <p class="text-2xl font-bold">$\${tech.indicators.sma50.toFixed(2)}</p>
                </div>
                <div class="border-l-4 border-red-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">ボラティリティ (標準偏差)</p>
                  <p class="text-2xl font-bold">\${tech.indicators.volatility.toFixed(4)}</p>
                </div>
                <div class="border-l-4 border-indigo-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">トレンド強度</p>
                  <p class="text-2xl font-bold">\${tech.indicators.trend.toFixed(4)}</p>
                  <p class="text-xs text-gray-500 mt-1">\${tech.indicators.trend > 0 ? '上昇' : '下降'}</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>計算方法</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li><strong>RSI:</strong> 過去14日間の価格変動から相対的な強弱を算出 (0-100)</li>
                <li><strong>MACD:</strong> 短期EMA(12) - 長期EMA(26) でトレンドの転換点を検出</li>
                <li><strong>移動平均線:</strong> 過去N日間の平均価格でトレンドを平滑化</li>
                <li><strong>ボラティリティ:</strong> 価格変動の標準偏差でリスクを測定</li>
                <li><strong>トレンド強度:</strong> 線形回帰の傾きで上昇/下降の強さを評価</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-brain mr-2"></i>シグナル解説</h3>
              <div class="space-y-2 text-sm">
                \${tech.indicators.sma20 > tech.indicators.sma50 ? 
                  '<p class="text-green-600">✅ <strong>ゴールデンクロス:</strong> 短期MAが長期MAを上回り、上昇トレンドを示唆</p>' : 
                  '<p class="text-red-600">❌ <strong>デッドクロス:</strong> 短期MAが長期MAを下回り、下降トレンドを示唆</p>'}
                \${tech.indicators.rsi < 30 ? 
                  '<p class="text-green-600">✅ <strong>買いシグナル:</strong> RSIが30未満で売られすぎ</p>' : 
                  tech.indicators.rsi > 70 ? 
                  '<p class="text-red-600">⚠️ <strong>警戒シグナル:</strong> RSIが70超で買われすぎ</p>' : 
                  '<p class="text-gray-600">ℹ️ <strong>中立:</strong> RSIは正常範囲内</p>'}
                \${tech.indicators.macd > 0 ? 
                  '<p class="text-green-600">✅ <strong>強気:</strong> MACDがプラスで上昇モメンタム</p>' : 
                  '<p class="text-red-600">⚠️ <strong>弱気:</strong> MACDがマイナスで下降モメンタム</p>'}
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border-2 border-blue-200">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-chart-area mr-2"></i>テクニカル指標チャート</h3>
              <canvas id="technicalChart"></canvas>
            </div>
          </div>
        \`
      } else if (dimension === 'fundamental') {
        const fund = data.analysis.fundamental
        content = \`
          <div class="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-building mr-3"></i>ファンダメンタル分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-green-100">企業の財務健全性と成長性を評価</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-green-800"><i class="fas fa-star mr-2"></i>ファンダメンタルスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-green-600">\${fund.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 30%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(fund.score * 0.30).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-green-800"><i class="fas fa-chart-bar mr-2"></i>財務指標</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="border-l-4 border-blue-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">PER (株価収益率)</p>
                  <p class="text-2xl font-bold">\${fund.metrics.pe?.toFixed(2) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.metrics.pe ? '-' : fund.metrics.pe < 15 ? '割安' : fund.metrics.pe > 25 ? '割高' : '適正'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">ROE (自己資本利益率)</p>
                  <p class="text-2xl font-bold">\${fund.metrics.roe?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.metrics.roe ? '-' : fund.metrics.roe > 15 ? '優良' : fund.metrics.roe > 10 ? '良好' : '低い'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">売上成長率</p>
                  <p class="text-2xl font-bold">\${fund.metrics.revenue_growth?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.metrics.revenue_growth ? '-' : fund.metrics.revenue_growth > 10 ? '高成長' : fund.metrics.revenue_growth > 0 ? '成長中' : 'マイナス成長'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">利益率</p>
                  <p class="text-2xl font-bold">\${fund.metrics.profit_margin?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.metrics.profit_margin ? '-' : fund.metrics.profit_margin > 20 ? '高収益' : fund.metrics.profit_margin > 10 ? '良好' : '低い'}</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>指標の意味</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li><strong>PER:</strong> 株価が1株あたり利益の何倍か。低いほど割安</li>
                <li><strong>ROE:</strong> 自己資本でどれだけ利益を生んだか。15%以上が優良</li>
                <li><strong>売上成長率:</strong> 前年比の売上増加率。10%以上が高成長</li>
                <li><strong>利益率:</strong> 売上に対する純利益の割合。高いほど効率的</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-lightbulb mr-2"></i>評価ポイント</h3>
              <div class="space-y-2 text-sm">
                <p class="text-gray-700">✓ PERが15未満: 割安と判断し、+20点</p>
                <p class="text-gray-700">✓ ROEが15%以上: 優良企業として+20点</p>
                <p class="text-gray-700">✓ 売上成長率が10%以上: 高成長企業として+30点</p>
                <p class="text-gray-700">✓ 利益率が20%以上: 高収益企業として+30点</p>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border-2 border-green-200">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-chart-radar mr-2"></i>ファンダメンタル評価チャート</h3>
              <canvas id="fundamentalChart"></canvas>
            </div>
          </div>
        \`
      } else if (dimension === 'sentiment') {
        const sent = data.analysis.sentiment
        content = \`
          <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-newspaper mr-3"></i>センチメント分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-yellow-100">最新ニュースをGPT-4oで分析</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-yellow-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-yellow-800"><i class="fas fa-star mr-2"></i>センチメントスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-yellow-600">\${sent.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 15%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(sent.score * 0.15).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-yellow-800"><i class="fas fa-newspaper mr-2"></i>ニュース分析</h3>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <p class="text-sm text-gray-600">ポジティブ</p>
                  <p class="text-3xl font-bold text-green-600">\${sent.positive_count || 0}</p>
                </div>
                <div class="bg-gray-50 border-l-4 border-gray-500 p-3 rounded">
                  <p class="text-sm text-gray-600">中立</p>
                  <p class="text-3xl font-bold text-gray-600">\${sent.neutral_count || 0}</p>
                </div>
                <div class="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p class="text-sm text-gray-600">ネガティブ</p>
                  <p class="text-3xl font-bold text-red-600">\${sent.negative_count || 0}</p>
                </div>
              </div>
              <div class="bg-blue-50 p-3 rounded">
                <p class="text-sm text-gray-600">分析ニュース総数</p>
                <p class="text-2xl font-bold text-blue-600">\${sent.total_articles || 0}件</p>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-robot mr-2"></i>GPT-4o分析</h3>
              <p class="text-sm text-gray-700 mb-2">最新20件のニュース記事をAIが自動分析し、市場センチメントを評価しています。</p>
              <ul class="space-y-1 text-sm text-gray-700">
                <li>✓ ニュース見出しと概要を自然言語処理</li>
                <li>✓ ポジティブ/ネガティブ/中立を分類</li>
                <li>✓ 記事の信頼性と影響度を考慮</li>
                <li>✓ 総合的なセンチメントスコアを算出</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>スコア計算式</h3>
              <div class="bg-white p-3 rounded border text-center text-sm font-mono">
                Score = 50 + (Positive × 10) - (Negative × 10) + (総記事数 × 1)
              </div>
              <p class="text-xs text-gray-600 mt-2 text-center">※ 最小0、最大100に正規化</p>
            </div>

            <div class="bg-white p-4 rounded-lg border-2 border-yellow-200">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-chart-pie mr-2"></i>センチメント分布チャート</h3>
              <canvas id="sentimentChart"></canvas>
            </div>
          </div>
        \`
      } else if (dimension === 'macro') {
        const macro = data.analysis.macro
        content = \`
          <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-globe mr-3"></i>マクロ経済分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-purple-100">米国の主要経済指標を評価</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-purple-800"><i class="fas fa-star mr-2"></i>マクロ経済スコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-purple-600">\${macro.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 10%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(macro.score * 0.10).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-purple-800"><i class="fas fa-chart-line mr-2"></i>経済指標</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="border-l-4 border-blue-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">GDP成長率</p>
                  <p class="text-2xl font-bold">\${macro.indicators.gdp_growth?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.indicators.gdp_growth ? '-' : macro.indicators.gdp_growth > 3 ? '強い経済' : macro.indicators.gdp_growth > 2 ? '健全' : '鈍化'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">失業率</p>
                  <p class="text-2xl font-bold">\${macro.indicators.unemployment?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.indicators.unemployment ? '-' : macro.indicators.unemployment < 4 ? '完全雇用' : macro.indicators.unemployment < 6 ? '正常' : '高い'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">インフレ率 (CPI)</p>
                  <p class="text-2xl font-bold">\${macro.indicators.inflation?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.indicators.inflation ? '-' : macro.indicators.inflation < 2 ? '低インフレ' : macro.indicators.inflation < 4 ? '適正' : '高インフレ'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">政策金利 (FF Rate)</p>
                  <p class="text-2xl font-bold">\${macro.indicators.interest_rate?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.indicators.interest_rate ? '-' : macro.indicators.interest_rate < 2 ? '低金利' : macro.indicators.interest_rate < 4 ? '中金利' : '高金利'}</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>指標の意味</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li><strong>GDP成長率:</strong> 経済全体の成長速度。3%以上が強い経済</li>
                <li><strong>失業率:</strong> 労働市場の健全性。4%未満が完全雇用</li>
                <li><strong>インフレ率:</strong> 物価上昇率。2%前後が適正</li>
                <li><strong>政策金利:</strong> FRBの金融政策。低金利は株式に有利</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-lightbulb mr-2"></i>評価ロジック</h3>
              <div class="space-y-2 text-sm">
                <p class="text-gray-700">✓ GDP成長率 2%以上: 健全な経済として+20点</p>
                <p class="text-gray-700">✓ 失業率 6%未満: 雇用安定として+20点</p>
                <p class="text-gray-700">✓ インフレ率 2-4%: 適正範囲として+30点</p>
                <p class="text-gray-700">✓ 政策金利 4%未満: 低金利環境として+30点</p>
              </div>
            </div>
          </div>
        \`
      } else if (dimension === 'analyst') {
        const analyst = data.analysis.analyst
        content = \`
          <div class="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-user-tie mr-3"></i>アナリスト評価詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-red-100">プロのアナリストによる投資判断</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-red-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-red-800"><i class="fas fa-star mr-2"></i>アナリストスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-red-600">\${analyst.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 10%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(analyst.score * 0.10).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-red-800"><i class="fas fa-users mr-2"></i>アナリストレーティング</h3>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <p class="text-sm text-gray-600">買い推奨</p>
                  <p class="text-3xl font-bold text-green-600">\${analyst.ratings.buy || 0}</p>
                </div>
                <div class="bg-gray-50 border-l-4 border-gray-500 p-3 rounded">
                  <p class="text-sm text-gray-600">中立</p>
                  <p class="text-3xl font-bold text-gray-600">\${analyst.ratings.hold || 0}</p>
                </div>
                <div class="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p class="text-sm text-gray-600">売り推奨</p>
                  <p class="text-3xl font-bold text-red-600">\${analyst.ratings.sell || 0}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-blue-50 p-3 rounded">
                  <p class="text-sm text-gray-600">目標株価</p>
                  <p class="text-2xl font-bold text-blue-600">$\${analyst.target_price?.toFixed(2) || 'N/A'}</p>
                </div>
                <div class="bg-purple-50 p-3 rounded">
                  <p class="text-sm text-gray-600">現在価格との差</p>
                  <p class="text-2xl font-bold \${analyst.upside_potential > 0 ? 'text-green-600' : 'text-red-600'}">
                    \${analyst.upside_potential?.toFixed(1) || 'N/A'}%
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>アナリスト評価とは</h3>
              <p class="text-sm text-gray-700 mb-2">
                金融機関や投資銀行に所属するプロのアナリストが、企業の財務分析、業界動向、競合比較などを基に投資判断を提供します。
              </p>
              <ul class="space-y-1 text-sm text-gray-700">
                <li>✓ <strong>買い推奨:</strong> 現在価格から上昇が期待される</li>
                <li>✓ <strong>中立:</strong> 保有継続を推奨</li>
                <li>✓ <strong>売り推奨:</strong> 株価下落が懸念される</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>スコア計算方法</h3>
              <div class="space-y-2 text-sm text-gray-700">
                <p><strong>レーティング評価:</strong></p>
                <ul class="ml-4">
                  <li>• 買い推奨が70%以上: +30点</li>
                  <li>• 買い推奨が50-70%: +20点</li>
                  <li>• 売り推奨が50%以上: -20点</li>
                </ul>
                <p class="mt-2"><strong>目標株価評価:</strong></p>
                <ul class="ml-4">
                  <li>• 上昇余地が20%以上: +40点</li>
                  <li>• 上昇余地が10-20%: +30点</li>
                  <li>• 上昇余地が0-10%: +20点</li>
                  <li>• 下落が予想される: +10点</li>
                </ul>
              </div>
            </div>

            <div class="bg-white p-4 rounded-lg border-2 border-red-200">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-chart-pie mr-2"></i>アナリストレーティングチャート</h3>
              <canvas id="analystChart"></canvas>
            </div>
          </div>
        \`
      }
      
      modalBody.innerHTML = content
      modal.classList.add('active')
      
      // チャート描画（モーダル表示後に実行）
      setTimeout(() => {
        if (dimension === 'technical') {
          const canvas = document.getElementById('technicalChart')
          if (canvas) {
            const ctx = canvas.getContext('2d')
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['RSI', 'ボラティリティ', 'トレンド強度', 'MACD'],
                datasets: [{
                  label: 'テクニカル指標',
                  data: [
                    data.analysis.technical.indicators.rsi,
                    data.analysis.technical.indicators.volatility * 100,
                    data.analysis.technical.indicators.trend * 100,
                    data.analysis.technical.indicators.macd * 10
                  ],
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                    'rgba(168, 85, 247, 0.7)'
                  ],
                  borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)',
                    'rgb(234, 179, 8)',
                    'rgb(168, 85, 247)'
                  ],
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: {
                    display: true,
                    text: 'テクニカル指標の可視化'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            })
          }
        } else if (dimension === 'fundamental') {
          const canvas = document.getElementById('fundamentalChart')
          if (canvas) {
            const ctx = canvas.getContext('2d')
            new Chart(ctx, {
              type: 'radar',
              data: {
                labels: ['PER評価', 'ROE評価', '成長率評価', '利益率評価'],
                datasets: [{
                  label: 'ファンダメンタル評価',
                  data: [
                    data.analysis.fundamental.metrics.pe ? (data.analysis.fundamental.metrics.pe < 15 ? 100 : data.analysis.fundamental.metrics.pe < 25 ? 60 : 30) : 50,
                    data.analysis.fundamental.metrics.roe ? (data.analysis.fundamental.metrics.roe > 15 ? 100 : data.analysis.fundamental.metrics.roe > 10 ? 70 : 40) : 50,
                    data.analysis.fundamental.metrics.revenue_growth ? (data.analysis.fundamental.metrics.revenue_growth > 10 ? 100 : data.analysis.fundamental.metrics.revenue_growth > 0 ? 60 : 20) : 50,
                    data.analysis.fundamental.metrics.profit_margin ? (data.analysis.fundamental.metrics.profit_margin > 20 ? 100 : data.analysis.fundamental.metrics.profit_margin > 10 ? 70 : 40) : 50
                  ],
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  borderColor: 'rgb(34, 197, 94)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgb(34, 197, 94)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgb(34, 197, 94)'
                }]
              },
              options: {
                responsive: true,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100
                  }
                },
                plugins: {
                  title: {
                    display: true,
                    text: 'ファンダメンタル評価レーダーチャート'
                  }
                }
              }
            })
          }
        } else if (dimension === 'sentiment') {
          const canvas = document.getElementById('sentimentChart')
          if (canvas) {
            const ctx = canvas.getContext('2d')
            // GPT-4o insightからポジティブ/ネガティブ要因を抽出
            let positiveCount = 0
            let negativeCount = 0
            let neutralCount = 0
            
            if (data.analysis.sentiment.gpt_insight) {
              try {
                const insight = JSON.parse(data.analysis.sentiment.gpt_insight)
                positiveCount = insight.positive_factors ? insight.positive_factors.length : 0
                negativeCount = insight.negative_factors ? insight.negative_factors.length : 0
                neutralCount = Math.max(0, 5 - positiveCount - negativeCount)
              } catch (e) {
                neutralCount = 5
              }
            }
            
            new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: ['ポジティブ', 'ネガティブ', '中立'],
                datasets: [{
                  data: [positiveCount, negativeCount, neutralCount],
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(156, 163, 175, 0.7)'
                  ],
                  borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)',
                    'rgb(156, 163, 175)'
                  ],
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  title: {
                    display: true,
                    text: 'ニュースセンチメント分布'
                  }
                }
              }
            })
          }
        } else if (dimension === 'analyst') {
          const canvas = document.getElementById('analystChart')
          if (canvas) {
            const ctx = canvas.getContext('2d')
            new Chart(ctx, {
              type: 'pie',
              data: {
                labels: ['買い推奨', '中立', '売り推奨'],
                datasets: [{
                  data: [
                    data.analysis.analyst.ratings.buy || 0,
                    data.analysis.analyst.ratings.hold || 0,
                    data.analysis.analyst.ratings.sell || 0
                  ],
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(156, 163, 175, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                  ],
                  borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(156, 163, 175)',
                    'rgb(239, 68, 68)'
                  ],
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  title: {
                    display: true,
                    text: 'アナリストレーティング分布'
                  }
                }
              }
            })
          }
        }
      }, 100)
    }

    // モーダルを閉じる
    function closeModal() {
      document.getElementById('detailModal').classList.remove('active')
    }

    // モーダル外クリックで閉じる
    window.onclick = function(event) {
      const modal = document.getElementById('detailModal')
      if (event.target === modal) {
        closeModal()
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
