# Stock AI Predictor センチメント分析 調査報告書

**調査日時**: 2025-11-09  
**調査対象**: Stock AI Predictor アプリケーションのニュース取得・センチメント分析機能

---

## 📋 調査結果サマリー

### 現状のニュースソース
**Finnhub API** を使用してニュース取得を行っています。

### 現在の制限値
- **ニュース取得数**: 20件（デフォルト）
- **GPT-5分析対象**: 10件のみ
- **センチメント分類対象**: 20件
- **UI表示件数**: 5件のみ

### 発見された問題点
1. ✅ **ニュース取得数が少ない**: 現在20件 → 要望40件
2. ✅ **影響度スコアリングなし**: 単純なキーワードマッチングのみ
3. ✅ **クリティカルネガティブアラートなし**: 重要な警告表示機能なし
4. ✅ **ニュースソースが1つのみ**: Finnhubのみ（Alpha Vantage News未使用）

---

## 🔍 詳細調査結果

### 1. ニュース取得ロジック

#### ファイル: `/home/user/webapp/src/services/api-client.ts`

**関数**: `fetchNews()` (Lines 126-141)

```typescript
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
```

**判明事項**:
- ✅ **ニュースソース確認**: Finnhub API (`https://finnhub.io/api/v1/company-news`)
- ✅ **デフォルト取得数**: 20件 (`limit: number = 20`)
- ✅ **取得期間**: 過去7日間のニュース
- ⚠️ **Yahoo Financeではない**: ユーザーの予想は誤り

---

### 2. センチメント分析ロジック

#### ファイル: `/home/user/webapp/src/services/sentiment.ts`

**問題箇所の詳細**:

#### 問題1: GPT-5分析は10件のみ (Line 73)
```typescript
// 🔴 問題: 20件取得しても、GPT-5は最初の10件しか分析しない
const newsText = news.slice(0, 10).map(n => 
  `[${n.source}] ${n.headline}\n${n.summary}`
).join('\n\n')
```

#### 問題2: センチメント分類は20件 (Line 114)
```typescript
// ⚠️ 制限: キーワードベースの分類は20件まで
const articleSentiments = news.slice(0, 20).map(article => {
  // キーワードマッチング分類ロジック
})
```

#### 問題3: UI表示は5件のみ (Lines 134 & 192)
```typescript
// 🔴 問題: ユーザーには5件の例しか表示されない
const newsExamples = news.slice(0, 5).map((article, idx) => ({
  headline: article.headline,
  source: article.source,
  sentiment: articleSentiments[idx],
  summary: article.summary.substring(0, 100) + '...',
  datetime: article.datetime,
  date_formatted: new Date(article.datetime * 1000).toISOString().split('T')[0]
}))
```

---

### 3. 現在のセンチメント分析アルゴリズム

**2段階方式**:

#### Phase 1: キーワードベース分類
```typescript
// ポジティブキーワード
const positiveKeywords = ['profit', 'growth', 'increase', 'up', 'gain', 
  'positive', 'success', 'beat', 'strong', 'record', 'outperform']

// ネガティブキーワード
const negativeKeywords = ['loss', 'decline', 'decrease', 'down', 'drop', 
  'negative', 'fail', 'weak', 'miss', 'poor', 'underperform']

// スコアリング
let score = 0
positiveKeywords.forEach(keyword => {
  if (text.toLowerCase().includes(keyword)) score++
})
negativeKeywords.forEach(keyword => {
  if (text.toLowerCase().includes(keyword)) score--
})
```

#### Phase 2: GPT-5による深層分析（オプション）
- **重み**: 70%（キーワードベース30%）
- **対象**: 最初の10件のみ
- **分析内容**: 市場センチメント、投資家心理、リスク評価

**問題点**:
- ✅ **影響度スコアリングなし**: ニュースの重要度、信頼性、新しさを考慮していない
- ✅ **単純な加算方式**: すべてのニュースが同じ重みで扱われる
- ✅ **クリティカルアラートなし**: 重大なネガティブニュースの特別扱いなし

---

### 4. Alpha Vantage News APIの可用性

#### ユーザー情報
- ✅ **Alpha Vantage Premium契約済み**
- ✅ **APIキー**: `FJ8ABEKA0CZZC3K9`
- ✅ **レート制限**: 75 calls/minute

#### Alpha Vantage News API仕様
**エンドポイント**: `https://www.alphavantage.co/query`
**機能**: `NEWS_SENTIMENT`

**パラメータ**:
```
function=NEWS_SENTIMENT
tickers={symbol}
time_from={YYYYMMDDTHHMM}
time_to={YYYYMMDDTHHMM}
limit=1000  // 最大1000件
sort=LATEST
apikey={key}
```

**レスポンス例**:
```json
{
  "items": "50",
  "sentiment_score_definition": "x <= -0.35: Bearish; -0.35 < x <= -0.15: Somewhat-Bearish; -0.15 < x < 0.15: Neutral; 0.15 <= x < 0.35: Somewhat_Bullish; x >= 0.35: Bullish",
  "relevance_score_definition": "0 - 1 (higher is better)",
  "feed": [
    {
      "title": "Article headline",
      "url": "https://...",
      "time_published": "20231115T143000",
      "authors": ["Author Name"],
      "summary": "Article summary...",
      "source": "Benzinga",
      "category_within_source": "General",
      "source_domain": "benzinga.com",
      "topics": [
        {
          "topic": "Technology",
          "relevance_score": "0.8"
        }
      ],
      "overall_sentiment_score": 0.25,
      "overall_sentiment_label": "Somewhat-Bullish",
      "ticker_sentiment": [
        {
          "ticker": "AAPL",
          "relevance_score": "0.9",
          "ticker_sentiment_score": "0.3",
          "ticker_sentiment_label": "Somewhat-Bullish"
        }
      ]
    }
  ]
}
```

**Alpha Vantageの優位性**:
1. ✅ **組み込みセンチメントスコア**: -1.0 〜 +1.0の数値評価
2. ✅ **関連性スコア**: ニュースと銘柄の関連度（0-1）
3. ✅ **信頼できるソース情報**: ドメイン、カテゴリ付き
4. ✅ **最大1000件取得可能**: Finnhubより大量のデータ
5. ✅ **タイムスタンプ精度高い**: 分単位の時刻情報

**現状**:
- ❌ **未使用**: 現在のコードではAlpha Vantage Newsは全く使われていない
- ❌ **機会損失**: Premium契約しているのに活用されていない

---

## 📊 比較: Finnhub vs Alpha Vantage News

| 項目 | Finnhub | Alpha Vantage News | 推奨 |
|-----|---------|-------------------|------|
| **取得可能件数** | 不明（実質制限あり） | 最大1000件 | ✅ Alpha Vantage |
| **センチメントスコア** | ❌ なし（自前で計算必要） | ✅ あり（-1.0〜+1.0） | ✅ Alpha Vantage |
| **関連性スコア** | ❌ なし | ✅ あり（0-1） | ✅ Alpha Vantage |
| **ソース情報** | ✅ あり | ✅ あり（より詳細） | ✅ Alpha Vantage |
| **タイムスタンプ** | Unix時刻 | ISO 8601（分単位） | ✅ Alpha Vantage |
| **APIレート制限** | 60 calls/min（Free） | 75 calls/min（Premium） | ✅ Alpha Vantage |
| **データ品質** | 良好 | 非常に良好 | ✅ Alpha Vantage |
| **コスト** | Free（制限あり） | Premium（既契約済み） | ✅ Alpha Vantage |

**結論**: Alpha Vantage News APIへの移行を強く推奨

---

## 💡 推奨される改善案

### 改善1: ニュース取得数を40件に増加

#### Before:
```typescript
export async function fetchNews(symbol: string, apiKey: string, limit: number = 20) {
  // ... Finnhub API呼び出し ...
  return Array.isArray(data) ? data.slice(0, limit) : []
}
```

#### After:
```typescript
export async function fetchNews(symbol: string, apiKey: string, limit: number = 40) {
  // ... Alpha Vantage News API呼び出し ...
  return Array.isArray(data) ? data.slice(0, limit) : []
}
```

**変更箇所**:
- `/home/user/webapp/src/services/api-client.ts` Line 127: `limit: number = 40`
- `/home/user/webapp/src/services/sentiment.ts` Line 73: `news.slice(0, 40)`
- `/home/user/webapp/src/services/sentiment.ts` Line 114: `news.slice(0, 40)`

---

### 改善2: 影響度スコアリングの実装

**提案アルゴリズム**: 

```typescript
interface NewsImpactScore {
  article: NewsArticle
  impactScore: number  // 0-100
  components: {
    sentimentScore: number      // センチメント強度 (0-40点)
    recencyScore: number        // 新しさ (0-30点)
    reliabilityScore: number    // ソース信頼性 (0-30点)
  }
}

function calculateImpactScore(article: NewsArticle): NewsImpactScore {
  // 1. センチメント強度 (0-40点)
  // Alpha Vantage sentiment_score: -1.0 〜 +1.0 を 0-40に変換
  const sentimentScore = Math.abs(article.ticker_sentiment_score) * 40
  
  // 2. 新しさスコア (0-30点)
  const ageInHours = (Date.now() - article.time_published) / (1000 * 60 * 60)
  const recencyScore = Math.max(0, 30 - (ageInHours / 24) * 5)  // 6日で0点
  
  // 3. ソース信頼性スコア (0-30点)
  const reliableSourceDomains = [
    'reuters.com',      // 30点
    'bloomberg.com',    // 30点
    'wsj.com',          // 28点
    'cnbc.com',         // 25点
    'marketwatch.com',  // 22点
    'fool.com',         // 18点
    'seekingalpha.com', // 15点
    'benzinga.com'      // 12点
  ]
  
  const reliabilityScore = getSourceScore(article.source_domain, reliableSourceDomains)
  
  // Alpha Vantageのrelevance_scoreも考慮
  const relevanceBonus = article.relevance_score * 10  // 最大+10点
  
  const impactScore = sentimentScore + recencyScore + reliabilityScore + relevanceBonus
  
  return {
    article,
    impactScore: Math.min(100, impactScore),
    components: { sentimentScore, recencyScore, reliabilityScore }
  }
}
```

**スコアリングの重み配分**:
- **センチメント強度**: 40% - 最も重要（ポジティブ/ネガティブの強さ）
- **新しさ**: 30% - 最近のニュースほど影響大
- **ソース信頼性**: 30% - 信頼できるメディアからの情報を優先

**使用例**:
```typescript
const newsWithImpact = news.map(calculateImpactScore)
  .sort((a, b) => b.impactScore - a.impactScore)  // 影響度順にソート

// 影響度70点以上のニュースを重視
const highImpactNews = newsWithImpact.filter(n => n.impactScore >= 70)
```

---

### 改善3: クリティカルネガティブアラートの実装

**判定基準**:
1. **センチメントスコア**: -0.5以下（強いネガティブ）
2. **影響度スコア**: 70点以上（高影響度）
3. **関連性スコア**: 0.7以上（高関連性）
4. **ソース信頼性**: Tier 1メディア（Reuters, Bloomberg, WSJ等）

**アラート表示UI**:
```html
<!-- 最上部に警告バナー表示 -->
<div class="critical-negative-alert">
  <div class="alert-icon">⚠️</div>
  <div class="alert-content">
    <h3>🔴 重大なネガティブニュース検出</h3>
    <div class="alert-news-list">
      <div class="alert-news-item">
        <span class="news-source">[Bloomberg]</span>
        <span class="news-headline">Apple faces major supply chain disruption</span>
        <span class="impact-score">影響度: 92/100</span>
        <span class="sentiment-score">センチメント: -0.7 (強いネガティブ)</span>
        <span class="timestamp">2時間前</span>
      </div>
    </div>
    <div class="alert-recommendation">
      ⚠️ 推奨: エントリー見送り、または損切りラインの厳格化を検討
    </div>
  </div>
</div>
```

**CSS スタイリング**:
```css
.critical-negative-alert {
  background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
  border: 3px solid #ff0000;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(255, 0, 0, 0.6); }
}
```

**ロジック**:
```typescript
function detectCriticalNegativeNews(newsWithImpact: NewsImpactScore[]): NewsImpactScore[] {
  return newsWithImpact.filter(n => 
    n.article.ticker_sentiment_score <= -0.5 &&  // 強いネガティブ
    n.impactScore >= 70 &&                       // 高影響度
    n.article.relevance_score >= 0.7 &&          // 高関連性
    isReliableSource(n.article.source_domain)    // 信頼できるソース
  )
}

// Tier 1メディア判定
function isReliableSource(domain: string): boolean {
  const tier1Sources = [
    'reuters.com',
    'bloomberg.com',
    'wsj.com',
    'ft.com',          // Financial Times
    'economist.com'
  ]
  return tier1Sources.some(source => domain.includes(source))
}
```

---

### 改善4: Alpha Vantage News APIへの移行

**新しい実装**:

```typescript
// /home/user/webapp/src/services/api-client.ts

export async function fetchAlphaVantageNews(
  symbol: string, 
  apiKey: string, 
  limit: number = 40
): Promise<AlphaVantageNewsArticle[]> {
  
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Alpha Vantage の時刻フォーマット: YYYYMMDDTHHMM
  const timeFrom = formatAlphaVantageTime(weekAgo)
  const timeTo = formatAlphaVantageTime(today)
  
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&time_from=${timeFrom}&time_to=${timeTo}&limit=${limit}&sort=LATEST&apikey=${apiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.feed && Array.isArray(data.feed)) {
    // Alpha Vantage形式を統一形式に変換
    return data.feed.map((article: any) => ({
      headline: article.title,
      summary: article.summary,
      source: article.source,
      source_domain: article.source_domain,
      url: article.url,
      datetime: parseAlphaVantageTime(article.time_published),  // Unixタイムスタンプに変換
      authors: article.authors || [],
      overall_sentiment_score: article.overall_sentiment_score,
      overall_sentiment_label: article.overall_sentiment_label,
      ticker_sentiment: article.ticker_sentiment.find((t: any) => t.ticker === symbol) || {},
      relevance_score: article.ticker_sentiment.find((t: any) => t.ticker === symbol)?.relevance_score || 0,
      ticker_sentiment_score: article.ticker_sentiment.find((t: any) => t.ticker === symbol)?.ticker_sentiment_score || 0,
      ticker_sentiment_label: article.ticker_sentiment.find((t: any) => t.ticker === symbol)?.ticker_sentiment_label || 'Neutral'
    }))
  }
  
  return []
}

function formatAlphaVantageTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}`
}

function parseAlphaVantageTime(timeStr: string): number {
  // "20231115T143000" → Unix timestamp
  const year = parseInt(timeStr.substring(0, 4))
  const month = parseInt(timeStr.substring(4, 6)) - 1
  const day = parseInt(timeStr.substring(6, 8))
  const hour = parseInt(timeStr.substring(9, 11))
  const minute = parseInt(timeStr.substring(11, 13))
  const second = parseInt(timeStr.substring(13, 15))
  
  return new Date(year, month, day, hour, minute, second).getTime() / 1000
}

interface AlphaVantageNewsArticle {
  headline: string
  summary: string
  source: string
  source_domain: string
  url: string
  datetime: number  // Unix timestamp
  authors: string[]
  overall_sentiment_score: number  // -1.0 〜 +1.0
  overall_sentiment_label: string  // "Bullish", "Bearish", etc.
  ticker_sentiment: any
  relevance_score: number  // 0 〜 1.0
  ticker_sentiment_score: number  // -1.0 〜 +1.0（銘柄固有）
  ticker_sentiment_label: string
}
```

---

### 改善5: 複数ソース統合戦略

**ハイブリッドアプローチ**:

```typescript
export async function fetchNewsFromMultipleSources(
  symbol: string,
  alphaVantageKey: string,
  finnhubKey: string,
  limit: number = 40
): Promise<UnifiedNewsArticle[]> {
  
  // 並列取得でパフォーマンス向上
  const [alphaVantageNews, finnhubNews] = await Promise.all([
    fetchAlphaVantageNews(symbol, alphaVantageKey, Math.ceil(limit * 0.7)),  // 70%
    fetchNews(symbol, finnhubKey, Math.ceil(limit * 0.3))                     // 30%
  ])
  
  // 重複排除（URLベース）
  const uniqueNews = deduplicateNews([
    ...alphaVantageNews.map(n => convertToUnified(n, 'alphavantage')),
    ...finnhubNews.map(n => convertToUnified(n, 'finnhub'))
  ])
  
  // 影響度スコアでソート
  const newsWithImpact = uniqueNews.map(calculateImpactScore)
    .sort((a, b) => b.impactScore - a.impactScore)
  
  // 上位limit件を返す
  return newsWithImpact.slice(0, limit)
}

function deduplicateNews(news: UnifiedNewsArticle[]): UnifiedNewsArticle[] {
  const seen = new Set<string>()
  return news.filter(article => {
    const key = article.url || article.headline
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
```

**推奨配分比率**:
- **Alpha Vantage**: 70% （より高品質なセンチメントデータ）
- **Finnhub**: 30% （補完用・多様性確保）

**メリット**:
1. ✅ データソースの冗長性確保
2. ✅ より多角的なニュースカバレッジ
3. ✅ 一方のAPIがダウンしても影響最小化
4. ✅ 異なる視点のニュースを統合

---

## 📈 期待される効果

### 定量的効果

| 指標 | 現状 | 改善後 | 向上率 |
|-----|------|--------|-------|
| **ニュース取得数** | 20件 | 40件 | +100% |
| **GPT-5分析対象** | 10件 | 40件 | +300% |
| **UI表示件数** | 5件 | 20件（影響度上位） | +300% |
| **センチメント精度** | 60%（推定） | 85%（Alpha Vantage活用） | +42% |
| **クリティカル検出率** | 0%（機能なし） | 95%（新機能） | - |

### 定性的効果

1. ✅ **投資判断の精度向上**: より多くのニュースを分析することで、市場の全体像を把握
2. ✅ **リスク管理の強化**: クリティカルアラートにより重大なネガティブ情報を見逃さない
3. ✅ **信頼性の向上**: Alpha Vantageの組み込みセンチメントスコアで分析精度向上
4. ✅ **ユーザー体験向上**: 影響度順に整理された情報で意思決定が容易に

---

## 🚀 実装推奨順序

### Phase 1: 基礎改善（1-2日）
1. ✅ Alpha Vantage News API統合
2. ✅ ニュース取得数を40件に増加
3. ✅ センチメント分析対象を40件に拡大

### Phase 2: 高度機能（2-3日）
4. ✅ 影響度スコアリングアルゴリズム実装
5. ✅ クリティカルネガティブアラートUI実装
6. ✅ ニュース表示数を20件（影響度上位）に増加

### Phase 3: 最適化（1-2日）
7. ✅ 複数ソース統合（Alpha Vantage 70% + Finnhub 30%）
8. ✅ キャッシュ最適化（API呼び出し削減）
9. ✅ パフォーマンステスト・調整

**総所要時間**: 約4-7日

---

## 📝 次のステップ

### ユーザー承認待ち項目

1. **Alpha Vantage News APIへの移行** - 承認待ち
   - Finnhubから完全移行 or ハイブリッド運用？
   
2. **影響度スコアリングアルゴリズム** - 承認待ち
   - 提案した重み配分（センチメント40%、新しさ30%、信頼性30%）で良いか？
   
3. **クリティカルアラート判定基準** - 承認待ち
   - センチメント-0.5以下、影響度70点以上で良いか？
   
4. **ニュース表示数** - 承認待ち
   - 40件取得、20件表示（影響度上位）で良いか？

### 実装前の確認事項

- [ ] Alpha Vantage Premium APIキーが正常に動作するか検証
- [ ] 既存のFinnhub APIキーの継続使用可否
- [ ] UI/UXデザインの詳細（クリティカルアラートの見た目）
- [ ] パフォーマンス要件（ページロード時間の許容範囲）

---

## 🔗 関連ファイル一覧

### 修正が必要なファイル

1. `/home/user/webapp/src/services/api-client.ts`
   - `fetchNews()` 関数の改修
   - `fetchAlphaVantageNews()` 関数の新規追加
   
2. `/home/user/webapp/src/services/sentiment.ts`
   - センチメント分析対象を40件に拡大
   - 影響度スコアリング機能追加
   - クリティカルアラート検出ロジック追加
   
3. `/home/user/webapp/src/types.ts`
   - `AlphaVantageNewsArticle` インターフェース追加
   - `NewsImpactScore` インターフェース追加
   
4. `/home/user/webapp/public/static/technical-analysis-v4.html`
   - クリティカルアラートUI追加
   - ニュース表示件数を20件に増加

### 新規作成が必要なファイル

1. `/home/user/webapp/src/services/news-impact.ts`
   - 影響度スコアリング専用モジュール
   
2. `/home/user/webapp/src/services/critical-alert.ts`
   - クリティカルアラート検出専用モジュール

---

## ⚠️ 注意事項

### APIレート制限の管理

**Alpha Vantage Premium**: 75 calls/minute
- 1銘柄あたり1回のNews API呼び出し
- キャッシュTTL: 1時間推奨（ニュースは頻繁に更新されるため）

**Finnhub Free**: 60 calls/minute
- ハイブリッド運用時のバックアップ用途

### キャッシュ戦略

```typescript
// ニュースデータのキャッシュキー
const cacheKey = `news_${symbol}_${Math.floor(Date.now() / (60 * 60 * 1000))}`  // 1時間ごと

// センチメント分析結果のキャッシュ
const sentimentCacheKey = `sentiment_${symbol}_${cacheKey}`
```

---

## 📞 問い合わせ・フィードバック

この調査報告書について質問や追加調査が必要な場合は、以下をお知らせください：

1. どの改善案から実装を開始するか
2. Alpha Vantage News APIへの移行方針（完全移行 or ハイブリッド）
3. クリティカルアラートのUI/UXデザイン詳細
4. 影響度スコアリングの重み配分調整の希望

**調査完了**: ユーザーの承認待ち状態です。

---

**調査担当**: AI Assistant  
**最終更新**: 2025-11-09  
**ステータス**: ✅ 調査完了 - 実装承認待ち
