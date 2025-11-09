/**
 * キャッシュサービス
 * Cloudflare KVを使用した1時間TTLキャッシュ
 */

export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * KVベースのキャッシュ実装
 */
export class KVCacheService implements CacheService {
  constructor(private kv: KVNamespace) {}
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.kv.get(key, 'json')
      if (cached) {
        console.log(`[Cache] Hit: ${key}`)
        return cached as T
      }
      console.log(`[Cache] Miss: ${key}`)
      return null
    } catch (error) {
      console.error(`[Cache] Get error for ${key}:`, error)
      return null
    }
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl
      })
      console.log(`[Cache] Set: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      console.error(`[Cache] Set error for ${key}:`, error)
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key)
      console.log(`[Cache] Delete: ${key}`)
    } catch (error) {
      console.error(`[Cache] Delete error for ${key}:`, error)
    }
  }
}

/**
 * メモリベースのキャッシュ実装（開発環境用）
 */
export class MemoryCacheService implements CacheService {
  private cache: Map<string, { value: any; expiry: number }> = new Map()
  
  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key)
    if (!cached) {
      console.log(`[Cache] Miss: ${key}`)
      return null
    }
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      console.log(`[Cache] Expired: ${key}`)
      return null
    }
    
    console.log(`[Cache] Hit: ${key}`)
    return cached.value as T
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const expiry = Date.now() + ttl * 1000
    this.cache.set(key, { value, expiry })
    console.log(`[Cache] Set: ${key} (TTL: ${ttl}s)`)
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    console.log(`[Cache] Delete: ${key}`)
  }
}

/**
 * キャッシュキー生成
 */
export function getCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return `${prefix}:${sortedParams}`
}
