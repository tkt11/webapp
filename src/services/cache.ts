/**
 * キャッシング機構
 * 
 * API制限を回避し、レスポンス速度を向上させるための
 * メモリベースのキャッシュシステム
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number  // Time To Live (秒)
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>
  
  constructor() {
    this.cache = new Map()
  }
  
  /**
   * キャッシュに値を保存
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  /**
   * キャッシュから値を取得
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    // TTL確認
    const now = Date.now()
    const age = (now - entry.timestamp) / 1000  // 秒
    
    if (age > entry.ttl) {
      // 期限切れ
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  /**
   * キャッシュをクリア
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    // パターンマッチングでクリア
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
  
  /**
   * キャッシュ統計
   */
  stats(): { size: number, keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
  
  /**
   * 期限切れエントリーのクリーンアップ
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    
    this.cache.forEach((entry, key) => {
      const age = (now - entry.timestamp) / 1000
      if (age > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    })
    
    return cleaned
  }
}

// シングルトンインスタンス
export const cache = new CacheManager()

/**
 * キャッシュTTL設定（秒）
 */
export const CACHE_TTL = {
  // 株価データ
  DAILY_PRICE: 86400,      // 24時間（日次データは1日1回で十分）
  INTRADAY_PRICE: 3600,    // 1時間（5分足データ）
  REALTIME_QUOTE: 300,     // 5分（リアルタイム価格）
  
  // ニュース・センチメント
  NEWS: 21600,             // 6時間
  SOCIAL_SENTIMENT: 7200,  // 2時間
  
  // ファンダメンタル
  FUNDAMENTAL: 604800,     // 7日間（頻繁に変わらない）
  ANALYST_RATING: 86400,   // 24時間
  
  // ランキング結果
  RANKING_RECOMMENDED: 21600,    // 6時間
  RANKING_HIGH_GROWTH: 21600,    // 6時間
  RANKING_SHORT_TERM: 3600,      // 1時間
  RANKING_TRENDING: 7200,        // 2時間
  
  // 軽量分析
  LIGHT_ANALYSIS: 21600,   // 6時間（統計モデルの結果）
  
  // GPT-5分析
  GPT5_ANALYSIS: 21600     // 6時間（コスト削減のため長めに）
}

/**
 * キャッシュキー生成ヘルパー
 */
export function generateCacheKey(prefix: string, ...params: (string | number)[]): string {
  return `${prefix}:${params.join(':')}`
}

/**
 * キャッシュ付きデータ取得ヘルパー
 */
export async function getCachedData<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // キャッシュチェック
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // データ取得
  const data = await fetchFn()
  
  // キャッシュに保存
  cache.set(key, data, ttl)
  
  return data
}

/**
 * 定期的なクリーンアップ（バックグラウンドタスク）
 */
export function startCacheCleanup(intervalSeconds: number = 3600): void {
  setInterval(() => {
    const cleaned = cache.cleanup()
    console.log(`Cache cleanup: removed ${cleaned} expired entries`)
  }, intervalSeconds * 1000)
}
