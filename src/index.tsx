import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './types'
import { KVCacheService, MemoryCacheService, getCacheKey } from './services/cache'
import { fetchAlphaVantageNews } from './services/api-client'
import { performSentimentAnalysis } from './services/sentiment'

const app = new Hono<{ Bindings: Env }>()

// CORS設定
app.use('/api/*', cors())

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Stock AI Predictor API is running' })
})

// プロキシAPI: ML APIへのリクエストを中継（CORS回避）
app.post('/api/proxy/technical-analysis', async (c) => {
  try {
    const body = await c.req.json()
    const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001'
    
    const response = await fetch(`${ML_API_URL}/api/technical-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    return c.json(data)
  } catch (error: any) {
    console.error('[PROXY] Technical analysis error:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/proxy/technical-ml-predict', async (c) => {
  try {
    const body = await c.req.json()
    const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001'
    
    const response = await fetch(`${ML_API_URL}/api/technical-ml-predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    return c.json(data)
  } catch (error: any) {
    console.error('[PROXY] ML prediction error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// System C: ML価格予測プロキシ
app.post('/api/proxy/system-c-predict', async (c) => {
  try {
    const body = await c.req.json()
    const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001'
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5分タイムアウト
    
    try {
      const response = await fetch(`${ML_API_URL}/api/system-c-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ML API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      return c.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('System C prediction timeout (5 minutes)')
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error('[PROXY] System C prediction error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// NASDAQ-100 ランキングプロキシ
app.post('/api/proxy/nasdaq-ranking', async (c) => {
  try {
    const body = await c.req.json()
    const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001'
    
    const response = await fetch(`${ML_API_URL}/api/nasdaq-ranking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    return c.json(data)
  } catch (error: any) {
    console.error('[PROXY] NASDAQ ranking error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// センチメント分析API（キャッシュ付き、Alpha Vantage + GPT-5）
app.post('/api/sentiment-analysis', async (c) => {
  try {
    const { symbol, useGpt5 = false } = await c.req.json()
    
    if (!symbol) {
      return c.json({ error: 'Symbol is required' }, 400)
    }
    
    // キャッシュサービス初期化（KV無効化、メモリキャッシュのみ使用）
    const cache = new MemoryCacheService()
    
    // キャッシュキー生成（1時間TTL）
    const cacheKey = getCacheKey('sentiment', { symbol, useGpt5 })
    
    // キャッシュチェック
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log(`[Sentiment] Cache hit for ${symbol}`)
      return c.json({
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      })
    }
    
    console.log(`[Sentiment] Cache miss for ${symbol}, fetching news...`)
    
    // Alpha Vantage APIキー取得
    const alphaVantageKey = c.env.ALPHA_VANTAGE_API_KEY
    if (!alphaVantageKey) {
      return c.json({ error: 'ALPHA_VANTAGE_API_KEY not configured' }, 500)
    }
    
    // 40件のニュース取得
    const news = await fetchAlphaVantageNews(symbol, alphaVantageKey, 40)
    
    if (!news || news.length === 0) {
      return c.json({
        error: 'No news found',
        symbol,
        news_count: 0
      }, 404)
    }
    
    // センチメント分析実行
    // useGpt5がtrueの場合、GPT-5で4件（ネガティブ上位2件 + ポジティブ上位2件）分析
    const openaiKey = useGpt5 ? c.env.OPENAI_API_KEY : undefined
    const result = await performSentimentAnalysis(news, symbol, openaiKey)
    
    // キャッシュに保存（1時間 = 3600秒）
    await cache.set(cacheKey, result, 3600)
    
    return c.json({
      ...result,
      cached: false,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('[Sentiment] Analysis error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// 静的ファイル配信
app.use('/*', serveStatic({ root: './' }))

// メインページ（フォールバック）
app.get('/', (c) => {
  // index.htmlにリダイレクト
  return c.redirect('/index.html')
})

export default app
