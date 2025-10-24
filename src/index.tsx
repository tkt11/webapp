import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import { performTechnicalAnalysis } from './services/technical'
import { performFundamentalAnalysis } from './services/fundamental'
import { performSentimentAnalysis } from './services/sentiment'
import { analyzeMacroEconomics } from './services/macro'
import { analyzeAnalystRating } from './services/analyst'
import { generatePrediction, generateDetailedExplanation, generateFuturePrediction, generateBackfitPrediction, generateMLPrediction, generateGPT5FinalJudgment } from './services/prediction'
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
    const { symbol, trainModel = false, enableBackfit = false } = await c.req.json()
    
    if (!symbol) {
      return c.json({ error: '銘柄コードが必要です' }, 400)
    }
    
    const env = c.env
    const { cache } = await import('./services/cache')
    const cacheKey = `analysis:${symbol}:${trainModel}:${enableBackfit}`
    
    // キャッシュチェック
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log(`Returning cached analysis for ${symbol}`)
      return c.json(cached)
    }
    
    console.log(`Analyzing ${symbol} with trainModel=${trainModel}, enableBackfit=${enableBackfit}`)
    
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
    
    // 未来30日の予測を生成
    const futurePrediction = generateFuturePrediction(
      currentPrice,
      prediction.score,
      technical,
      prediction.action,
      stockData.prices.slice(-30)
    )
    
    // 過去30日の予測(バックフィット)を生成し精度評価
    const backfitPrediction = generateBackfitPrediction(
      stockData.dates.slice(-30),
      stockData.prices.slice(-30),
      prediction.score,
      technical
    )
    
    // ML予測を生成（並行表示用）
    const mlResult = await generateMLPrediction(
      symbol,
      stockData.prices,
      technical,
      fundamental,
      sentiment,
      trainModel,  // 学習フラグを渡す
      enableBackfit  // バックフィット検証フラグを渡す
    )
    
    // GPT-5による最終判断を生成（全データを統合分析）
    console.log('Generating GPT-5 final judgment with all analysis data...')
    const gpt5FinalJudgment = await generateGPT5FinalJudgment(
      symbol,
      currentPrice,
      prediction,
      technical,
      fundamental,
      sentiment,
      macro,
      analyst,
      mlResult.prediction,
      mlResult.training,
      backfitPrediction.accuracy,
      futurePrediction,
      env.OPENAI_API_KEY
    )
    
    const result = {
      symbol,
      current_price: currentPrice,
      prediction: {
        ...prediction,
        detailed_explanation: detailedExplanation,
        future: futurePrediction,
        backfit: backfitPrediction,
        ml_prediction: mlResult.prediction,  // ML予測
        ml_training: mlResult.training,      // 学習結果（存在する場合）
        gpt5_final_judgment: gpt5FinalJudgment  // GPT-5最終判断
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
    }
    
    // キャッシュに保存（30分）
    cache.set(cacheKey, result, 30 * 60 * 1000)
    
    return c.json(result)
    
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

// ===== ランキングAPI =====

// おすすめTOP10ランキング
app.post('/api/rankings/recommended', async (c) => {
  try {
    const { env } = c
    const { cache } = await import('./services/cache')
    const cacheKey = 'ranking:recommended'
    
    // キャッシュチェック
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log('Returning cached recommended ranking (fast path)')
      return c.json(cached)
    }
    
    // キャッシュなし → 同期的に生成（初回のみ時間がかかる）
    console.log('🔄 No cache found, generating recommended ranking...')
    const { getRecommendedRanking } = await import('./services/ranking')
    
    const result = await getRecommendedRanking({
      alphaVantage: env.ALPHA_VANTAGE_API_KEY,
      finnhub: env.FINNHUB_API_KEY
    })
    
    console.log('✅ Recommended ranking generated successfully')
    return c.json(result)
  } catch (error: any) {
    console.error('Recommended ranking error:', error)
    return c.json({
      error: 'おすすめランキングの取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// 高成長×信頼度ランキング
app.post('/api/rankings/high-growth', async (c) => {
  try {
    const { env } = c
    const { timeframe = '90d' } = await c.req.json()
    const { cache } = await import('./services/cache')
    const cacheKey = `ranking:high-growth:${timeframe}`
    
    // キャッシュチェック
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log(`Returning cached high-growth ranking for ${timeframe} (fast path)`)
      return c.json(cached)
    }
    
    // キャッシュなし → 同期的に生成（初回のみ時間がかかる）
    console.log(`🔄 No cache found, generating high-growth ranking for ${timeframe}...`)
    const { getHighGrowthRanking } = await import('./services/ranking-highgrowth')
    
    const result = await getHighGrowthRanking(timeframe, {
      alphaVantage: env.ALPHA_VANTAGE_API_KEY,
      finnhub: env.FINNHUB_API_KEY,
      openai: env.OPENAI_API_KEY,
      fred: env.FRED_API_KEY
    })
    
    console.log('✅ High-growth ranking generated successfully')
    return c.json(result)
  } catch (error: any) {
    console.error('High-growth ranking error:', error)
    return c.json({
      error: '高成長ランキングの取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// 短期トレードランキング
app.post('/api/rankings/short-term', async (c) => {
  try {
    const { env } = c
    const { cache } = await import('./services/cache')
    const cacheKey = 'ranking:short-term'
    
    // キャッシュチェック
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log('Returning cached short-term ranking (fast path)')
      return c.json(cached)
    }
    
    // キャッシュなし → 同期的に生成（初回のみ時間がかかる）
    console.log('🔄 No cache found, generating short-term ranking...')
    const { getShortTermRanking } = await import('./services/ranking-shortterm')
    
    const result = await getShortTermRanking({
      alphaVantage: env.ALPHA_VANTAGE_API_KEY,
      finnhub: env.FINNHUB_API_KEY
    })
    
    console.log('✅ Short-term ranking generated successfully')
    return c.json(result)
  } catch (error: any) {
    console.error('Short-term ranking error:', error)
    return c.json({
      error: '短期トレードランキングの取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// 注目株ランキング
app.post('/api/rankings/trending', async (c) => {
  try {
    const { env } = c
    const { cache } = await import('./services/cache')
    const cacheKey = 'ranking:trending'
    
    // キャッシュチェック
    const cached = cache.get(cacheKey)
    if (cached) {
      console.log('Returning cached trending ranking (fast path)')
      return c.json(cached)
    }
    
    // キャッシュなし → 同期的に生成（初回のみ時間がかかる）
    console.log('🔄 No cache found, generating trending ranking...')
    const { getTrendingRanking } = await import('./services/ranking-trending')
    
    const result = await getTrendingRanking({
      alphaVantage: env.ALPHA_VANTAGE_API_KEY,
      finnhub: env.FINNHUB_API_KEY
    })
    
    console.log('✅ Trending ranking generated successfully')
    return c.json(result)
  } catch (error: any) {
    console.error('Trending ranking error:', error)
    return c.json({
      error: '注目株ランキングの取得に失敗しました',
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
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Stock AI Predictor - 株価予測AI v11.6 FIXED STRUCTURE</title>
  <script>
    // Force cache clear for v11.1
    console.log('%c Application Version: 11.6 - FIXED HTML STRUCTURE', 'color: #10b981; font-weight: bold; font-size: 16px;');
    console.log('%c Bug fixes in v11.1:', 'color: #3b82f6; font-weight: bold;');
    console.log('  - Fixed switchTab function to properly handle events');
    console.log('  - Rankings tab now displays correctly');
    console.log('  - All tab buttons now pass event parameter');
    console.log('%c Press Ctrl+Shift+R to force refresh!', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
  </script>
  <script src="https://cdn.tailwindcss.com?v=11.6"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js?v=11.6"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js?v=11.6"></script>
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
      <p class="text-xl opacity-90">5次元分析 × GPT-5で株価を予測</p>
      <p class="mt-2 text-sm opacity-75">
        テクニカル • ファンダメンタル • センチメント • マクロ経済 • アナリスト評価
      </p>
    </div>

    <!-- タブナビゲーション -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="flex border-b">
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('analysis', event)">
          <i class="fas fa-search mr-2"></i>銘柄分析
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('recommendations', event)">
          <i class="fas fa-star mr-2"></i>おすすめ銘柄TOP10
        </button>
        <button class="tab-button active px-6 py-4 font-semibold" onclick="switchTab('rankings', event)">
          <i class="fas fa-trophy mr-2"></i>ランキング
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('simulation', event)">
          <i class="fas fa-calculator mr-2"></i>投資シミュレーター
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('backtest', event)">
          <i class="fas fa-history mr-2"></i>バックテスト
        </button>
      </div>
    </div>

    <!-- タブ1: 銘柄分析 -->
    <div id="analysis-tab" class="tab-content">
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
        
        <!-- オンデマンド学習チェックボックス -->
        <div class="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="train-model-checkbox" 
              class="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div class="flex-1">
              <label for="train-model-checkbox" class="font-semibold text-gray-800 cursor-pointer">
                <i class="fas fa-brain text-purple-600"></i>
                このモデルを学習する（オンデマンド学習）
              </label>
              <p class="text-sm text-gray-600 mt-1">
                チェックすると、この銘柄専用のMLモデルを学習してから予測します。
                学習には約10-30秒かかりますが、より高精度な予測が可能です。
              </p>
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-info-circle mr-1"></i>
                学習結果は7日間キャッシュされ、次回の予測で再利用されます
              </p>
            </div>
          </div>
        </div>
        
        <!-- バックフィット検証オプション -->
        <div class="mt-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="enable-backfit-checkbox" 
              class="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div class="flex-1">
              <label for="enable-backfit-checkbox" class="font-semibold text-gray-800 cursor-pointer">
                <i class="fas fa-chart-line text-blue-600"></i>
                バックフィット検証も実施（予測精度の可視化）
              </label>
              <p class="text-sm text-gray-600 mt-1">
                チェックすると、過去30日を除外した別モデルで学習し、その30日の予測精度を検証します。
                データリークなしで実際のモデル精度を確認できます。
              </p>
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-info-circle mr-1"></i>
                <strong>仕組み:</strong> 本番用モデル（全データ学習）と検証用モデル（過去30日除外）の2つを学習
              </p>
              <p class="text-xs text-blue-600 mt-1">
                <i class="fas fa-clock mr-1"></i>
                追加で約5-10秒かかります（別モデル学習のため）
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="analysis-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">分析中... GPT-5 + Code Interpreter分析を実行しています（約3-5分）</p>
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
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <h3 class="font-bold text-blue-800 mb-2">
            <i class="fas fa-info-circle mr-2"></i>選定ロジック
          </h3>
          <div class="text-sm text-gray-700 space-y-1">
            <p><strong>対象銘柄:</strong> S&P 500主要50社（時価総額上位）から15銘柄を分析</p>
            <p><strong>選定基準:</strong></p>
            <ul class="ml-6 list-disc">
              <li>5次元分析で総合スコアを算出（テクニカル35% + ファンダメンタル30% + センチメント15% + マクロ10% + アナリスト10%）</li>
              <li>スコア上位10銘柄を推奨</li>
              <li>BUY判定（スコア75点以上）を優先表示</li>
              <li>期待リターンと信頼度も考慮</li>
            </ul>
            <p><strong>更新頻度:</strong> リアルタイム（ボタンクリック時に最新データで分析）</p>
            <p class="text-xs text-gray-500 mt-2">※ パフォーマンス最適化のため、現在は15銘柄に限定しています（処理時間: 約15秒）</p>
          </div>
        </div>
        <button 
          onclick="loadRecommendations()" 
          class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          <i class="fas fa-sync-alt mr-2"></i>最新のおすすめを取得（15銘柄分析）
        </button>
      </div>

      <div id="recommendations-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">分析中... 15銘柄を並列分析しています（約15秒）</p>
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

  <!-- ランキングタブ -->
    <div id="rankings-tab" class="tab-content" style="display: block !important;">
      <div style="background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
          <i class="fas fa-trophy" style="margin-right: 8px; color: #eab308;"></i>
          NASDAQ-100 ランキング
        </h2>
        <p style="color: #4b5563; margin-bottom: 24px; font-size: 16px;">
          NASDAQ-100銘柄を複数の視点でランキング
        </p>
        
        <!-- ランキングタイプ選択 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
          <button onclick="loadRanking('recommended')" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-star" style="margin-right: 8px;"></i>
            おすすめTOP10
          </button>
          <button onclick="loadRanking('high-growth')" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-chart-line" style="margin-right: 8px;"></i>
            高成長×信頼度
          </button>
          <button onclick="loadRanking('short-term')" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-bolt" style="margin-right: 8px;"></i>
            短期トレード
          </button>
          <button onclick="loadRanking('trending')" style="background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-fire" style="margin-right: 8px;"></i>
            注目株
          </button>
        </div>
        
        <!-- 期間選択（高成長ランキング用） -->
        <div id="timeframe-selector" style="display:none; margin-bottom: 24px;">
          <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #374151;">予測期間</label>
          <select id="ranking-timeframe" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px;">
            <option value="30d">30日後</option>
            <option value="60d">60日後</option>
            <option value="90d" selected>90日後</option>
          </select>
        </div>
      </div>
      
      <div id="rankings-loading" style="display:none; text-align: center; padding: 40px;">
        <div class="loader" style="border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p style="color: #4b5563; font-size: 16px;">ランキング計算中... NASDAQ-100銘柄を分析しています（約1-5分）</p>
      </div>
      
      <!-- 初期表示メッセージ -->
      <div id="rankings-welcome" style="background: linear-gradient(to right, #eff6ff, #faf5ff); border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 32px; margin-bottom: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <i class="fas fa-chart-bar" style="font-size: 64px; color: #3b82f6; margin-bottom: 16px; display: block;"></i>
          <h3 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">NASDAQ-100 ランキング分析</h3>
          <p style="color: #4b5563; font-size: 16px;">上のボタンから分析タイプを選択してください</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 900px; margin: 0 auto;">
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #3b82f6;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-star" style="color: #3b82f6; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">おすすめTOP10</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">統計モデルによる総合評価ランキング</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>即時表示
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>無料</span>
            </p>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #10b981;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-chart-line" style="color: #10b981; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">高成長×信頼度</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">GPT-5-miniによる成長予測分析</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>1-5分
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>$1.50/回</span>
            </p>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #f97316;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-bolt" style="color: #f97316; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">短期トレード</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">テクニカル指標による短期推奨銘柄</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>即時表示
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>無料</span>
            </p>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #8b5cf6;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-fire" style="color: #8b5cf6; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">注目株</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">ニュース・SNS・アナリスト評価による注目銘柄</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>即時表示
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>無料</span>
            </p>
          </div>
        </div>
        
        <div style="margin-top: 24px; text-align: center;">
          <p style="font-size: 14px; color: #6b7280;">
            <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
            各ランキングはキャッシュされており、一定期間内は同じ結果が表示されます
          </p>
        </div>
      </div>
      
      <div id="rankings-result" style="display:none;">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

  <script>
    // グローバル変数: 分析データを保存
    window.currentAnalysisData = null

    // 詳細モーダル表示（最初に定義）
    window.showDetailModal = function(dimension) {
      console.log('showDetailModal called with dimension:', dimension)
      console.log('currentAnalysisData:', window.currentAnalysisData)
      
      if (!window.currentAnalysisData) {
        alert('先に銘柄分析を実行してください')
        return
      }
      
      try {
        const data = window.currentAnalysisData
        console.log('Analysis data loaded:', data)
        const modal = document.getElementById('detailModal')
        const modalBody = document.getElementById('modal-body')
        
        if (!modal || !modalBody) {
          console.error('Modal elements not found')
          return
        }
        
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
                  <p class="text-2xl font-bold">\${tech.rsi?.toFixed(2) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${tech.rsi < 30 ? '売られすぎ' : tech.rsi > 70 ? '買われすぎ' : '中立'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">MACD</p>
                  <p class="text-2xl font-bold">\${tech.macd?.macd?.toFixed(4) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${tech.macd?.macd > 0 ? '上昇トレンド' : '下降トレンド'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">短期MA (20日)</p>
                  <p class="text-2xl font-bold">$\${tech.sma20?.toFixed(2) || 'N/A'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">長期MA (50日)</p>
                  <p class="text-2xl font-bold">$\${tech.sma50?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>計算方法</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li><strong>RSI:</strong> 過去14日間の価格変動から相対的な強弱を算出 (0-100)</li>
                <li><strong>MACD:</strong> 短期EMA(12) - 長期EMA(26) でトレンドの転換点を検出</li>
              </ul>
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
                  <p class="text-2xl font-bold">\${fund.pe_ratio?.toFixed(2) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.pe_ratio ? '-' : fund.pe_ratio < 15 ? '割安' : fund.pe_ratio > 25 ? '割高' : '適正'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">ROE (自己資本利益率)</p>
                  <p class="text-2xl font-bold">\${fund.roe?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.roe ? '-' : fund.roe > 15 ? '優良' : fund.roe > 10 ? '良好' : '低い'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">PBR (株価純資産倍率)</p>
                  <p class="text-2xl font-bold">\${fund.pb_ratio?.toFixed(2) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.pb_ratio ? '-' : fund.pb_ratio < 1 ? '割安' : fund.pb_ratio < 3 ? '適正' : '割高'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">配当利回り</p>
                  <p class="text-2xl font-bold">\${fund.dividend_yield ? (fund.dividend_yield * 100).toFixed(2) + '%' : 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.dividend_yield ? '-' : fund.dividend_yield > 0.03 ? '高配当' : '低配当'}</p>
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
            <p class="mt-2 text-yellow-100">最新ニュースをGPT-5で分析</p>
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
                <p class="text-2xl font-bold text-blue-600">\${sent.news_count || 0}件</p>
              </div>
            </div>

            <!-- ニュース判断例 -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-list mr-2"></i>ニュース判断例 (直近5件)</h3>
              \${sent.news_examples && sent.news_examples.length > 0 ? \`
                <div class="space-y-3">
                  \${sent.news_examples.map(example => \`
                    <div class="border-l-4 \${example.sentiment === 'positive' ? 'border-green-500 bg-green-50' : example.sentiment === 'negative' ? 'border-red-500 bg-red-50' : 'border-gray-500 bg-gray-50'} p-3 rounded">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                          <span class="text-xs font-bold px-2 py-1 rounded \${example.sentiment === 'positive' ? 'bg-green-500 text-white' : example.sentiment === 'negative' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}">
                            \${example.sentiment === 'positive' ? 'ポジティブ' : example.sentiment === 'negative' ? 'ネガティブ' : '中立'}
                          </span>
                          <span class="text-xs text-gray-500 ml-2">[\${example.source}]</span>
                        </div>
                        <span class="text-xs text-blue-600 font-bold"><i class="far fa-calendar mr-1"></i>\${example.date_formatted}</span>
                      </div>
                      <p class="font-bold text-sm mb-1">\${example.headline}</p>
                      <p class="text-xs text-gray-600">\${example.summary}</p>
                    </div>
                  \`).join('')}
                </div>
              \` : \`
                <p class="text-sm text-gray-500">ニュース判断例がありません</p>
              \`}
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-robot mr-2"></i>GPT-5分析</h3>
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
                  <p class="text-2xl font-bold">\${macro.gdp_growth?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.gdp_growth ? '-' : macro.gdp_growth > 3 ? '強い経済' : macro.gdp_growth > 2 ? '健全' : '鈍化'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">失業率</p>
                  <p class="text-2xl font-bold">\${macro.unemployment?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.unemployment ? '-' : macro.unemployment < 4 ? '完全雇用' : macro.unemployment < 6 ? '正常' : '高い'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">インフレ率 (CPI)</p>
                  <p class="text-2xl font-bold">\${macro.inflation?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.inflation ? '-' : macro.inflation < 2 ? '低インフレ' : macro.inflation < 4 ? '適正' : '高インフレ'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">政策金利 (FF Rate)</p>
                  <p class="text-2xl font-bold">\${macro.interest_rate?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.interest_rate ? '-' : macro.interest_rate < 2 ? '低金利' : macro.interest_rate < 4 ? '中金利' : '高金利'}</p>
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
              <h3 class="font-bold text-lg mb-3 text-red-800"><i class="fas fa-users mr-2"></i>アナリスト評価</h3>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 p-4 rounded-lg">
                  <p class="text-sm text-gray-600 mb-1">コンセンサス</p>
                  <p class="text-4xl font-bold \${analyst.consensus === 'BUY' ? 'text-green-600' : analyst.consensus === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                    \${analyst.consensus || 'N/A'}
                  </p>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
                  <p class="text-sm text-gray-600 mb-1">アナリスト数</p>
                  <p class="text-4xl font-bold text-blue-600">\${analyst.recommendation_count || 0}</p>
                  <p class="text-xs text-gray-500 mt-1">人のアナリストが評価</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-blue-50 p-3 rounded">
                  <p class="text-sm text-gray-600">目標株価</p>
                  <p class="text-2xl font-bold text-blue-600">\${analyst.target_price ? '$' + analyst.target_price.toFixed(2) : 'N/A'}</p>
                </div>
                <div class="bg-purple-50 p-3 rounded">
                  <p class="text-sm text-gray-600">上昇余地</p>
                  <p class="text-2xl font-bold \${analyst.upside && analyst.upside > 0 ? 'text-green-600' : 'text-red-600'}">
                    \${analyst.upside ? analyst.upside.toFixed(1) + '%' : 'N/A'}
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
          </div>
        \`
      }
      
      console.log('Setting modal content for dimension:', dimension)
      modalBody.innerHTML = content
      modal.classList.add('active')
      console.log('Modal opened successfully')
      
      } catch (error) {
        console.error('Error in showDetailModal:', error)
        alert('モーダル表示エラー: ' + error.message)
      }
    }

    // モーダルを閉じる（最初に定義）
    window.closeModal = function() {
      document.getElementById('detailModal').classList.remove('active')
    }

    // タブ切り替え
    window.switchTab = function(tabName, event) {
      console.log('Switching to tab:', tabName)
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'))
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'))
      
      const targetTab = document.getElementById(tabName + '-tab')
      if (targetTab) {
        targetTab.classList.add('active')
        console.log('Tab activated:', tabName + '-tab')
        console.log('Tab display after activation:', window.getComputedStyle(targetTab).display)
      } else {
        console.error('Tab not found:', tabName + '-tab')
      }
      
      if (event && event.target) {
        const button = event.target.closest('.tab-button')
        if (button) {
          button.classList.add('active')
          console.log('Button activated')
        }
      }
    }

    // 銘柄分析
    async function analyzeStock() {
      const symbol = document.getElementById('symbol-input').value.trim().toUpperCase()
      if (!symbol) {
        alert('銘柄コードを入力してください')
        return
      }

      // チェックボックスから学習フラグを取得
      const trainModel = document.getElementById('train-model-checkbox').checked
      const enableBackfit = document.getElementById('enable-backfit-checkbox').checked
      console.log('Train model:', trainModel, 'Enable backfit:', enableBackfit)

      // 動的ローディングメッセージ
      const loadingDiv = document.getElementById('analysis-loading')
      let loadingMessage = '分析中... GPT-5 + Code Interpreter分析を実行しています（約3-5分）'
      if (trainModel && enableBackfit) {
        loadingMessage = '分析中... モデル学習 + バックフィット検証 + GPT-5分析を実行しています（約3-5分）'
      } else if (trainModel) {
        loadingMessage = '分析中... モデル学習 + GPT-5分析を実行しています（約3-5分）'
      }
      
      loadingDiv.innerHTML = \`
        <div class="loader"></div>
        <p class="text-center text-gray-600">\${loadingMessage}</p>
      \`

      document.getElementById('analysis-loading').style.display = 'block'
      document.getElementById('analysis-result').style.display = 'none'

      try {
        const response = await axios.post('/api/analyze', { symbol, trainModel, enableBackfit })
        const data = response.data
        
        // グローバルに保存してモーダルから参照可能にする
        window.currentAnalysisData = data

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
                <p class="text-lg text-gray-600 mt-2">
                  信頼度: \${data.prediction.confidence}%
                  <i class="fas fa-info-circle ml-1 text-blue-500 cursor-pointer" 
                     title="信頼度は判定の確実性を示します。スコアと一致度が高いほど信頼度が上がります。" 
                     onclick="alert('【信頼度とは】\\n\\n判定の確実性を示す指標です。\\n\\n【スコアと信頼度の関係】\\n• 75点以上: 信頼度75-100% (強いBUY)\\n• 60-75点: 信頼度60-75% (中程度のBUY)\\n• 40-60点: 信頼度40-60% (HOLD/様子見)\\n• 40点未満: 信頼度60-100% (SELL)\\n\\n【重要な注意点】\\n総合スコアが高くても信頼度が低い場合は、\\n各分析次元の結果にばらつきがあります。\\n例: テクニカル85点でもファンダメンタル40点など\\n\\n信頼度が低い場合は慎重に判断してください。')"></i>
                </p>
              </div>
            </div>

            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xl font-bold">総合スコア: \${data.prediction.score}/100</h3>
                <i class="fas fa-info-circle text-blue-500 cursor-pointer" 
                   title="5つの分析を重み付け平均したスコア" 
                   onclick="alert('【総合スコアとは】\\n\\n5次元分析の加重平均値です：\\n\\n• テクニカル: 35%\\n• ファンダメンタル: 30%\\n• センチメント: 15%\\n• マクロ経済: 10%\\n• アナリスト: 10%\\n\\n【判定基準】\\n• 75点以上: BUY（買い推奨）\\n• 60-75点: HOLD（保持推奨）\\n• 60点未満: SELL（売り推奨）')"></i>
              </div>
              <div class="bg-gray-200 rounded-full h-6">
                <div class="score-bar bg-gradient-to-r from-blue-500 to-purple-600" style="width: \${data.prediction.score}%"></div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 mb-6">
              <div id="card-technical" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-chart-line mr-1"></i>テクニカル</p>
                <p class="text-2xl font-bold text-blue-600">\${data.prediction.breakdown.technical}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-fundamental" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-building mr-1"></i>ファンダメンタル</p>
                <p class="text-2xl font-bold text-green-600">\${data.prediction.breakdown.fundamental}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-sentiment" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-newspaper mr-1"></i>センチメント</p>
                <p class="text-2xl font-bold text-yellow-600">\${data.prediction.breakdown.sentiment}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-macro" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-globe mr-1"></i>マクロ経済</p>
                <p class="text-2xl font-bold text-purple-600">\${data.prediction.breakdown.macro}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-analyst" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-user-tie mr-1"></i>アナリスト</p>
                <p class="text-2xl font-bold text-red-600">\${data.prediction.breakdown.analyst}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-4 text-center"><i class="fas fa-chart-radar mr-2"></i>5次元分析レーダーチャート</h4>
              <canvas id="radarChart" style="max-height: 300px;"></canvas>
            </div>

            <!-- ML予測比較セクション -->
            \${data.prediction.ml_prediction ? \`
            <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6 border-2 border-green-200">
              <h4 class="font-bold text-xl mb-4 text-center">
                <i class="fas fa-robot mr-2"></i>デュアル予測システム: 統計 vs 機械学習
              </h4>
              
              <div class="grid grid-cols-2 gap-6">
                <!-- 統計的予測（既存） -->
                <div class="bg-white p-6 rounded-lg shadow-md border-2 border-blue-300">
                  <div class="flex items-center justify-between mb-4">
                    <h5 class="text-lg font-bold text-blue-700">
                      <i class="fas fa-chart-line mr-2"></i>統計的予測
                    </h5>
                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">SMA-Based</span>
                  </div>
                  
                  <div class="space-y-3">
                    <div>
                      <p class="text-sm text-gray-600">判定</p>
                      <p class="text-3xl font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                        \${data.prediction.action}
                      </p>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">信頼度</p>
                      <div class="flex items-center">
                        <p class="text-2xl font-bold text-blue-600">\${data.prediction.confidence}%</p>
                        <div class="ml-3 flex-1">
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: \${data.prediction.confidence}%"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">総合スコア</p>
                      <p class="text-2xl font-bold text-blue-700">\${data.prediction.score}/100</p>
                    </div>
                    
                    <div class="pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        5次元分析の加重平均による統計的手法
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- ML予測（新規） -->
                <div class="bg-white p-6 rounded-lg shadow-md border-2 border-green-300">
                  <div class="flex items-center justify-between mb-4">
                    <h5 class="text-lg font-bold text-green-700">
                      <i class="fas fa-brain mr-2"></i>ML予測
                    </h5>
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">LightGBM</span>
                  </div>
                  
                  <div class="space-y-3">
                    <div>
                      <p class="text-sm text-gray-600">予測価格</p>
                      <p class="text-3xl font-bold text-green-600">
                        $\${data.prediction.ml_prediction.predicted_price.toFixed(2)}
                      </p>
                      <p class="text-sm \${data.prediction.ml_prediction.change_percent > 0 ? 'text-green-600' : 'text-red-600'}">
                        \${data.prediction.ml_prediction.change_percent > 0 ? '+' : ''}\${data.prediction.ml_prediction.change_percent.toFixed(2)}%
                      </p>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">ML信頼度</p>
                      <div class="flex items-center">
                        <p class="text-2xl font-bold text-green-600">\${Math.round(data.prediction.ml_prediction.confidence * 100)}%</p>
                        <div class="ml-3 flex-1">
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: \${data.prediction.ml_prediction.confidence * 100}%"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">使用特徴量</p>
                      <p class="text-2xl font-bold text-green-700">\${data.prediction.ml_prediction.features_used}個</p>
                    </div>
                    
                    <div class="pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-microchip mr-1"></i>
                        \${data.prediction.ml_prediction.model}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 比較分析 -->
              <div class="mt-6 bg-white p-4 rounded-lg">
                <h6 class="font-bold text-sm text-gray-700 mb-3">
                  <i class="fas fa-balance-scale mr-2"></i>予測手法の比較
                </h6>
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p class="font-bold text-blue-700 mb-1">統計的予測の特徴:</p>
                    <ul class="space-y-1 text-gray-600">
                      <li>✓ 多次元分析の統合</li>
                      <li>✓ 解釈性が高い</li>
                      <li>✓ リアルタイム計算</li>
                    </ul>
                  </div>
                  <div>
                    <p class="font-bold text-green-700 mb-1">ML予測の特徴:</p>
                    <ul class="space-y-1 text-gray-600">
                      <li>✓ 過去パターン学習</li>
                      <li>✓ 非線形関係の捕捉</li>
                      <li>✓ 高精度な価格予測</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- 精度評価と動作検証 -->
              <div class="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <h6 class="font-bold text-lg text-gray-800 mb-4 text-center">
                  <i class="fas fa-flask mr-2"></i>予測精度と動作検証
                </h6>
                
                <div class="grid grid-cols-2 gap-6">
                  <!-- 統計予測の精度 -->
                  <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-blue-700 mb-3">
                      <i class="fas fa-chart-line mr-1"></i>統計予測の精度
                    </h6>
                    \${data.prediction.backfit ? \`
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">RMSE:</span>
                        <span class="font-bold text-blue-600">\${data.prediction.backfit.accuracy.rmse.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">MAE:</span>
                        <span class="font-bold text-blue-600">\${data.prediction.backfit.accuracy.mae.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">方向性正解率:</span>
                        <span class="font-bold text-blue-600">\${data.prediction.backfit.accuracy.directionAccuracy.toFixed(1)}%</span>
                      </div>
                      <div class="pt-2 border-t mt-2">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-info-circle mr-1"></i>
                          過去30日間のバックテスト結果
                        </p>
                      </div>
                    </div>
                    \` : '<p class="text-xs text-gray-500">精度データなし</p>'}
                  </div>
                  
                  <!-- ML予測の動作状態 -->
                  <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-green-700 mb-3">
                      <i class="fas fa-robot mr-1"></i>ML予測の動作状態
                    </h6>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">API状態:</span>
                        <span class="font-bold text-green-600">
                          <i class="fas fa-check-circle mr-1"></i>正常稼働中
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">モデル:</span>
                        <span class="font-bold text-green-600">\${data.prediction.ml_prediction.model}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">予測時刻:</span>
                        <span class="font-bold text-green-600 text-xs">
                          \${new Date(data.prediction.ml_prediction.timestamp).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <div class="pt-2 border-t mt-2">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-server mr-1"></i>
                          Google Cloud Run経由でLightGBMモデル実行
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 一致度分析 -->
                <div class="mt-4 bg-white p-4 rounded-lg shadow">
                  <h6 class="font-bold text-sm text-purple-700 mb-3">
                    <i class="fas fa-sync-alt mr-1"></i>予測一致度分析
                  </h6>
                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-600">現在価格</span>
                        <span class="text-sm font-bold text-gray-800">$\${data.current_price.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-600">統計予測（傾向）</span>
                        <span class="text-sm font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                          \${data.prediction.action} (\${data.prediction.confidence}%)
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-600">ML予測価格</span>
                        <span class="text-sm font-bold text-green-600">
                          $\${data.prediction.ml_prediction.predicted_price.toFixed(2)} 
                          <span class="\${data.prediction.ml_prediction.change_percent > 0 ? 'text-green-600' : 'text-red-600'}">
                            (\${data.prediction.ml_prediction.change_percent > 0 ? '+' : ''}\${data.prediction.ml_prediction.change_percent.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <div class="pt-3 border-t">
                      \${(() => {
                        const mlDirection = data.prediction.ml_prediction.change_percent > 0 ? 'BUY' : data.prediction.ml_prediction.change_percent < 0 ? 'SELL' : 'HOLD';
                        const isMatch = (data.prediction.action === mlDirection) || 
                                       (data.prediction.action === 'HOLD' && Math.abs(data.prediction.ml_prediction.change_percent) < 1) ||
                                       (mlDirection === 'HOLD' && data.prediction.action === 'HOLD');
                        return \`
                          <div class="flex items-center justify-between">
                            <span class="text-sm font-bold text-gray-700">予測一致度:</span>
                            <div class="flex items-center">
                              <span class="px-3 py-1 rounded-full text-xs font-bold \${isMatch ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                <i class="fas fa-\${isMatch ? 'check' : 'exclamation-triangle'} mr-1"></i>
                                \${isMatch ? '一致' : '不一致'}
                              </span>
                              <i class="fas fa-info-circle ml-2 text-gray-400 cursor-pointer" 
                                 title="両予測が同じ方向（上昇/下降）を示している場合は一致と判定"></i>
                            </div>
                          </div>
                          <p class="text-xs text-gray-600 mt-2">
                            \${isMatch 
                              ? '✓ 統計予測とML予測が同じ方向性を示しています。信頼度が高い予測です。' 
                              : '⚠️ 統計予測とML予測で方向性が異なります。慎重な判断を推奨します。'}
                          </p>
                        \`;
                      })()}
                    </div>
                  </div>
                </div>
                
                <!-- ML学習モデル詳細 -->
                <div class="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
                  <h6 class="font-bold text-lg text-gray-800 mb-4 text-center">
                    <i class="fas fa-brain mr-2"></i>ML推論モデル詳細
                  </h6>
                  
                  <div class="grid grid-cols-3 gap-4">
                    <!-- モデルアーキテクチャ -->
                    <div class="bg-white p-4 rounded-lg shadow">
                      <h6 class="font-bold text-sm text-indigo-700 mb-3">
                        <i class="fas fa-sitemap mr-1"></i>モデルアーキテクチャ
                      </h6>
                      <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">アルゴリズム:</span>
                          <span class="font-bold text-indigo-600">LightGBM</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">タイプ:</span>
                          <span class="font-bold text-indigo-600">勾配ブースティング</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">使用特徴量:</span>
                          <span class="font-bold text-indigo-600">\${data.prediction.ml_prediction.features_used}個</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">予測対象:</span>
                          <span class="font-bold text-indigo-600">翌日終値</span>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-info-circle mr-1"></i>
                          決定木の集合により非線形パターンを学習
                        </p>
                      </div>
                    </div>
                    
                    <!-- 特徴量の内訳 -->
                    <div class="bg-white p-4 rounded-lg shadow">
                      <h6 class="font-bold text-sm text-indigo-700 mb-3">
                        <i class="fas fa-list-ul mr-1"></i>特徴量の内訳
                      </h6>
                      <div class="space-y-1 text-xs">
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">価格データ</span>
                          <span class="font-bold text-indigo-600">5個</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">移動平均</span>
                          <span class="font-bold text-indigo-600">3個</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">テクニカル</span>
                          <span class="font-bold text-indigo-600">2個</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">センチメント</span>
                          <span class="font-bold text-indigo-600">1個</span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                          <span class="text-gray-600">その他</span>
                          <span class="font-bold text-indigo-600">1個</span>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-info-circle mr-1"></i>
                          多様な観点から市場を分析
                        </p>
                      </div>
                    </div>
                    
                    <!-- 推論パフォーマンス -->
                    <div class="bg-white p-4 rounded-lg shadow">
                      <h6 class="font-bold text-sm text-indigo-700 mb-3">
                        <i class="fas fa-tachometer-alt mr-1"></i>推論パフォーマンス
                      </h6>
                      <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">推論時間:</span>
                          <span class="font-bold text-green-600">~0.1秒</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">実行環境:</span>
                          <span class="font-bold text-indigo-600">Cloud Run</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">リソース:</span>
                          <span class="font-bold text-indigo-600">512 MiB</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">API状態:</span>
                          <span class="font-bold text-green-600">
                            <i class="fas fa-check-circle"></i> 正常
                          </span>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-bolt mr-1"></i>
                          高速・スケーラブルな推論
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 特徴量重要度ビジュアライゼーション (動的) -->
                  <div class="mt-4 bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-indigo-700 mb-3">
                      <i class="fas fa-chart-bar mr-1"></i>特徴量重要度（Top 10）
                    </h6>
                    \${data.prediction.ml_prediction.feature_importances ? \`
                      <div class="mb-3">
                        <canvas id="featureImportanceChart" style="max-height: 250px;"></canvas>
                      </div>
                    \` : \`
                      <div class="space-y-2">
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">1. 現在価格 (close)</span>
                            <span class="text-xs font-bold text-indigo-600">100%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-600 h-2 rounded-full" style="width: 100%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">2. 20日移動平均 (SMA20)</span>
                            <span class="text-xs font-bold text-indigo-600">71%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-500 h-2 rounded-full" style="width: 71%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">3. RSI指標</span>
                            <span class="text-xs font-bold text-indigo-600">54%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-400 h-2 rounded-full" style="width: 54%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">4. MACD</span>
                            <span class="text-xs font-bold text-indigo-600">43%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-300 h-2 rounded-full" style="width: 43%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">5. ボラティリティ</span>
                            <span class="text-xs font-bold text-indigo-600">38%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-200 h-2 rounded-full" style="width: 38%"></div>
                          </div>
                        </div>
                      </div>
                    \`}
                    <div class="mt-3 pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        \${data.prediction.ml_prediction.feature_importances ? 
                          'ML APIから取得した実際の特徴量重要度' : 
                          '現在価格と移動平均が予測に最も影響（推定値）'}
                      </p>
                    </div>
                  </div>
                  
                  <!-- MLモデル性能指標 -->
                  \${data.prediction.ml_prediction.model_metrics ? \`
                  <div class="mt-4 bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-indigo-700 mb-3">
                      <i class="fas fa-chart-line mr-1"></i>モデル性能指標
                    </h6>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="bg-blue-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">MAE (平均絶対誤差)</p>
                        <p class="text-xl font-bold text-blue-600">\${data.prediction.ml_prediction.model_metrics.mae.toFixed(2)}</p>
                        <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                      </div>
                      <div class="bg-green-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">RMSE (平均二乗誤差)</p>
                        <p class="text-xl font-bold text-green-600">\${data.prediction.ml_prediction.model_metrics.rmse.toFixed(2)}</p>
                        <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                      </div>
                      <div class="bg-purple-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">R² スコア</p>
                        <p class="text-xl font-bold text-purple-600">\${data.prediction.ml_prediction.model_metrics.r2_score.toFixed(3)}</p>
                        <p class="text-xs text-gray-500 mt-1">1に近いほど高精度</p>
                      </div>
                      <div class="bg-orange-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">学習サンプル数</p>
                        <p class="text-xl font-bold text-orange-600">\${data.prediction.ml_prediction.model_metrics.training_samples.toLocaleString()}</p>
                        <p class="text-xs text-gray-500 mt-1">データ</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-database mr-1"></i>
                        学習データ: \${data.prediction.ml_prediction.training_info?.training_days || 'N/A'}日分のデータで学習
                      </p>
                    </div>
                  </div>
                  \` : ''}
                  
                  <!-- ML学習データ詳細 -->
                  \${data.prediction.ml_prediction.training_info ? \`
                  <div class="mt-4 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                    <h6 class="font-bold text-sm text-cyan-700 mb-3">
                      <i class="fas fa-database mr-1"></i>学習データ詳細
                    </h6>
                    <div class="grid grid-cols-2 gap-3 text-xs">
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">データ開始日</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.data_start_date}</p>
                      </div>
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">データ終了日</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.data_end_date}</p>
                      </div>
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">学習期間</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.training_days}日</p>
                      </div>
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">最終学習日</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.last_trained}</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-cyan-200">
                      <p class="text-xs text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        学習データは\${symbol}の過去\${data.prediction.ml_prediction.training_info.training_days}日分の株価データを使用し、LightGBMモデルで学習されています
                      </p>
                    </div>
                  </div>
                  \` : ''}
                  
                  <!-- 予測比較チャート -->
                  <div class="mt-4 bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-indigo-700 mb-3">
                      <i class="fas fa-chart-area mr-1"></i>予測手法の比較チャート
                    </h6>
                    <canvas id="predictionComparisonChart" style="max-height: 200px;"></canvas>
                    <div class="mt-3 pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        統計予測（青）とML予測（緑）の予測価格を視覚的に比較
                      </p>
                    </div>
                  </div>
                  
                  <!-- 統計的手法との比較 -->
                  <div class="mt-4 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                    <h6 class="font-bold text-sm text-gray-800 mb-3">
                      <i class="fas fa-exchange-alt mr-1"></i>統計手法 vs ML手法の違い
                    </h6>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-white p-3 rounded-lg shadow-sm">
                        <p class="text-xs font-bold text-blue-700 mb-2">統計的予測（5次元分析）</p>
                        <ul class="space-y-1 text-xs text-gray-600">
                          <li>✓ ルールベースの判定</li>
                          <li>✓ 解釈性が非常に高い</li>
                          <li>✓ リアルタイム計算</li>
                          <li>✗ 過去パターンを学習できない</li>
                          <li>✗ 非線形関係の捕捉が困難</li>
                        </ul>
                      </div>
                      <div class="bg-white p-3 rounded-lg shadow-sm">
                        <p class="text-xs font-bold text-green-700 mb-2">ML予測（LightGBM）</p>
                        <ul class="space-y-1 text-xs text-gray-600">
                          <li>✓ 過去データから自動学習</li>
                          <li>✓ 非線形関係を捕捉</li>
                          <li>✓ 高精度な価格予測</li>
                          <li>✗ ブラックボックス性</li>
                          <li>✗ 学習データが必要</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            \` : ''}

            <!-- オンデマンド学習結果（学習が実行された場合のみ表示） -->
            \${data.prediction.ml_training ? \`
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6 border-2 border-purple-300">
              <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg mb-4">
                <h4 class="font-bold text-2xl text-center">
                  <i class="fas fa-graduation-cap mr-2"></i>オンデマンド学習結果
                </h4>
                <p class="text-center text-purple-100 mt-2">
                  \${data.symbol}専用MLモデルを学習しました
                </p>
              </div>

              <!-- 学習サマリー -->
              <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">モデルID</p>
                  <p class="text-sm font-bold text-purple-700 truncate" title="\${data.prediction.ml_training.model_id}">
                    \${data.prediction.ml_training.model_id}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">学習時間</p>
                  <p class="text-2xl font-bold text-purple-700">
                    \${data.prediction.ml_training.training_duration.toFixed(1)}秒
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">学習サンプル数</p>
                  <p class="text-2xl font-bold text-purple-700">
                    \${data.prediction.ml_training.training_data.train_samples}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">テストサンプル数</p>
                  <p class="text-2xl font-bold text-purple-700">
                    \${data.prediction.ml_training.training_data.test_samples}
                  </p>
                </div>
              </div>

              <!-- 学習データ詳細 -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-database mr-2"></i>学習データ詳細
                </h5>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-600">総サンプル数:</span>
                      <span class="font-bold">\${data.prediction.ml_training.training_data.total_samples}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">学習セット:</span>
                      <span class="font-bold text-blue-600">\${data.prediction.ml_training.training_data.train_samples}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">テストセット:</span>
                      <span class="font-bold text-green-600">\${data.prediction.ml_training.training_data.test_samples}</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-600">特徴量数:</span>
                      <span class="font-bold">\${data.prediction.ml_training.training_data.features_count}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">分割比率:</span>
                      <span class="font-bold">80% / 20%</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">学習時刻:</span>
                      <span class="font-bold text-xs">\${new Date(data.prediction.ml_training.timestamp).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ハイパーパラメータ -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-cog mr-2"></i>ハイパーパラメータ
                </h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">目的関数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.objective}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">ブースティング</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.boosting_type}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">葉数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.num_leaves}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">学習率</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.learning_rate}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">最大深度</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.max_depth}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">最小葉データ数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.min_data_in_leaf}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">特徴量選択率</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.feature_fraction}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">バギング率</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.bagging_fraction}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">ラウンド数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.num_boost_round}</p>
                  </div>
                </div>
              </div>

              <!-- 学習曲線 -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-line mr-2"></i>学習曲線（Train/Validation Loss）
                </h5>
                <canvas id="learningCurveChart" style="max-height: 300px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  青線: 学習セット損失 | 赤線: 検証セット損失 | 損失が低いほど高精度
                </p>
              </div>

              <!-- 性能指標 -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-bar mr-2"></i>性能指標（Train vs Test）
                </h5>
                
                <div class="grid grid-cols-3 gap-6 mb-4">
                  <!-- RMSE -->
                  <div class="text-center">
                    <p class="text-sm text-gray-600 mb-2">RMSE（二乗平均平方根誤差）</p>
                    <div class="flex justify-center gap-6">
                      <div class="bg-blue-50 p-3 rounded">
                        <p class="text-xs text-gray-600 mb-1">Train</p>
                        <p class="text-xl font-bold text-blue-600">\${data.prediction.ml_training.performance_metrics.train_rmse.toFixed(2)}</p>
                      </div>
                      <div class="bg-green-50 p-3 rounded">
                        <p class="text-xs text-gray-600 mb-1">Test</p>
                        <p class="text-xl font-bold text-green-600">\${data.prediction.ml_training.performance_metrics.test_rmse.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <!-- MAE -->
                  <div class="text-center">
                    <p class="text-sm text-gray-600 mb-2">MAE（平均絶対誤差）</p>
                    <div class="flex justify-center gap-6">
                      <div class="bg-blue-50 p-3 rounded">
                        <p class="text-xs text-gray-600 mb-1">Train</p>
                        <p class="text-xl font-bold text-blue-600">\${data.prediction.ml_training.performance_metrics.train_mae.toFixed(2)}</p>
                      </div>
                      <div class="bg-green-50 p-3 rounded">
                        <p class="text-xs text-gray-600 mb-1">Test</p>
                        <p class="text-xl font-bold text-green-600">\${data.prediction.ml_training.performance_metrics.test_mae.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <!-- R² Score -->
                  <div class="text-center">
                    <p class="text-sm text-gray-600 mb-2">R²スコア（決定係数）</p>
                    <div class="flex justify-center gap-6">
                      <div class="bg-blue-50 p-3 rounded">
                        <p class="text-xs text-gray-600 mb-1">Train</p>
                        <p class="text-xl font-bold text-blue-600">\${data.prediction.ml_training.performance_metrics.train_r2.toFixed(4)}</p>
                      </div>
                      <div class="bg-green-50 p-3 rounded">
                        <p class="text-xs text-gray-600 mb-1">Test</p>
                        <p class="text-xl font-bold text-green-600">\${data.prediction.ml_training.performance_metrics.test_r2.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 汎化ギャップ -->
                <div class="bg-\${Math.abs(data.prediction.ml_training.performance_metrics.generalization_gap) < 2 ? 'green' : Math.abs(data.prediction.ml_training.performance_metrics.generalization_gap) < 5 ? 'yellow' : 'red'}-50 p-4 rounded-lg text-center">
                  <p class="text-sm text-gray-700 mb-2">
                    <i class="fas fa-exchange-alt mr-1"></i>汎化ギャップ（Test RMSE - Train RMSE）
                  </p>
                  <p class="text-3xl font-bold text-\${Math.abs(data.prediction.ml_training.performance_metrics.generalization_gap) < 2 ? 'green' : Math.abs(data.prediction.ml_training.performance_metrics.generalization_gap) < 5 ? 'yellow' : 'red'}-600">
                    \${data.prediction.ml_training.performance_metrics.generalization_gap.toFixed(2)}
                  </p>
                  <p class="text-xs text-gray-600 mt-2">
                    \${Math.abs(data.prediction.ml_training.performance_metrics.generalization_gap) < 2 
                      ? '✅ 優秀: 過学習なく汎化性能が高い' 
                      : Math.abs(data.prediction.ml_training.performance_metrics.generalization_gap) < 5 
                      ? '⚠️ 注意: 若干の過学習の可能性' 
                      : '❌ 過学習: 学習データへの過適応が見られる'}
                  </p>
                </div>
              </div>

              <!-- 特徴量重要度 -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-list-ol mr-2"></i>特徴量重要度ランキング（Top 10）
                </h5>
                <canvas id="featureImportanceTrainingChart" style="max-height: 350px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  モデルが予測に最も重視した特徴量（Gain-based）
                </p>
              </div>

              <!-- ML版株価チャート（過去30日 + 未来30日予測） -->
              \${data.prediction.ml_training.future_predictions ? \`
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-area mr-2"></i>ML版株価予測（過去30日 + 未来30日）
                </h5>
                <canvas id="mlFuturePriceChart" style="max-height: 400px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  青線: 過去の実績価格 | 緑線: ML予測価格 | 灰色エリア: 信頼区間（±5%）
                </p>
                
                <!-- 予測サマリー -->
                <div class="mt-4 grid grid-cols-3 gap-4">
                  <div class="bg-blue-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">30日後予測価格</p>
                    <p class="text-xl font-bold text-blue-600">
                      $\${data.prediction.ml_training.future_predictions.predictions[29].toFixed(2)}
                    </p>
                  </div>
                  <div class="bg-green-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">予測変化率</p>
                    <p class="text-xl font-bold \${((data.prediction.ml_training.future_predictions.predictions[29] - data.current_price) / data.current_price * 100) >= 0 ? 'text-green-600' : 'text-red-600'}">
                      \${((data.prediction.ml_training.future_predictions.predictions[29] - data.current_price) / data.current_price * 100) >= 0 ? '+' : ''}\${((data.prediction.ml_training.future_predictions.predictions[29] - data.current_price) / data.current_price * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div class="bg-purple-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">予測最高値</p>
                    <p class="text-xl font-bold text-purple-600">
                      $\${Math.max(...data.prediction.ml_training.future_predictions.predictions).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              \` : ''}

              <!-- ML版バックフィットチャート（過去30日の予測精度検証） -->
              \${data.prediction.ml_training.backfit_predictions ? \`
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-line mr-2"></i>ML予測精度検証（過去30日バックフィット）
                </h5>
                <canvas id="mlBackfitChart" style="max-height: 400px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  青線: 実際の価格 | オレンジ線: ML予測価格 | MLモデルが過去30日をどれだけ正確に予測できたか検証
                </p>
                
                <!-- バックフィット精度サマリー -->
                <div class="mt-4 grid grid-cols-3 gap-4">
                  <div class="bg-blue-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">RMSE（誤差）</p>
                    <p class="text-xl font-bold text-blue-600">
                      \${data.prediction.ml_training.backfit_predictions.rmse.toFixed(2)}
                    </p>
                  </div>
                  <div class="bg-green-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">MAE（平均誤差）</p>
                    <p class="text-xl font-bold text-green-600">
                      \${data.prediction.ml_training.backfit_predictions.mae.toFixed(2)}
                    </p>
                  </div>
                  <div class="bg-purple-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">方向性正解率</p>
                    <p class="text-xl font-bold text-purple-600">
                      \${data.prediction.ml_training.backfit_predictions.direction_accuracy.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div class="mt-3 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <p class="text-xs text-gray-700">
                    <i class="fas fa-lightbulb mr-1 text-yellow-600"></i>
                    <strong>方向性正解率</strong>: 価格が上がるか下がるかの予測が当たった割合。70%以上なら高精度。
                  </p>
                </div>
              </div>
              \` : ''}

              <!-- 学習成功メッセージ -->
              <div class="mt-6 bg-green-50 border-2 border-green-300 p-4 rounded-lg text-center">
                <p class="text-lg font-bold text-green-700">
                  <i class="fas fa-check-circle mr-2"></i>\${data.prediction.ml_training.message}
                </p>
                <p class="text-sm text-gray-600 mt-2">
                  学習されたモデルは7日間キャッシュされ、今後の予測に使用されます
                </p>
              </div>
            </div>
            \` : ''}

            <!-- 信頼度基準ガイド -->
            <div class="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold text-xl mb-4 text-center"><i class="fas fa-shield-alt mr-2"></i>信頼度基準ガイド</h4>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                  <p class="text-lg font-bold text-green-600 mb-2">信頼度 70%以上</p>
                  <p class="text-sm text-gray-700">✅ <strong>積極推奨:</strong> 高い確信度での投資判断が可能</p>
                  <p class="text-xs text-gray-500 mt-2">各次元のスコアが一致し、予測の信頼性が非常に高い状態</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                  <p class="text-lg font-bold text-yellow-600 mb-2">信頼度 50-70%</p>
                  <p class="text-sm text-gray-700">⚠️ <strong>慎重推奨:</strong> 慎重な判断を推奨</p>
                  <p class="text-xs text-gray-500 mt-2">一部の次元でスコアにばらつきあり、追加分析を推奨</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                  <p class="text-lg font-bold text-red-600 mb-2">信頼度 50%未満</p>
                  <p class="text-sm text-gray-700">❌ <strong>非推奨:</strong> 投資判断を見送ることを推奨</p>
                  <p class="text-xs text-gray-500 mt-2">スコアのばらつきが大きく、予測の信頼性が低い状態</p>
                </div>
              </div>
              <div class="bg-indigo-50 p-4 rounded-lg">
                <p class="text-sm font-bold mb-2">現在の信頼度: <span class="text-2xl \${data.prediction.confidence >= 70 ? 'text-green-600' : data.prediction.confidence >= 50 ? 'text-yellow-600' : 'text-red-600'}">\${data.prediction.confidence}%</span></p>
                <p class="text-sm text-gray-700">
                  \${data.prediction.confidence >= 70 ? '✅ この銘柄は高信頼度で投資推奨されます' : 
                     data.prediction.confidence >= 50 ? '⚠️ この銘柄は慎重な判断が必要です' : 
                     '❌ この銘柄は現時点で投資を見送ることを推奨します'}
                </p>
              </div>
            </div>

            <!-- 信頼度算出ロジックの詳細説明 -->
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6 border-2 border-indigo-300">
              <h4 class="font-bold text-xl mb-4 text-center">
                <i class="fas fa-calculator mr-2"></i>信頼度の算出方法（統計手法 vs ML手法）
              </h4>
              
              <div class="grid grid-cols-2 gap-6">
                <!-- 統計手法の信頼度 -->
                <div class="bg-white p-5 rounded-lg shadow-lg">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-chart-bar text-blue-600 text-2xl mr-3"></i>
                    <h5 class="font-bold text-lg text-blue-800">統計手法（5次元分析）</h5>
                  </div>
                  
                  <div class="space-y-3">
                    <div class="bg-blue-50 p-3 rounded">
                      <p class="text-xs font-bold text-blue-800 mb-2">📊 基本計算式</p>
                      <code class="text-xs bg-blue-100 px-2 py-1 rounded block">
                        信頼度 = 100 - (標準偏差 × 調整係数)
                      </code>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded">
                      <p class="text-xs font-bold text-gray-800 mb-2">🔍 計算ロジック</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>1. 5次元スコアを収集（テクニカル、ファンダメンタル等）</li>
                        <li>2. スコアの標準偏差を計算</li>
                        <li>3. ばらつきが小さい → 高信頼度</li>
                        <li>4. ばらつきが大きい → 低信頼度</li>
                      </ul>
                    </div>
                    
                    <div class="bg-green-50 p-3 rounded">
                      <p class="text-xs font-bold text-green-800 mb-2">✅ 特徴</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>• 各次元のスコア一貫性を重視</li>
                        <li>• 解釈性が高い</li>
                        <li>• リアルタイム計算</li>
                      </ul>
                    </div>
                    
                    <div class="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                      <p class="text-xs text-gray-700">
                        <strong>例:</strong> テクニカル85点、ファンダメンタル40点の場合、
                        ばらつきが大きいため信頼度が下がる
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- ML手法の信頼度 -->
                <div class="bg-white p-5 rounded-lg shadow-lg">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-brain text-green-600 text-2xl mr-3"></i>
                    <h5 class="font-bold text-lg text-green-800">ML手法（LightGBM）</h5>
                  </div>
                  
                  <div class="space-y-3">
                    <div class="bg-green-50 p-3 rounded">
                      <p class="text-xs font-bold text-green-800 mb-2">📊 基本計算式</p>
                      <code class="text-xs bg-green-100 px-2 py-1 rounded block">
                        信頼度 = (R²スコア × 0.7) + ((1 - 正規化RMSE) × 0.3)
                      </code>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded">
                      <p class="text-xs font-bold text-gray-800 mb-2">🔍 計算ロジック</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>1. テストデータでR²スコア計算（決定係数）</li>
                        <li>2. RMSE（誤差）を価格で正規化</li>
                        <li>3. R²スコア70% + 誤差30%で重み付け</li>
                        <li>4. 100倍してパーセンテージ化</li>
                      </ul>
                    </div>
                    
                    <div class="bg-purple-50 p-3 rounded">
                      <p class="text-xs font-bold text-purple-800 mb-2">✅ 特徴</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>• モデルの予測精度を直接反映</li>
                        <li>• テストデータで検証済み</li>
                        <li>• 過学習を考慮</li>
                      </ul>
                    </div>
                    
                    <div class="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                      <p class="text-xs text-gray-700">
                        <strong>例:</strong> R²=0.83, RMSE=$11の場合、
                        高いR²と低いRMSEで高信頼度
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 比較サマリー -->
              <div class="mt-4 bg-white p-4 rounded-lg shadow">
                <p class="text-sm font-bold text-center text-gray-800 mb-2">
                  <i class="fas fa-balance-scale mr-2"></i>どちらの信頼度を重視すべきか？
                </p>
                <div class="grid grid-cols-3 gap-3 text-xs">
                  <div class="text-center p-2 bg-blue-50 rounded">
                    <p class="font-bold text-blue-700">統計手法優先</p>
                    <p class="text-gray-600 mt-1">市場環境が安定</p>
                  </div>
                  <div class="text-center p-2 bg-purple-50 rounded">
                    <p class="font-bold text-purple-700">両方を参考</p>
                    <p class="text-gray-600 mt-1">通常の分析</p>
                  </div>
                  <div class="text-center p-2 bg-green-50 rounded">
                    <p class="font-bold text-green-700">ML手法優先</p>
                    <p class="text-gray-600 mt-1">過去パターン重視</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- BUY/SELL推奨タイミングと利益予測 -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold text-xl mb-4 text-center"><i class="fas fa-coins mr-2"></i>投資戦略推奨 (中長期)</h4>
              <p class="text-sm text-gray-600 text-center mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                推奨売却日は<strong>予測期間内の最高値日</strong>を表示(BUY判定時)
              </p>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-check mr-1"></i>推奨購入日</p>
                  <p class="text-xl font-bold text-green-600">\${data.prediction.future.buyDate}</p>
                  <p class="text-sm text-gray-500 mt-1">$\${data.prediction.future.buyPrice.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-times mr-1"></i>推奨売却日 (最高値予測日)</p>
                  <p class="text-xl font-bold text-red-600">\${data.prediction.future.sellDate}</p>
                  <p class="text-sm text-gray-500 mt-1">$\${data.prediction.future.sellPrice.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-sm text-gray-600 mb-2"><i class="fas fa-chart-line mr-1"></i>予想利益率</p>
                  <p class="text-2xl font-bold \${data.prediction.future.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}">
                    \${data.prediction.future.profitPercent >= 0 ? '+' : ''}\${data.prediction.future.profitPercent.toFixed(2)}%
                  </p>
                  <p class="text-sm text-gray-500 mt-1">
                    \${data.prediction.future.profitPercent >= 0 ? '利益見込み' : '損失リスク'}
                  </p>
                </div>
              </div>
              
              <!-- 短期トレード推奨 -->
              <div class="bg-white p-4 rounded-lg shadow mb-4">
                <h5 class="font-bold text-lg mb-3 text-indigo-700"><i class="fas fa-bolt mr-2"></i>短期トレード推奨 (デイトレード〜スイング)</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-indigo-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">3日後売却</p>
                    <p class="text-lg font-bold text-indigo-600">
                      \${(() => {
                        const idx = 3
                        const price = data.prediction.future.predictedPrices[idx]
                        const profit = ((price - data.prediction.future.buyPrice) / data.prediction.future.buyPrice * 100)
                        return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                      })()}
                    </p>
                    <p class="text-xs text-gray-500">\${data.prediction.future.dates[3]}</p>
                  </div>
                  <div class="bg-indigo-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">7日後売却</p>
                    <p class="text-lg font-bold text-indigo-600">
                      \${(() => {
                        const idx = 7
                        const price = data.prediction.future.predictedPrices[idx]
                        const profit = ((price - data.prediction.future.buyPrice) / data.prediction.future.buyPrice * 100)
                        return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                      })()}
                    </p>
                    <p class="text-xs text-gray-500">\${data.prediction.future.dates[7]}</p>
                  </div>
                  <div class="bg-indigo-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">14日後売却</p>
                    <p class="text-lg font-bold text-indigo-600">
                      \${(() => {
                        const idx = 14
                        const price = data.prediction.future.predictedPrices[idx]
                        const profit = ((price - data.prediction.future.buyPrice) / data.prediction.future.buyPrice * 100)
                        return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                      })()}
                    </p>
                    <p class="text-xs text-gray-500">\${data.prediction.future.dates[14]}</p>
                  </div>
                </div>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-lightbulb mr-1 text-yellow-500"></i>
                  短期トレードは方向性的中率が高い場合に有効です
                </p>
              </div>
              
              <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-exclamation-circle mr-2 text-yellow-600"></i>
                  <strong>重要:</strong> この予測は過去データと現在のスコアに基づく統計的推定です。
                  実際の市場は予測通りに動かない可能性があります。投資は自己責任で行ってください。
                </p>
              </div>
            </div>

            <!-- ML版投資戦略推奨 (中長期) -->
            \${data.prediction.ml_training && data.prediction.ml_training.future_predictions ? \`
            <div class="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg mb-6 border-2 border-green-300">
              <h4 class="font-bold text-xl mb-4 text-center">
                <i class="fas fa-robot mr-2"></i>ML投資戦略推奨 (中長期)
              </h4>
              <p class="text-sm text-gray-600 text-center mb-4">
                <i class="fas fa-brain mr-1"></i>
                LightGBMモデルによる機械学習ベースの投資戦略（未来30日予測）
              </p>
              
              \${(() => {
                const predictions = data.prediction.ml_training.future_predictions.predictions
                const dates = data.prediction.ml_training.future_predictions.dates
                const buyPrice = data.current_price
                const buyDate = dates[0]
                
                // 最高値を見つける
                let maxPrice = predictions[0]
                let maxPriceIdx = 0
                for (let i = 1; i < predictions.length; i++) {
                  if (predictions[i] > maxPrice) {
                    maxPrice = predictions[i]
                    maxPriceIdx = i
                  }
                }
                const sellPrice = maxPrice
                const sellDate = dates[maxPriceIdx]
                const profitPercent = ((sellPrice - buyPrice) / buyPrice * 100)
                
                return \`
                <div class="grid grid-cols-3 gap-4 mb-4">
                  <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-check mr-1"></i>推奨購入日</p>
                    <p class="text-xl font-bold text-green-600">\${buyDate}</p>
                    <p class="text-sm text-gray-500 mt-1">$\${buyPrice.toFixed(2)}</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-times mr-1"></i>推奨売却日 (ML予測最高値)</p>
                    <p class="text-xl font-bold text-red-600">\${sellDate}</p>
                    <p class="text-sm text-gray-500 mt-1">$\${sellPrice.toFixed(2)}</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2"><i class="fas fa-chart-line mr-1"></i>ML予測利益率</p>
                    <p class="text-2xl font-bold \${profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}">
                      \${profitPercent >= 0 ? '+' : ''}\${profitPercent.toFixed(2)}%
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      \${profitPercent >= 0 ? '利益見込み' : '損失リスク'}
                    </p>
                  </div>
                </div>
                
                <!-- 短期トレード推奨（ML版） -->
                <div class="bg-white p-4 rounded-lg shadow mb-4">
                  <h5 class="font-bold text-lg mb-3 text-teal-700"><i class="fas fa-bolt mr-2"></i>ML短期トレード推奨 (デイトレード〜スイング)</h5>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="bg-teal-50 p-3 rounded">
                      <p class="text-xs text-gray-600 mb-1">3日後売却</p>
                      <p class="text-lg font-bold text-teal-600">
                        \${(() => {
                          const idx = 3
                          const price = predictions[idx]
                          const profit = ((price - buyPrice) / buyPrice * 100)
                          return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                        })()}
                      </p>
                      <p class="text-xs text-gray-500">\${dates[3]}</p>
                      <p class="text-xs text-gray-600 mt-1">予測価格: $\${predictions[3].toFixed(2)}</p>
                    </div>
                    <div class="bg-teal-50 p-3 rounded">
                      <p class="text-xs text-gray-600 mb-1">7日後売却</p>
                      <p class="text-lg font-bold text-teal-600">
                        \${(() => {
                          const idx = 7
                          const price = predictions[idx]
                          const profit = ((price - buyPrice) / buyPrice * 100)
                          return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                        })()}
                      </p>
                      <p class="text-xs text-gray-500">\${dates[7]}</p>
                      <p class="text-xs text-gray-600 mt-1">予測価格: $\${predictions[7].toFixed(2)}</p>
                    </div>
                    <div class="bg-teal-50 p-3 rounded">
                      <p class="text-xs text-gray-600 mb-1">14日後売却</p>
                      <p class="text-lg font-bold text-teal-600">
                        \${(() => {
                          const idx = 14
                          const price = predictions[idx]
                          const profit = ((price - buyPrice) / buyPrice * 100)
                          return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                        })()}
                      </p>
                      <p class="text-xs text-gray-500">\${dates[14]}</p>
                      <p class="text-xs text-gray-600 mt-1">予測価格: $\${predictions[14].toFixed(2)}</p>
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 mt-3 text-center">
                    <i class="fas fa-robot mr-1 text-teal-500"></i>
                    MLモデルの学習パターンに基づく短期予測（方向性正解率: \${data.prediction.ml_training.backfit_predictions?.direction_accuracy.toFixed(1) || 'N/A'}%）
                  </p>
                </div>
                \`
              })()}
              
              <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-lightbulb mr-2 text-green-600"></i>
                  <strong>ML予測の特徴:</strong> 過去のパターンを学習したモデルによる予測です。
                  統計的予測と比較して、より複雑な非線形関係を捉えることができます。
                  両方の予測を参考にして総合的な判断を行うことを推奨します。
                </p>
              </div>
            </div>
            \` : ''}

            <!-- 予測精度指標 -->
            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold text-xl mb-4 text-center"><i class="fas fa-chart-bar mr-2"></i>予測精度評価 (過去30日)</h4>
              <div class="grid grid-cols-4 gap-4 mb-4">
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">RMSE (平均二乗誤差)</p>
                  <p class="text-2xl font-bold text-purple-600">\${data.prediction.backfit.accuracy.rmse.toFixed(2)}</p>
                  <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.rmse < 3 ? 'text-green-600' : data.prediction.backfit.accuracy.rmse < 6 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.rmse < 3 ? '✓ 高精度' : data.prediction.backfit.accuracy.rmse < 6 ? '△ 中精度' : '✗ 低精度'}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">MAE (平均絶対誤差)</p>
                  <p class="text-2xl font-bold text-indigo-600">\${data.prediction.backfit.accuracy.mae.toFixed(2)}</p>
                  <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.mae < 2 ? 'text-green-600' : data.prediction.backfit.accuracy.mae < 4 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.mae < 2 ? '✓ 高精度' : data.prediction.backfit.accuracy.mae < 4 ? '△ 中精度' : '✗ 低精度'}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">MAPE (平均誤差率)</p>
                  <p class="text-2xl font-bold text-blue-600">\${data.prediction.backfit.accuracy.mape.toFixed(2)}%</p>
                  <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.mape < 3 ? 'text-green-600' : data.prediction.backfit.accuracy.mape < 6 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.mape < 3 ? '✓ 高精度' : data.prediction.backfit.accuracy.mape < 6 ? '△ 中精度' : '✗ 低精度'}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">方向性的中率</p>
                  <p class="text-2xl font-bold text-green-600">\${data.prediction.backfit.accuracy.directionAccuracy.toFixed(1)}%</p>
                  <p class="text-xs text-gray-500 mt-1">上昇/下降の判定</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.directionAccuracy >= 60 ? 'text-green-600' : data.prediction.backfit.accuracy.directionAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.directionAccuracy >= 60 ? '✓ 信頼可' : data.prediction.backfit.accuracy.directionAccuracy >= 50 ? '△ 慎重判断' : '✗ 信頼低'}
                  </p>
                </div>
              </div>
              
              <!-- GO基準表 -->
              <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h5 class="font-bold text-md mb-3 text-center"><i class="fas fa-check-circle mr-2 text-green-500"></i>予測精度GO基準</h5>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="border-l-4 border-green-500 pl-3 py-2 bg-green-50">
                    <p class="font-bold text-green-700">✓ 投資判断推奨</p>
                    <p class="text-xs text-gray-600 mt-1">MAPE < 3% <strong>かつ</strong> 方向性的中率 ≥ 60%</p>
                  </div>
                  <div class="border-l-4 border-yellow-500 pl-3 py-2 bg-yellow-50">
                    <p class="font-bold text-yellow-700">△ 慎重判断推奨</p>
                    <p class="text-xs text-gray-600 mt-1">MAPE < 6% <strong>かつ</strong> 方向性的中率 ≥ 50%</p>
                  </div>
                  <div class="border-l-4 border-red-500 pl-3 py-2 bg-red-50">
                    <p class="font-bold text-red-700">✗ 投資判断非推奨</p>
                    <p class="text-xs text-gray-600 mt-1">MAPE ≥ 6% <strong>または</strong> 方向性的中率 < 50%</p>
                  </div>
                  <div class="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
                    <p class="font-bold text-blue-700">総合判定</p>
                    <p class="text-xs font-bold mt-1 \${data.prediction.backfit.accuracy.mape < 3 && data.prediction.backfit.accuracy.directionAccuracy >= 60 ? 'text-green-600' : data.prediction.backfit.accuracy.mape < 6 && data.prediction.backfit.accuracy.directionAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                      \${data.prediction.backfit.accuracy.mape < 3 && data.prediction.backfit.accuracy.directionAccuracy >= 60 ? '✓ 投資判断推奨' : data.prediction.backfit.accuracy.mape < 6 && data.prediction.backfit.accuracy.directionAccuracy >= 50 ? '△ 慎重判断推奨' : '✗ 投資判断非推奨'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                  <strong>精度評価:</strong> 過去30日のデータに対して移動平均ベースの非線形予測アルゴリズムを適用し、実績と比較した結果です。
                  MAPE(平均誤差率)が低く、方向性的中率が高いほど、未来予測の信頼性が高いと判断できます。
                </p>
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

            <div class="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-3"><i class="fas fa-robot mr-2"></i>GPT-5による詳細解説</h4>
              <p class="text-gray-700 whitespace-pre-wrap">\${data.prediction.detailed_explanation}</p>
            </div>

            \${data.prediction.gpt5_final_judgment ? \`
            <!-- GPT-5最終判断セクション -->
            <div class="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-lg shadow-xl mb-6 text-white">
              <div class="flex items-center mb-4">
                <i class="fas fa-brain text-4xl mr-4"></i>
                <div>
                  <h4 class="font-bold text-2xl">GPT-5 最終判断</h4>
                  <p class="text-sm opacity-90">全データを統合したAIによる最終ジャッジ</p>
                </div>
              </div>
              
              <!-- 計算ロジックの説明 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-2"><i class="fas fa-info-circle mr-2"></i>GPT-5の分析プロセス</h5>
                <div class="text-sm space-y-2">
                  <p><strong>【ステップ1】サーバー側で基本統計を計算</strong></p>
                  <ul class="ml-4 text-xs space-y-1 opacity-90">
                    <li>• 過去30日の価格データから線形回帰による価格予測</li>
                    <li>• ボラティリティ、トレンド強度（R²値）、移動平均を計算</li>
                    <li>• 3日、7日、14日、30日、60日、90日後の統計的予測価格を算出</li>
                  </ul>
                  
                  <p class="mt-2"><strong>【ステップ2】GPT-5がCode Interpreterで高度計算</strong></p>
                  <ul class="ml-4 text-xs space-y-1 opacity-90">
                    <li>• Pythonでモンテカルロシミュレーション（1000回）を実行</li>
                    <li>• 年率ボラティリティ、シャープレシオ、最大ドローダウン、VaRを計算</li>
                    <li>• 統計的予測値の信頼区間を算出</li>
                  </ul>
                  
                  <p class="mt-2"><strong>【ステップ3】全データを統合して最終判断</strong></p>
                  <ul class="ml-4 text-xs space-y-1 opacity-90">
                    <li>• 統計予測 + Code Interpreter結果 + 5次元分析を総合評価</li>
                    <li>• <span class="text-yellow-300 font-bold">価格予測は統計値から±10%以内で調整</span></li>
                    <li>• <span class="text-yellow-300 font-bold">最適な売買タイミングは予測価格と整合性を保つ</span></li>
                    <li>• ファンダメンタル・センチメントが強い場合のみ±15%まで調整</li>
                  </ul>
                  
                  <p class="mt-2 bg-yellow-500 bg-opacity-20 p-2 rounded">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    <strong>注意:</strong> GPT-5は確率的モデルのため、同じ入力でも実行ごとに若干異なる結果が出る場合があります。
                    ただし、統計的な基準値を守るため、大幅な変動はありません。
                  </p>
                </div>
              </div>
              
              <!-- アクションと信頼度 -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <p class="text-sm opacity-90 mb-2">最終判定</p>
                  <p class="text-3xl font-bold">
                    \${data.prediction.gpt5_final_judgment.action}
                    \${data.prediction.gpt5_final_judgment.action === 'BUY' ? '🚀' : data.prediction.gpt5_final_judgment.action === 'SELL' ? '⚠️' : '⏸️'}
                  </p>
                </div>
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <p class="text-sm opacity-90 mb-2">AI信頼度</p>
                  <p class="text-3xl font-bold">\${data.prediction.gpt5_final_judgment.confidence}%</p>
                </div>
              </div>

              <!-- 統計モデルとの比較 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <div class="flex items-center mb-2">
                  <i class="fas fa-balance-scale mr-2"></i>
                  <h5 class="font-bold">統計モデルとの比較</h5>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">統計モデル判定: <span class="font-bold">\${data.prediction.action}</span></p>
                    <p class="text-sm opacity-90">GPT-5判定: <span class="font-bold">\${data.prediction.gpt5_final_judgment.action}</span></p>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl">
                      \${data.prediction.gpt5_final_judgment.agreement_with_statistical_model.agrees ? '✅' : '⚠️'}
                    </span>
                    <p class="text-xs mt-1">
                      \${data.prediction.gpt5_final_judgment.agreement_with_statistical_model.agrees ? '一致' : '相違あり'}
                    </p>
                  </div>
                </div>
                <p class="text-sm mt-2 bg-white bg-opacity-10 p-2 rounded">
                  \${data.prediction.gpt5_final_judgment.agreement_with_statistical_model.reason}
                </p>
              </div>

              <!-- 判断理由 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-2"><i class="fas fa-comment-dots mr-2"></i>判断理由</h5>
                <p class="text-sm leading-relaxed">\${data.prediction.gpt5_final_judgment.reasoning}</p>
              </div>

              <!-- 主要要因 -->
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <h5 class="font-bold mb-2 text-sm"><i class="fas fa-star mr-1"></i>最重要要因</h5>
                  <ul class="space-y-1">
                    \${data.prediction.gpt5_final_judgment.key_factors.most_important.map(f => \`
                      <li class="text-xs">• \${f}</li>
                    \`).join('')}
                  </ul>
                </div>
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <h5 class="font-bold mb-2 text-sm"><i class="fas fa-check-circle mr-1"></i>支持データ</h5>
                  <ul class="space-y-1">
                    \${data.prediction.gpt5_final_judgment.key_factors.supporting_data.slice(0, 3).map(f => \`
                      <li class="text-xs">• \${f}</li>
                    \`).join('')}
                  </ul>
                </div>
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <h5 class="font-bold mb-2 text-sm"><i class="fas fa-exclamation-triangle mr-1"></i>懸念点</h5>
                  <ul class="space-y-1">
                    \${data.prediction.gpt5_final_judgment.key_factors.concerns.map(f => \`
                      <li class="text-xs">• \${f}</li>
                    \`).join('')}
                  </ul>
                </div>
              </div>

              <!-- リスク評価 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <div class="flex items-center justify-between mb-2">
                  <h5 class="font-bold"><i class="fas fa-shield-alt mr-2"></i>リスク評価</h5>
                  <span class="px-3 py-1 rounded-full text-sm font-bold \${
                    data.prediction.gpt5_final_judgment.risk_assessment.level === 'LOW' ? 'bg-green-500' :
                    data.prediction.gpt5_final_judgment.risk_assessment.level === 'MEDIUM' ? 'bg-yellow-500 text-gray-900' :
                    'bg-red-500'
                  }">
                    \${data.prediction.gpt5_final_judgment.risk_assessment.level}
                  </span>
                </div>
                <p class="text-sm">\${data.prediction.gpt5_final_judgment.risk_assessment.description}</p>
              </div>

              <!-- 推奨事項 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-2"><i class="fas fa-lightbulb mr-2"></i>投資家への推奨</h5>
                <p class="text-sm leading-relaxed">\${data.prediction.gpt5_final_judgment.recommendation}</p>
              </div>

              \${data.prediction.gpt5_final_judgment.price_predictions ? \`
              <!-- GPT-5独自の価格予測 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-chart-line mr-2"></i>GPT-5独自の価格予測</h5>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs font-bold mb-2">短期予測（3-14日）</p>
                    <div class="space-y-2">
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>3日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_3.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_3.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>7日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_7.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_7.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>14日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_14.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_14.confidence}%</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs font-bold mb-2">中期予測（30-90日）</p>
                    <div class="space-y-2">
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>30日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_30.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_30.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>60日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_60.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_60.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>90日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_90.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_90.confidence}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- GPT-5価格予測チャート -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                <h6 class="font-bold mb-3 text-sm"><i class="fas fa-chart-line mr-2"></i>GPT-5価格予測チャート</h6>
                <canvas id="gpt5PricePredictionChart" style="max-height: 300px;"></canvas>
                <p class="text-xs mt-3 opacity-75 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  現在価格からGPT-5が予測した短期・中期の価格推移
                </p>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.optimal_timing ? \`
              <!-- 最適な売買タイミング -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-calendar-alt mr-2"></i>最適な売買タイミング</h5>
                <div class="grid grid-cols-3 gap-4 mb-3">
                  <div class="bg-green-500 bg-opacity-30 p-3 rounded-lg">
                    <p class="text-xs font-bold mb-1"><i class="fas fa-arrow-down mr-1"></i>エントリー（購入）</p>
                    <p class="text-sm font-bold mb-1">\${data.prediction.gpt5_final_judgment.optimal_timing.entry.recommended_date}</p>
                    <p class="text-xs">価格帯: $\${data.prediction.gpt5_final_judgment.optimal_timing.entry.price_range.min.toFixed(2)} - $\${data.prediction.gpt5_final_judgment.optimal_timing.entry.price_range.max.toFixed(2)}</p>
                    <p class="text-xs mt-2 opacity-90">\${data.prediction.gpt5_final_judgment.optimal_timing.entry.reasoning}</p>
                  </div>
                  <div class="bg-red-500 bg-opacity-30 p-3 rounded-lg">
                    <p class="text-xs font-bold mb-1"><i class="fas fa-arrow-up mr-1"></i>エグジット（売却）</p>
                    <p class="text-sm font-bold mb-1">\${data.prediction.gpt5_final_judgment.optimal_timing.exit.recommended_date}</p>
                    <p class="text-xs">価格帯: $\${data.prediction.gpt5_final_judgment.optimal_timing.exit.price_range.min.toFixed(2)} - $\${data.prediction.gpt5_final_judgment.optimal_timing.exit.price_range.max.toFixed(2)}</p>
                    <p class="text-xs mt-2 opacity-90">\${data.prediction.gpt5_final_judgment.optimal_timing.exit.reasoning}</p>
                  </div>
                  <div class="bg-orange-500 bg-opacity-30 p-3 rounded-lg">
                    <p class="text-xs font-bold mb-1"><i class="fas fa-hand-paper mr-1"></i>ストップロス</p>
                    <p class="text-sm font-bold mb-1">$\${data.prediction.gpt5_final_judgment.optimal_timing.stop_loss.price.toFixed(2)}</p>
                    <p class="text-xs">(\${data.prediction.gpt5_final_judgment.optimal_timing.stop_loss.percentage.toFixed(1)}%)</p>
                    <p class="text-xs mt-2 opacity-90">\${data.prediction.gpt5_final_judgment.optimal_timing.stop_loss.reasoning}</p>
                  </div>
                </div>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.portfolio_allocation ? \`
              <!-- ポートフォリオ配分提案 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-pie-chart mr-2"></i>ポートフォリオ配分提案</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">保守的投資家</p>
                    <p class="text-3xl font-bold mb-1">\${data.prediction.gpt5_final_judgment.portfolio_allocation.conservative.percentage}%</p>
                    <p class="text-xs opacity-90">\${data.prediction.gpt5_final_judgment.portfolio_allocation.conservative.reasoning}</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">中庸投資家</p>
                    <p class="text-3xl font-bold mb-1">\${data.prediction.gpt5_final_judgment.portfolio_allocation.moderate.percentage}%</p>
                    <p class="text-xs opacity-90">\${data.prediction.gpt5_final_judgment.portfolio_allocation.moderate.reasoning}</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">積極的投資家</p>
                    <p class="text-3xl font-bold mb-1">\${data.prediction.gpt5_final_judgment.portfolio_allocation.aggressive.percentage}%</p>
                    <p class="text-xs opacity-90">\${data.prediction.gpt5_final_judgment.portfolio_allocation.aggressive.reasoning}</p>
                  </div>
                </div>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.scenario_analysis ? \`
              <!-- シナリオ分析 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-project-diagram mr-2"></i>シナリオ分析</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-green-500 bg-opacity-20 p-3 rounded">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold">🎯 ベストケース</p>
                      <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.probability}%</span>
                    </div>
                    <p class="text-2xl font-bold mb-1">$\${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.price_target.toFixed(2)}</p>
                    <p class="text-xs mb-2 opacity-90">期間: \${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.timeframe}</p>
                    <p class="text-xs font-bold mb-1">前提条件:</p>
                    <ul class="text-xs space-y-1">
                      \${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.conditions.map(c => \`<li>• \${c}</li>\`).join('')}
                    </ul>
                  </div>
                  <div class="bg-blue-500 bg-opacity-20 p-3 rounded">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold">📊 ベースケース</p>
                      <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.probability}%</span>
                    </div>
                    <p class="text-2xl font-bold mb-1">$\${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.price_target.toFixed(2)}</p>
                    <p class="text-xs mb-2 opacity-90">期間: \${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.timeframe}</p>
                    <p class="text-xs font-bold mb-1">前提条件:</p>
                    <ul class="text-xs space-y-1">
                      \${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.conditions.map(c => \`<li>• \${c}</li>\`).join('')}
                    </ul>
                  </div>
                  <div class="bg-red-500 bg-opacity-20 p-3 rounded">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold">⚠️ ワーストケース</p>
                      <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.probability}%</span>
                    </div>
                    <p class="text-2xl font-bold mb-1">$\${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.price_target.toFixed(2)}</p>
                    <p class="text-xs mb-2 opacity-90">期間: \${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.timeframe}</p>
                    <p class="text-xs font-bold mb-1">前提条件:</p>
                    <ul class="text-xs space-y-1">
                      \${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.conditions.map(c => \`<li>• \${c}</li>\`).join('')}
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- シナリオ分析チャート -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                <h6 class="font-bold mb-3 text-sm"><i class="fas fa-chart-bar mr-2"></i>シナリオ分析チャート</h6>
                <canvas id="scenarioAnalysisChart" style="max-height: 250px;"></canvas>
                <p class="text-xs mt-3 opacity-75 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  ベストケース・ベースケース・ワーストケースの価格目標と確率分布
                </p>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.upcoming_events && data.prediction.gpt5_final_judgment.upcoming_events.length > 0 ? \`
              <!-- 今後の重要イベント -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-calendar-check mr-2"></i>今後の重要イベント</h5>
                <div class="space-y-2">
                  \${data.prediction.gpt5_final_judgment.upcoming_events.map(event => \`
                    <div class="bg-white bg-opacity-10 p-3 rounded flex items-start">
                      <div class="flex-shrink-0 mr-3">
                        <div class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${event.date}</div>
                      </div>
                      <div class="flex-grow">
                        <div class="flex items-center mb-1">
                          <span class="text-sm font-bold mr-2">\${event.event}</span>
                          <span class="text-xs px-2 py-1 rounded \${
                            event.expected_impact === 'POSITIVE' ? 'bg-green-500' :
                            event.expected_impact === 'NEGATIVE' ? 'bg-red-500' :
                            'bg-gray-500'
                          }">
                            \${event.expected_impact === 'POSITIVE' ? '↑ ポジティブ' :
                              event.expected_impact === 'NEGATIVE' ? '↓ ネガティブ' :
                              '→ 中立'}
                          </span>
                        </div>
                        <p class="text-xs opacity-90">\${event.description}</p>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              </div>
              \` : ''}

              <!-- 統計的リスク指標（Code Interpreterによる高度計算結果） -->
              \${data.prediction.gpt5_final_judgment.statistical_metrics ? \`
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-calculator mr-2"></i>統計的リスク指標 (Code Interpreter計算)</h5>
                <div class="grid grid-cols-4 gap-4 mb-3">
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">年率ボラティリティ</p>
                    <p class="text-2xl font-bold">\${data.prediction.gpt5_final_judgment.statistical_metrics.annual_volatility.toFixed(2)}%</p>
                    <p class="text-xs mt-1 opacity-75">価格変動の大きさ</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">シャープレシオ</p>
                    <p class="text-2xl font-bold">\${data.prediction.gpt5_final_judgment.statistical_metrics.sharpe_ratio.toFixed(2)}</p>
                    <p class="text-xs mt-1 opacity-75">リスク調整後リターン</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">最大ドローダウン</p>
                    <p class="text-2xl font-bold text-red-300">\${data.prediction.gpt5_final_judgment.statistical_metrics.max_drawdown.toFixed(2)}%</p>
                    <p class="text-xs mt-1 opacity-75">最大下落率</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">VaR (95%)</p>
                    <p class="text-2xl font-bold text-orange-300">$\${data.prediction.gpt5_final_judgment.statistical_metrics.value_at_risk.toFixed(2)}</p>
                    <p class="text-xs mt-1 opacity-75">5%確率での損失額</p>
                  </div>
                </div>
                <div class="bg-blue-500 bg-opacity-20 p-3 rounded">
                  <p class="text-xs">
                    <i class="fas fa-info-circle mr-1"></i>
                    <strong>Code Interpreterによる計算:</strong> これらの指標はGPT-5がPythonで実際に計算した結果です。
                    モンテカルロシミュレーションや時系列分析など、高度な統計手法を使用しています。
                  </p>
                </div>
              </div>
              \` : ''}
              
              <!-- モンテカルロシミュレーション結果 -->
              \${data.prediction.gpt5_final_judgment.monte_carlo_results ? \`
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-dice mr-2"></i>モンテカルロシミュレーション結果</h5>
                <canvas id="monteCarloChart" style="max-height: 300px;"></canvas>
                <div class="grid grid-cols-3 gap-3 mt-3">
                  <div class="bg-white bg-opacity-10 p-2 rounded text-center">
                    <p class="text-xs mb-1">90日後 中央値</p>
                    <p class="text-lg font-bold">$\${data.prediction.gpt5_final_judgment.monte_carlo_results.day_90_median.toFixed(2)}</p>
                  </div>
                  <div class="bg-green-500 bg-opacity-20 p-2 rounded text-center">
                    <p class="text-xs mb-1">95%信頼区間 上限</p>
                    <p class="text-lg font-bold text-green-300">$\${data.prediction.gpt5_final_judgment.monte_carlo_results.day_90_upper.toFixed(2)}</p>
                  </div>
                  <div class="bg-red-500 bg-opacity-20 p-2 rounded text-center">
                    <p class="text-xs mb-1">95%信頼区間 下限</p>
                    <p class="text-lg font-bold text-red-300">$\${data.prediction.gpt5_final_judgment.monte_carlo_results.day_90_lower.toFixed(2)}</p>
                  </div>
                </div>
                <p class="text-xs mt-3 opacity-75 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  1000回のシミュレーションに基づく価格予測の分布
                </p>
              </div>
              \` : ''}

              <!-- 使用データソース -->
              <div class="bg-white bg-opacity-10 p-3 rounded-lg">
                <p class="text-xs opacity-75 mb-2">
                  <i class="fas fa-database mr-1"></i>分析に使用したデータソース:
                </p>
                <div class="flex flex-wrap gap-2">
                  \${data.prediction.gpt5_final_judgment.data_sources_used.map(source => \`
                    <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${source}</span>
                  \`).join('')}
                </div>
              </div>
            </div>
            \` : \`
            <!-- GPT-5分析が利用できない場合の表示 -->
            <div class="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-lg mb-6">
              <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-yellow-600 text-3xl mr-4 mt-1"></i>
                <div>
                  <h4 class="font-bold text-xl text-yellow-800 mb-2">GPT-5最終判断が利用できません</h4>
                  <div class="text-sm text-yellow-700 space-y-2">
                    <p><strong>考えられる原因:</strong></p>
                    <ul class="list-disc ml-5 space-y-1">
                      <li>GPT-5 APIの応答がタイムアウトしました（5分以上）</li>
                      <li>Code Interpreterの処理に時間がかかりすぎています</li>
                      <li>OpenAI APIサーバーの一時的な問題</li>
                      <li>ネットワークの問題</li>
                    </ul>
                    <p class="mt-3 bg-blue-100 p-2 rounded">
                      <i class="fas fa-info-circle mr-1"></i>
                      <strong>通常の処理時間:</strong> GPT-5 + Code Interpreterは2分47秒～4分7秒かかります。
                      タイムアウトを5分に設定していますが、それでも失敗する場合は再試行してください。
                    </p>
                    <p class="mt-3"><strong>対策:</strong></p>
                    <ul class="list-disc ml-5 space-y-1">
                      <li>しばらく待ってから再度お試しください</li>
                      <li>統計モデルの予測結果（下記）は利用可能です</li>
                      <li>問題が続く場合は、開発者ツール（F12）のコンソールログをご確認ください</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            \`}
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-xl font-bold mb-4">株価チャート（過去30日 + 未来30日予測）</h3>
            <canvas id="priceChart"></canvas>
          </div>
        \`

        document.getElementById('analysis-result').innerHTML = resultHTML
        document.getElementById('analysis-result').style.display = 'block'

        // Chart.jsでグラフ表示（過去実績 + 未来予測）
        const ctx = document.getElementById('priceChart').getContext('2d')
        
        // 過去30日と未来30日のデータを結合（データ存在チェック）
        const chartDates = data.chart_data?.dates || []
        const chartPrices = data.chart_data?.prices || []
        const futureDates = data.prediction.future?.dates || []
        const futurePredictedPrices = data.prediction.future?.predictedPrices || []
        const backfitPredictedPrices = data.prediction.backfit?.predictedPrices || []
        
        const allDates = [...chartDates, ...(futureDates.length > 0 ? futureDates.slice(1) : [])]
        const historicalPrices = [...chartPrices]
        const backfitPrices = [...backfitPredictedPrices]
        const futurePrices = [null, ...(futurePredictedPrices.length > 0 ? futurePredictedPrices.slice(1) : [])]
        
        // 過去データをnullで埋める
        const historicalData = [...historicalPrices, ...new Array(futurePrices.length - 1).fill(null)]
        const backfitData = [...backfitPrices, ...new Array(futurePrices.length - 1).fill(null)]
        const futureData = [...new Array(historicalPrices.length - 1).fill(null), ...futurePrices]
        
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: allDates,
            datasets: [
              {
                label: '株価 (過去30日実績)',
                data: historicalData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true,
                pointRadius: 2
              },
              {
                label: '予測 (過去30日バックフィット)',
                data: backfitData,
                borderColor: 'rgb(139, 92, 246)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [3, 3],
                tension: 0.1,
                fill: false,
                pointRadius: 1
              },
              {
                label: '予測 (未来30日)',
                data: futureData,
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.1,
                fill: true,
                pointRadius: 2
              }
            ]
          },
          options: {
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: { 
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  title: function(context) {
                    return '日付: ' + context[0].label
                  },
                  afterBody: function(context) {
                    // 5次元分析データを表示
                    return [
                      '',
                      '【5次元分析スコア】',
                      'テクニカル: ' + data.prediction.breakdown.technical + '点',
                      'ファンダメンタル: ' + data.prediction.breakdown.fundamental + '点',
                      'センチメント: ' + data.prediction.breakdown.sentiment + '点',
                      'マクロ経済: ' + data.prediction.breakdown.macro + '点',
                      'アナリスト: ' + data.prediction.breakdown.analyst + '点',
                      '',
                      '総合判定: ' + data.prediction.action + ' (スコア: ' + data.prediction.score + '点)'
                    ]
                  }
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                displayColors: true
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: '株価 (USD)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: '日付'
                }
              }
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
        
        // GPT-5価格予測チャート（GPT-5最終判断がある場合のみ）
        if (data.prediction.gpt5_final_judgment && data.prediction.gpt5_final_judgment.price_predictions) {
          const gpt5PriceCtx = document.getElementById('gpt5PricePredictionChart')
          if (gpt5PriceCtx) {
            const predictions = data.prediction.gpt5_final_judgment.price_predictions
            
            new Chart(gpt5PriceCtx.getContext('2d'), {
              type: 'line',
              data: {
                labels: ['現在', '3日後', '7日後', '14日後', '30日後', '60日後', '90日後'],
                datasets: [{
                  label: 'GPT-5予測価格',
                  data: [
                    data.current_price,
                    predictions.short_term.day_3.price,
                    predictions.short_term.day_7.price,
                    predictions.short_term.day_14.price,
                    predictions.mid_term.day_30.price,
                    predictions.mid_term.day_60.price,
                    predictions.mid_term.day_90.price
                  ],
                  borderColor: 'rgb(147, 51, 234)',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                  borderWidth: 3,
                  tension: 0.3,
                  fill: true,
                  pointRadius: 5,
                  pointBackgroundColor: 'rgb(147, 51, 234)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                }, {
                  label: '信頼度エリア（上限）',
                  data: [
                    data.current_price * 1.05,
                    predictions.short_term.day_3.price * (1 + (100 - predictions.short_term.day_3.confidence) / 200),
                    predictions.short_term.day_7.price * (1 + (100 - predictions.short_term.day_7.confidence) / 200),
                    predictions.short_term.day_14.price * (1 + (100 - predictions.short_term.day_14.confidence) / 200),
                    predictions.mid_term.day_30.price * (1 + (100 - predictions.mid_term.day_30.confidence) / 200),
                    predictions.mid_term.day_60.price * (1 + (100 - predictions.mid_term.day_60.confidence) / 200),
                    predictions.mid_term.day_90.price * (1 + (100 - predictions.mid_term.day_90.confidence) / 200)
                  ],
                  borderColor: 'rgba(147, 51, 234, 0.2)',
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderDash: [5, 5],
                  tension: 0.3,
                  fill: false,
                  pointRadius: 0
                }, {
                  label: '信頼度エリア（下限）',
                  data: [
                    data.current_price * 0.95,
                    predictions.short_term.day_3.price * (1 - (100 - predictions.short_term.day_3.confidence) / 200),
                    predictions.short_term.day_7.price * (1 - (100 - predictions.short_term.day_7.confidence) / 200),
                    predictions.short_term.day_14.price * (1 - (100 - predictions.short_term.day_14.confidence) / 200),
                    predictions.mid_term.day_30.price * (1 - (100 - predictions.mid_term.day_30.confidence) / 200),
                    predictions.mid_term.day_60.price * (1 - (100 - predictions.mid_term.day_60.confidence) / 200),
                    predictions.mid_term.day_90.price * (1 - (100 - predictions.mid_term.day_90.confidence) / 200)
                  ],
                  borderColor: 'rgba(147, 51, 234, 0.2)',
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderDash: [5, 5],
                  tension: 0.3,
                  fill: '-1',
                  pointRadius: 0
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.datasetIndex === 0) {
                          const idx = context.dataIndex
                          const confidences = [
                            100,
                            predictions.short_term.day_3.confidence,
                            predictions.short_term.day_7.confidence,
                            predictions.short_term.day_14.confidence,
                            predictions.mid_term.day_30.confidence,
                            predictions.mid_term.day_60.confidence,
                            predictions.mid_term.day_90.confidence
                          ]
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2) + ' (信頼度: ' + confidences[idx] + '%)'
                        }
                        return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: '予測価格 (USD)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: '期間'
                    }
                  }
                }
              }
            })
          }
        }
        
        // GPT-5シナリオ分析チャート（GPT-5最終判断がある場合のみ）
        if (data.prediction.gpt5_final_judgment && data.prediction.gpt5_final_judgment.scenario_analysis) {
          const scenarioCtx = document.getElementById('scenarioAnalysisChart')
          if (scenarioCtx) {
            const scenarios = data.prediction.gpt5_final_judgment.scenario_analysis
            
            new Chart(scenarioCtx.getContext('2d'), {
              type: 'bar',
              data: {
                labels: ['ワーストケース', 'ベースケース', 'ベストケース'],
                datasets: [{
                  label: '予想価格',
                  data: [
                    scenarios.worst_case.price_target,
                    scenarios.base_case.price_target,
                    scenarios.best_case.price_target
                  ],
                  backgroundColor: [
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(34, 197, 94, 0.6)'
                  ],
                  borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)'
                  ],
                  borderWidth: 2
                }, {
                  label: '発生確率 (%)',
                  data: [
                    scenarios.worst_case.probability,
                    scenarios.base_case.probability,
                    scenarios.best_case.probability
                  ],
                  backgroundColor: [
                    'rgba(239, 68, 68, 0.3)',
                    'rgba(59, 130, 246, 0.3)',
                    'rgba(34, 197, 94, 0.3)'
                  ],
                  borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)'
                  ],
                  borderWidth: 2,
                  borderDash: [5, 5],
                  yAxisID: 'y1'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.datasetIndex === 0) {
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                        } else {
                          return context.dataset.label + ': ' + context.parsed.y + '%'
                        }
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: '予想価格 (USD)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: '発生確率 (%)'
                    },
                    grid: {
                      drawOnChartArea: false
                    }
                  }
                }
              }
            })
          }
        }
        
        // GPT-5モンテカルロシミュレーションチャート（結果がある場合のみ）
        if (data.prediction.gpt5_final_judgment && data.prediction.gpt5_final_judgment.monte_carlo_results) {
          const mcCtx = document.getElementById('monteCarloChart')
          if (mcCtx) {
            const mc = data.prediction.gpt5_final_judgment.monte_carlo_results
            
            new Chart(mcCtx.getContext('2d'), {
              type: 'line',
              data: {
                labels: ['現在', '3日', '7日', '14日', '30日', '60日', '90日'],
                datasets: [{
                  label: '中央値',
                  data: [
                    data.current_price,
                    mc.day_3_median || mc.day_3,
                    mc.day_7_median || mc.day_7,
                    mc.day_14_median || mc.day_14,
                    mc.day_30_median || mc.day_30,
                    mc.day_60_median || mc.day_60,
                    mc.day_90_median
                  ],
                  borderColor: 'rgb(255, 255, 255)',
                  backgroundColor: 'transparent',
                  borderWidth: 3,
                  tension: 0.3,
                  pointRadius: 5,
                  pointBackgroundColor: 'rgb(255, 255, 255)'
                }, {
                  label: '95%信頼区間上限',
                  data: [
                    data.current_price * 1.05,
                    mc.day_3_upper || (mc.day_3 * 1.1),
                    mc.day_7_upper || (mc.day_7 * 1.1),
                    mc.day_14_upper || (mc.day_14 * 1.1),
                    mc.day_30_upper || (mc.day_30 * 1.1),
                    mc.day_60_upper || (mc.day_60 * 1.1),
                    mc.day_90_upper
                  ],
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  tension: 0.3,
                  pointRadius: 0
                }, {
                  label: '95%信頼区間下限',
                  data: [
                    data.current_price * 0.95,
                    mc.day_3_lower || (mc.day_3 * 0.9),
                    mc.day_7_lower || (mc.day_7 * 0.9),
                    mc.day_14_lower || (mc.day_14 * 0.9),
                    mc.day_30_lower || (mc.day_30 * 0.9),
                    mc.day_60_lower || (mc.day_60 * 0.9),
                    mc.day_90_lower
                  ],
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  tension: 0.3,
                  fill: '-1',
                  pointRadius: 0
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      color: '#fff'
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    ticks: {
                      color: '#fff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                      display: true,
                      text: '価格 (USD)',
                      color: '#fff'
                    }
                  },
                  x: {
                    ticks: {
                      color: '#fff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                      display: true,
                      text: '期間',
                      color: '#fff'
                    }
                  }
                }
              }
            })
          }
        }
        
        // ML予測: 特徴量重要度チャート（ML APIからデータがある場合のみ）
        if (data.prediction.ml_prediction && data.prediction.ml_prediction.feature_importances) {
          const featureCtx = document.getElementById('featureImportanceChart').getContext('2d')
          const features = data.prediction.ml_prediction.feature_importances.slice(0, 10)
          
          new Chart(featureCtx, {
            type: 'bar',
            data: {
              labels: features.map(f => f.feature),
              datasets: [{
                label: '重要度',
                data: features.map(f => f.importance * 100),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return '重要度: ' + context.parsed.x.toFixed(1) + '%'
                    }
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: '重要度 (%)' }
                }
              }
            }
          })
        }
        
        // 学習曲線チャート（学習が実行された場合のみ）
        if (data.prediction.ml_training) {
          console.log('✅ ml_training exists, rendering learning curves...')
          const learningCurveElement = document.getElementById('learningCurveChart')
          if (!learningCurveElement) {
            console.error('❌ ERROR: learningCurveChart element not found in DOM!')
            console.log('Available elements:', document.querySelectorAll('canvas').length, 'canvas elements')
          } else {
            console.log('✅ learningCurveChart element found')
          }
          const learningCurveCtx = learningCurveElement.getContext('2d')
          const trainingData = data.prediction.ml_training
          
          new Chart(learningCurveCtx, {
            type: 'line',
            data: {
              labels: trainingData.learning_curves.iterations,
              datasets: [
                {
                  label: 'Train Loss (RMSE)',
                  data: trainingData.learning_curves.train_loss,
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                  pointRadius: 0
                },
                {
                  label: 'Validation Loss (RMSE)',
                  data: trainingData.learning_curves.val_loss,
                  borderColor: 'rgb(239, 68, 68)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                  pointRadius: 0
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  title: {
                    display: true,
                    text: 'RMSE Loss (USD)'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Iteration'
                  }
                }
              }
            }
          })

          // 特徴量重要度チャート（学習結果用）
          const featureImportanceTrainingCtx = document.getElementById('featureImportanceTrainingChart').getContext('2d')
          const topFeatures = trainingData.feature_importances.slice(0, 10)
          
          // 最大重要度で正規化
          const maxImportance = Math.max(...topFeatures.map(f => f.importance))
          
          new Chart(featureImportanceTrainingCtx, {
            type: 'bar',
            data: {
              labels: topFeatures.map(f => f.feature),
              datasets: [{
                label: 'Importance (Gain)',
                data: topFeatures.map(f => (f.importance / maxImportance) * 100),
                backgroundColor: 'rgba(147, 51, 234, 0.6)',
                borderColor: 'rgb(147, 51, 234)',
                borderWidth: 1
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const actualImportance = topFeatures[context.dataIndex].importance
                      return 'Gain: ' + actualImportance.toFixed(0) + ' (' + context.parsed.x.toFixed(1) + '%)'
                    }
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: '相対重要度 (%)' }
                }
              }
            }
          })
          
          // ML未来予測チャート（過去30日 + 未来30日）
          console.log('🔍 Checking future predictions:', {
            has_future_predictions: !!trainingData.future_predictions,
            has_backfit: !!data.prediction.backfit,
            future_data: trainingData.future_predictions
          })
          
          if (trainingData.future_predictions) {
            console.log('✅ Rendering ML future price chart')
            const mlFuturePriceElement = document.getElementById('mlFuturePriceChart')
            if (!mlFuturePriceElement) {
              console.error('❌ ERROR: mlFuturePriceChart element not found in DOM!')
              console.log('Searching for element...')
              const allCanvases = document.querySelectorAll('canvas')
              console.log('Found', allCanvases.length, 'canvas elements:', Array.from(allCanvases).map(c => c.id))
            } else {
              console.log('✅ mlFuturePriceChart element found')
            }
            
            try {
              const mlFuturePriceCtx = mlFuturePriceElement.getContext('2d')
              const futurePred = trainingData.future_predictions
            
            // 過去30日のデータ（予測の backfit から）
            const historicalDates = data.prediction.backfit ? data.prediction.backfit.dates.slice(-30) : []
            const historicalPrices = data.prediction.backfit ? data.prediction.backfit.actualPrices.slice(-30) : []
            
            console.log('ML future chart data:', {
              historicalDates: historicalDates.length,
              historicalPrices: historicalPrices.length,
              futureDates: futurePred.dates.length,
              futurePredictions: futurePred.predictions.length
            })
            
            // 全体のラベル: 過去30日 + 未来30日
            const allLabels = [...historicalDates, ...futurePred.dates]
            
            // 過去データ: 実データを表示（未来部分にも最後の値を1つ追加して接続）
            const historicalData = [...historicalPrices, ...Array(futurePred.predictions.length).fill(null)]
            
            // 未来予測データ: 最初に過去の最後の値を追加してスムーズに接続
            const futureData = [
              ...Array(historicalPrices.length - 1).fill(null),
              historicalPrices[historicalPrices.length - 1],  // 接続点
              ...futurePred.predictions
            ]
            
            // 信頼区間（接続点を追加）
            const lastPrice = historicalPrices[historicalPrices.length - 1]
            const lowerBoundData = [
              ...Array(historicalPrices.length - 1).fill(null),
              lastPrice * 0.95,  // 接続点
              ...futurePred.lower_bound
            ]
            const upperBoundData = [
              ...Array(historicalPrices.length - 1).fill(null),
              lastPrice * 1.05,  // 接続点
              ...futurePred.upper_bound
            ]
            
            new Chart(mlFuturePriceCtx, {
              type: 'line',
              data: {
                labels: allLabels,
                datasets: [
                  {
                    label: '実績価格（過去30日）',
                    data: historicalData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 2,
                    pointHoverRadius: 5
                  },
                  {
                    label: 'ML予測価格（未来30日）',
                    data: futureData,
                    borderColor: 'rgb(251, 146, 60)',
                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderDash: [5, 5]
                  },
                  {
                    label: '信頼区間上限（+5%）',
                    data: upperBoundData,
                    borderColor: 'rgba(156, 163, 175, 0.3)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 1,
                    tension: 0.3,
                    fill: '+1',
                    pointRadius: 0
                  },
                  {
                    label: '信頼区間下限（-5%）',
                    data: lowerBoundData,
                    borderColor: 'rgba(156, 163, 175, 0.3)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 1,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 0
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.parsed.y !== null) {
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                        }
                        return null
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: '株価 (USD)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: '日付'
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      callback: function(value, index) {
                        // 5日ごとにラベル表示
                        return index % 5 === 0 ? this.getLabelForValue(value) : ''
                      }
                    }
                  }
                }
              }
            })
            
            console.log('✅ ML future price chart created successfully')
            } catch (error) {
              console.error('❌ ERROR creating ML future price chart:', error)
            }
          }
          
          // ML バックフィットチャート（過去30日の予測精度検証）
          if (trainingData.backfit_predictions) {
            console.log('✅ Rendering ML backfit chart')
            const mlBackfitElement = document.getElementById('mlBackfitChart')
            if (mlBackfitElement) {
              const mlBackfitCtx = mlBackfitElement.getContext('2d')
              const backfitData = trainingData.backfit_predictions
              
              new Chart(mlBackfitCtx, {
                type: 'line',
                data: {
                  labels: backfitData.dates,
                  datasets: [
                    {
                      label: '実際の価格',
                      data: backfitData.actual_prices,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 3,
                      tension: 0.3,
                      fill: false,
                      pointRadius: 3,
                      pointHoverRadius: 6
                    },
                    {
                      label: 'ML予測価格',
                      data: backfitData.predictions,
                      borderColor: 'rgb(251, 146, 60)',
                      backgroundColor: 'rgba(251, 146, 60, 0.1)',
                      borderWidth: 3,
                      tension: 0.3,
                      fill: false,
                      pointRadius: 3,
                      pointHoverRadius: 6,
                      borderDash: [5, 5]
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      title: {
                        display: true,
                        text: '株価 (USD)'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: '日付'
                      },
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        callback: function(value, index) {
                          return index % 5 === 0 ? this.getLabelForValue(value) : ''
                        }
                      }
                    }
                  }
                }
              })
              
              console.log('✅ ML backfit chart created successfully')
            }
          }
        }

        // ML予測: 予測比較チャート
        console.log('🔍 Checking ML prediction data:', {
          has_ml_prediction: !!data.prediction.ml_prediction,
          ml_data: data.prediction.ml_prediction
        })
        
        if (data.prediction.ml_prediction) {
          console.log('✅ Rendering prediction comparison chart')
          const comparisonElement = document.getElementById('predictionComparisonChart')
          if (!comparisonElement) {
            console.error('❌ ERROR: predictionComparisonChart element not found in DOM!')
          } else {
            console.log('✅ predictionComparisonChart element found')
          }
          
          try {
            const comparisonCtx = comparisonElement.getContext('2d')
            
            // 統計予測の方向性（BUY=上昇、SELL=下降、HOLD=横ばい）
            const statDirection = data.prediction.action
            const statPredictedPrice = statDirection === 'BUY' 
              ? data.current_price * 1.05 
              : statDirection === 'SELL' 
              ? data.current_price * 0.95 
              : data.current_price
            
            console.log('Creating comparison chart with data:', {
              currentPrice: data.current_price,
              statPredictedPrice,
              mlPredictedPrice: data.prediction.ml_prediction.predicted_price
            })
            
            new Chart(comparisonCtx, {
            type: 'bar',
            data: {
              labels: ['現在価格', '統計予測', 'ML予測'],
              datasets: [{
                label: '価格 (USD)',
                data: [
                  data.current_price,
                  statPredictedPrice,
                  data.prediction.ml_prediction.predicted_price
                ],
                backgroundColor: [
                  'rgba(156, 163, 175, 0.6)',
                  'rgba(59, 130, 246, 0.6)',
                  'rgba(34, 197, 94, 0.6)'
                ],
                borderColor: [
                  'rgb(156, 163, 175)',
                  'rgb(59, 130, 246)',
                  'rgb(34, 197, 94)'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return '$' + context.parsed.y.toFixed(2)
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  title: { display: true, text: '価格 (USD)' }
                }
              }
            }
          })
          
          console.log('✅ Prediction comparison chart created successfully')
          } catch (error) {
            console.error('❌ ERROR creating prediction comparison chart:', error)
          }
        }

        // スコアカードにイベントリスナーを追加(DOM完全レンダリング後に実行)
        setTimeout(() => {
          const cards = [
            { id: 'card-technical', dimension: 'technical' },
            { id: 'card-fundamental', dimension: 'fundamental' },
            { id: 'card-sentiment', dimension: 'sentiment' },
            { id: 'card-macro', dimension: 'macro' },
            { id: 'card-analyst', dimension: 'analyst' }
          ]
          
          console.log('=== Attaching event listeners ===')
          cards.forEach(card => {
            const element = document.getElementById(card.id)
            if (element) {
              element.addEventListener('click', () => {
                console.log('Card clicked:', card.dimension)
                window.showDetailModal(card.dimension)
              })
              console.log('✓ Event listener added for:', card.id)
            } else {
              console.error('✗ Element not found:', card.id)
            }
          })
          console.log('=== Event listeners attached ===')
        }, 100)

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
                  <th class="px-6 py-3 text-center">信頼度</th>
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
                      <span class="px-3 py-1 rounded-full text-xs font-bold \${rec.confidence >= 70 ? 'bg-green-100 text-green-800' : rec.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                        \${rec.confidence}%
                      </span>
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

    // ===== ランキング機能 =====
    
    // ランキング読み込み
    async function loadRanking(type) {
      // すべてのランキングボタンをリセット
      document.querySelectorAll('#rankings-tab button').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white')
        btn.classList.add('bg-white', 'text-gray-700')
      })
      
      // 期間選択の表示/非表示
      const timeframeSelector = document.getElementById('timeframe-selector')
      if (type === 'high-growth') {
        timeframeSelector.style.display = 'block'
      } else {
        timeframeSelector.style.display = 'none'
      }
      
      // ローディング表示
      const welcomeDiv = document.getElementById('rankings-welcome')
      if (welcomeDiv) welcomeDiv.style.display = 'none'
      document.getElementById('rankings-loading').style.display = 'block'
      document.getElementById('rankings-result').style.display = 'none'
      
      // ローディングメッセージをランキングタイプに応じて変更
      const loadingMessages = {
        'recommended': 'おすすめTOP10を計算中... 統計モデルで5銘柄を分析しています（約20-30秒）',
        'high-growth': '高成長×信頼度ランキングを計算中... GPT-5-mini分析を実行中（約1-2分）',
        'short-term': '短期トレードランキングを計算中... テクニカル指標を分析しています（約20-30秒）',
        'trending': '注目株ランキングを計算中... ニュース・センチメントを分析しています（約30-60秒）'
      }
      
      document.querySelector('#rankings-loading p').textContent = loadingMessages[type] || 'ランキング計算中...'
      
      let isProcessing = false
      
      try {
        let endpoint = ''
        let requestBody = {}
        
        switch(type) {
          case 'recommended':
            endpoint = '/api/rankings/recommended'
            break
          case 'high-growth':
            endpoint = '/api/rankings/high-growth'
            requestBody = { timeframe: document.getElementById('ranking-timeframe').value }
            break
          case 'short-term':
            endpoint = '/api/rankings/short-term'
            break
          case 'trending':
            endpoint = '/api/rankings/trending'
            break
        }
        
        const response = await axios.post(endpoint, requestBody)
        
        // 202 Accepted（処理中）の場合
        if (response.status === 202) {
          isProcessing = true
          const data = response.data
          document.querySelector('#rankings-loading p').textContent = 
            data.message + ' 自動的に再試行します...'
          
          // retryAfter秒後に自動再試行
          setTimeout(() => {
            console.log('Retrying ranking request...')
            loadRanking(type)
          }, (data.retryAfter || 10) * 1000)
          return
        }
        
        // 200 OK（成功）の場合
        const data = response.data
        
        // 結果を表示
        displayRankingResults(type, data)
        
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message
        document.getElementById('rankings-result').innerHTML = \`
          <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <p class="text-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              エラーが発生しました: \${errorMsg}
            </p>
          </div>
        \`
        document.getElementById('rankings-result').style.display = 'block'
      } finally {
        // 202（処理中）の場合はローディングを残す
        if (!isProcessing) {
          document.getElementById('rankings-loading').style.display = 'none'
        }
      }
    }
    
    // ランキング結果表示
    function displayRankingResults(type, data) {
      const resultsDiv = document.getElementById('rankings-result')
      
      const typeLabels = {
        'recommended': 'おすすめTOP10',
        'high-growth': '高成長×信頼度',
        'short-term': '短期トレード',
        'trending': '注目株'
      }
      
      let html = \`
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold">
              <i class="fas fa-trophy mr-2 text-yellow-600"></i>
              \${typeLabels[type]}ランキング
            </h3>
            <div class="text-sm text-gray-600">
              <i class="fas fa-clock mr-1"></i>
              更新: \${new Date(data.metadata.timestamp).toLocaleString('ja-JP')}
              \${data.metadata.cacheHit ? '<span class="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">キャッシュ</span>' : ''}
            </div>
          </div>
          
          <div class="mb-4 text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1"></i>
            分析銘柄数: \${data.metadata.totalScanned}銘柄 | 
            実行時間: \${(data.metadata.executionTime / 1000).toFixed(1)}秒
          </div>
      \`
      
      // ランキングタイプごとに異なる表示
      if (type === 'recommended') {
        html += displayRecommendedRanking(data.rankings)
      } else if (type === 'high-growth') {
        html += displayHighGrowthRanking(data.rankings)
      } else if (type === 'short-term') {
        html += displayShortTermRanking(data.rankings)
      } else if (type === 'trending') {
        html += displayTrendingRanking(data.rankings)
      }
      
      html += '</div>'
      
      resultsDiv.innerHTML = html
      resultsDiv.style.display = 'block'
    }
    
    // おすすめTOP10表示
    function displayRecommendedRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-blue-50 to-purple-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">テクニカル</th>
                <th class="px-4 py-3 text-right font-semibold">ファンダメンタル</th>
                <th class="px-4 py-3 text-right font-semibold">センチメント</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-center font-semibold">判定</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-blue-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right text-blue-600 font-semibold">\${rank.technicalScore}</td>
                  <td class="px-4 py-4 text-right text-green-600 font-semibold">\${rank.fundamentalScore}</td>
                  <td class="px-4 py-4 text-right text-yellow-600 font-semibold">\${rank.sentimentScore}</td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-sm font-bold \${rank.action === 'BUY' ? 'bg-green-100 text-green-800' : rank.action === 'SELL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                      \${rank.action}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // 高成長×信頼度ランキング表示
    function displayHighGrowthRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-green-50 to-blue-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-right font-semibold">予測価格</th>
                <th class="px-4 py-3 text-right font-semibold">予測上昇率</th>
                <th class="px-4 py-3 text-right font-semibold">信頼度</th>
                <th class="px-4 py-3 text-right font-semibold">期間</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-green-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right font-semibold text-blue-600">$\${rank.predictedPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-xl font-bold text-green-600">+\${rank.predictedGain.toFixed(1)}%</span>
                  </td>
                  <td class="px-4 py-4 text-right">
                    <span class="font-semibold text-purple-600">\${rank.confidence}%</span>
                  </td>
                  <td class="px-4 py-4 text-right text-gray-600">\${rank.timeframe}</td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // 短期トレードランキング表示
    function displayShortTermRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-yellow-50 to-orange-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-right font-semibold">テクニカルシグナル</th>
                <th class="px-4 py-3 text-right font-semibold">ボラティリティ</th>
                <th class="px-4 py-3 text-right font-semibold">モメンタム</th>
                <th class="px-4 py-3 text-center font-semibold">エントリー</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-orange-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right font-semibold text-blue-600">\${rank.technicalSignal}</td>
                  <td class="px-4 py-4 text-right text-purple-600">\${rank.volatility.toFixed(1)}%</td>
                  <td class="px-4 py-4 text-right text-green-600">\${rank.momentum.toFixed(1)}</td>
                  <td class="px-4 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-sm font-bold \${rank.entryTiming === 'NOW' ? 'bg-green-100 text-green-800' : rank.entryTiming === 'WAIT' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                      \${rank.entryTiming}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // 注目株ランキング表示
    function displayTrendingRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-red-50 to-pink-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-right font-semibold">ニュース</th>
                <th class="px-4 py-3 text-right font-semibold">ソーシャル</th>
                <th class="px-4 py-3 text-right font-semibold">アナリスト</th>
                <th class="px-4 py-3 text-left font-semibold">注目理由</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-red-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right font-semibold text-blue-600">\${rank.newsScore}</td>
                  <td class="px-4 py-4 text-right font-semibold text-purple-600">\${rank.socialScore}</td>
                  <td class="px-4 py-4 text-right font-semibold text-green-600">\${rank.analystScore}</td>
                  <td class="px-4 py-4 text-sm text-gray-700">\${rank.trendReason}</td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // ランキングから詳細分析へ遷移
    function analyzeStockFromRanking(symbol) {
      // 分析タブに切り替え
      switchTab('analysis')
      
      // 銘柄コード入力欄にセット
      document.getElementById('symbol-input').value = symbol
      
      // 1秒後に自動実行（タブ切り替えアニメーション完了を待つ）
      setTimeout(() => {
        analyzeStock()
      }, 300)
    }

    // グローバルに分析データを保存（analyzeStock関数内で設定）
    // let currentAnalysisData = null  // 既にグローバルスコープで宣言済み

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
      
      // Check if rankings welcome screen exists
      const rankingsWelcome = document.getElementById('rankings-welcome')
      const rankingsTab = document.getElementById('rankings-tab')
      console.log('%c Rankings Welcome Screen Check:', 'color: #8b5cf6; font-weight: bold;')
      console.log('  - Rankings Tab exists:', !!rankingsTab)
      console.log('  - Rankings Tab classes:', rankingsTab?.className)
      console.log('  - Welcome element exists:', !!rankingsWelcome)
      if (rankingsWelcome) {
        console.log('  - Welcome display style:', window.getComputedStyle(rankingsWelcome).display)
        console.log('  - Welcome visibility:', window.getComputedStyle(rankingsWelcome).visibility)
      }
      if (rankingsTab) {
        console.log('  - Rankings Tab display style:', window.getComputedStyle(rankingsTab).display)
      }
      
      // Test switchTab function
      console.log('%c Testing switchTab function:', 'color: #f59e0b; font-weight: bold;')
      console.log('  - switchTab function exists:', typeof window.switchTab !== 'undefined')
    })
  </script>
</body>
</html>
  `)
})

export default app
