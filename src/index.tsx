import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

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

// メインページ（軽量版）
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stock AI Predictor</title>
  <script>
    // Redirect to static HTML pages
    window.location.href = '/static/nasdaq-ranking.html';
  </script>
</head>
<body>
  <p>Redirecting to NASDAQ-100 Ranking...</p>
</body>
</html>
  `)
})

export default app
