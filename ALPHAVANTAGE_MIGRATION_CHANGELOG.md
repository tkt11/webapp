# Alpha Vantage News API Migration - Changelog

**実装日**: 2025-11-09  
**バージョン**: v2.0.0 (Sentiment Analysis Enhancement)

---

## 📋 変更サマリー

### ✅ 完了した実装

1. **Alpha Vantage News APIへの完全移行**
   - Finnhub News APIを廃止
   - Alpha Vantage News API (`fetchAlphaVantageNews`) を実装
   - センチメントスコア、関連性スコアなど高品質データを活用

2. **影響度スコアリング実装**
   - **センチメント強度**: 60点配分
   - **新しさ**: 20点配分（最新=20点、6日前=0点）
   - **ソース信頼性**: 20点配分（Reuters/Bloomberg=20点、Benzinga=10点等）
   - **関連性ボーナス**: 最大+10点（Alpha VantageのRelevance Score活用）

3. **クリティカルネガティブアラート機能**
   - 検出基準: センチメント≤-0.5 AND 影響度≥70点
   - 自動検出してフロントエンドに通知

4. **ニュース取得・表示数の増加**
   - 取得数: 20件 → **40件**
   - 表示数: 5件 → **20件**（影響度上位）
   - GPT-5分析: 10件 → **40件**

5. **URL・日付情報の追加**
   - すべてのニュースにURL付与
   - 日付フォーマット: Unix timestamp + YYYY-MM-DD形式

---

## 🔧 変更ファイル一覧

### 1. `/src/types.ts`
**追加した型定義**:
```typescript
// SentimentAnalysisインターフェースの拡張
- news_examples に url, impact_score, relevance_score を追加
- critical_alerts フィールド追加

// 新規型定義
- AlphaVantageNewsArticle: Alpha Vantage API レスポンス型
- NewsImpactScore: 影響度スコアリング結果型
```

### 2. `/src/services/api-client.ts`
**追加した関数**:
```typescript
// Alpha Vantage News API実装
export async function fetchAlphaVantageNews(
  symbol: string,
  apiKey: string,
  limit: number = 40
)

// 時刻変換ヘルパー
function formatAlphaVantageTime(date: Date): string
function parseAlphaVantageTime(timeStr: string): number
```

**変更した関数**:
```typescript
// 廃止予定としてマーク
export async function fetchNews(...) {
  console.warn('[DEPRECATED] Use fetchAlphaVantageNews() instead.')
  // ...既存コード
}
```

### 3. `/src/services/sentiment.ts`
**完全書き換え**:
```typescript
// 新機能: 影響度スコアリング
function calculateImpactScore(article: NewsArticle): NewsImpactScore {
  // センチメント強度 60点
  const sentimentComponent = Math.abs(article.ticker_sentiment_score) * 60
  
  // 新しさ 20点
  const recencyComponent = Math.max(0, 20 - (ageInDays / 6) * 20)
  
  // ソース信頼性 20点
  const reliabilityComponent = sourceScores[domain] || 8
  
  // 関連性ボーナス +10点
  const relevanceBonus = article.relevance_score * 10
  
  return { impact_score: sentimentComponent + recencyComponent + reliabilityComponent + relevanceBonus }
}

// 新機能: クリティカルアラート検出
function detectCriticalNegativeNews(newsWithImpact: NewsImpactScore[]): NewsImpactScore[] {
  return newsWithImpact.filter(n => 
    n.sentiment_score <= -0.5 &&  // 強いネガティブ
    n.impact_score >= 70          // 高影響度
  )
}

// 改善: performSentimentAnalysis
export async function performSentimentAnalysis(...) {
  // 1. 影響度スコアリング（全40件）
  const newsWithImpact = news.map(calculateImpactScore)
  
  // 2. 影響度順ソート
  newsWithImpact.sort((a, b) => b.impact_score - a.impact_score)
  
  // 3. クリティカルアラート検出
  const criticalAlerts = detectCriticalNegativeNews(newsWithImpact)
  
  // 4. GPT-5分析（上位40件）
  const newsText = newsWithImpact.slice(0, 40).map(...)
  
  // 5. ニュース例作成（上位20件）
  const newsExamples = newsWithImpact.slice(0, 20).map(...)
  
  // 6. 結果返却（URL・日付・影響度スコア・クリティカルアラート付き）
  return {
    news_examples,    // 20件（URL・日付・影響度付き）
    critical_alerts,  // クリティカルアラート
    // ...
  }
}
```

---

## 📊 データフロー変更

### Before（Finnhub）
```
Finnhub API
  ↓ 20件取得
キーワードベース分析（単純）
  ↓ 5件表示
フロントエンド
```

### After（Alpha Vantage）
```
Alpha Vantage News API
  ↓ 40件取得（センチメント・関連性スコア付き）
影響度スコアリング（センチメント60% + 新しさ20% + 信頼性20%）
  ↓ 影響度順ソート
クリティカルアラート検出（センチメント≤-0.5 AND 影響度≥70）
  ↓ GPT-5分析（上位40件）
  ↓ 上位20件選択
フロントエンド（URL・日付・影響度・アラート表示）
```

---

## 🎯 影響度スコアリング詳細

### スコアリング基準

| 要素 | 配分 | 計算方法 |
|-----|------|---------|
| **センチメント強度** | 60点 | `abs(ticker_sentiment_score) × 60` |
| **新しさ** | 20点 | `max(0, 20 - (ageInDays / 6) × 20)` |
| **ソース信頼性** | 20点 | Reuters/Bloomberg=20, CNBC=17, Benzinga=10 |
| **関連性ボーナス** | +10点 | `relevance_score × 10` |

### ソース信頼性スコア

```typescript
const sourceScores = {
  'reuters.com': 20,
  'bloomberg.com': 20,
  'wsj.com': 19,
  'ft.com': 19,
  'cnbc.com': 17,
  'marketwatch.com': 16,
  'barrons.com': 16,
  'economist.com': 18,
  'fool.com': 13,
  'seekingalpha.com': 12,
  'benzinga.com': 10,
  'zacks.com': 10,
  // その他: 8点（デフォルト）
}
```

---

## ⚠️ 破壊的変更

### 1. API関数の変更

**廃止**:
```typescript
import { fetchNews } from './services/api-client'
```

**推奨**:
```typescript
import { fetchAlphaVantageNews } from './services/api-client'
```

**注意**: `fetchNews()`は廃止予定としてマークされていますが、後方互換性のため残しています。

### 2. NewsArticleインターフェースの変更

**Before**:
```typescript
interface NewsArticle {
  headline: string
  summary: string
  source: string
  datetime: number
  sentiment: string  // キーワードベース分類
}
```

**After**:
```typescript
interface NewsArticle {
  headline: string
  summary: string
  source: string
  source_domain: string          // 新規
  url: string                    // 新規
  datetime: number
  ticker_sentiment_score: number // Alpha Vantageスコア（-1.0〜+1.0）
  ticker_sentiment_label: string // "Bullish", "Bearish"等
  relevance_score: number        // 関連性スコア（0-1）
}
```

### 3. SentimentAnalysis.news_examplesの拡張

**追加フィールド**:
```typescript
news_examples?: Array<{
  headline: string
  source: string
  sentiment: string
  summary: string
  datetime: number
  date_formatted: string
  url?: string              // 新規
  impact_score?: number     // 新規
  relevance_score?: number  // 新規
}>
```

### 4. SentimentAnalysis.critical_alertsの追加

**新規フィールド**:
```typescript
critical_alerts?: Array<{
  headline: string
  source: string
  sentiment_score: number
  impact_score: number
  relevance_score: number
  url: string
  datetime: number
  date_formatted: string
}>
```

---

## 🧪 テスト結果

### ビルドテスト
```bash
$ npm run build
✓ 27 modules transformed.
dist/_worker.js  26.04 kB
✓ built in 642ms
```
**結果**: ✅ 成功

### 型チェック
- TypeScriptコンパイル: ✅ エラーなし
- すべての型定義: ✅ 整合性確認済み

---

## 📝 フロントエンド対応が必要な項目

### 1. クリティカルアラート表示

**APIレスポンス**:
```json
{
  "critical_alerts": [
    {
      "headline": "Major supply chain disruption",
      "source": "Bloomberg",
      "sentiment_score": -0.7,
      "impact_score": 92,
      "url": "https://...",
      "date_formatted": "2025-11-08"
    }
  ]
}
```

**推奨UI**:
```html
<!-- 最上部に警告バナー表示 -->
<div class="critical-alert">
  🔴 重大なネガティブニュース検出
  <div class="alert-details">
    <strong>[Bloomberg]</strong> Major supply chain disruption
    <span>影響度: 92/100 | センチメント: -0.7</span>
    <a href="https://...">詳細を見る</a>
  </div>
</div>
```

### 2. ニュース一覧表示の拡張

**APIレスポンス**:
```json
{
  "news_examples": [
    {
      "headline": "Strong Q4 earnings beat",
      "source": "Reuters",
      "sentiment": "bullish",
      "summary": "Company reports...",
      "datetime": 1699459200,
      "date_formatted": "2025-11-08",
      "url": "https://...",
      "impact_score": 87,
      "relevance_score": 0.85
    }
  ]
}
```

**推奨UI拡張**:
```html
<!-- 各ニュースに影響度・URL・日付を追加 -->
<div class="news-item">
  <div class="news-header">
    <span class="impact-badge">影響度: 87/100</span>
    <span class="date">2025-11-08</span>
  </div>
  <h3>[Reuters] Strong Q4 earnings beat</h3>
  <p>Company reports...</p>
  <div class="news-footer">
    <span class="sentiment bullish">Bullish (0.65)</span>
    <span class="relevance">関連度: 85%</span>
    <a href="https://..." target="_blank">記事を読む →</a>
  </div>
</div>
```

---

## 🚀 今後の改善案

### 短期（1-2週間）
1. フロントエンドUI実装（クリティカルアラート・影響度表示）
2. キャッシュ戦略の最適化（1時間TTL）
3. パフォーマンスモニタリング

### 中期（1-2ヶ月）
1. 複数ソース統合（Alpha Vantage 100%からハイブリッドへ検討）
2. ユーザーフィードバック収集
3. 影響度スコアリングアルゴリズムの調整

### 長期（3ヶ月以降）
1. ML-based影響度予測モデルの導入
2. カスタムアラート設定機能
3. ニュース感情分析の精度向上

---

## 📞 問い合わせ

本実装に関する質問や問題がある場合は、以下を確認してください：

1. **調査報告書**: `/home/user/webapp/SENTIMENT_ANALYSIS_INVESTIGATION.md`
2. **API試験レポート**: `/home/user/webapp/ALPHAVANTAGE_API_TEST_REPORT.md`
3. **本変更履歴**: このファイル

---

**実装担当**: AI Assistant  
**実装日**: 2025-11-09  
**ステータス**: ✅ 実装完了 - フロントエンド対応待ち  
**バックアップ**: https://page.gensparksite.com/project_backups/webapp_before_alphavantage_migration.tar.gz
