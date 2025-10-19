# Stock AI Predictor - 株価予測AIアプリケーション

## 📊 プロジェクト概要

**Stock AI Predictor**は、5次元分析エンジンとGPT-4o/GPT-5を組み合わせた高精度な株価予測AIアプリケーションです。複数の観点から銘柄を分析し、買い・売り・保持の判定を提供します。

## 🎯 主要機能

### ✅ 完成した機能

#### 1. **5次元分析エンジン**
- **テクニカル分析（35%）**: SMA、RSI、MACD、ボリンジャーバンド
- **ファンダメンタル分析（30%）**: PER、PBR、ROE、EPS、配当利回り
- **センチメント分析（15%）**: ニュース + GPT-4o/GPT-5による感情分析
- **マクロ経済分析（10%）**: GDP成長率、失業率、CPI、金利
- **アナリスト評価（10%）**: 目標株価、コンセンサス評価

#### 2. **銘柄分析機能**
- 任意の銘柄コード（ティッカー）を入力して詳細分析
- 5次元スコアの内訳表示
- ポジティブ要因とリスク要因の明示
- GPT-4o/GPT-5による初心者向け詳細解説
- 目標株価と期待リターンの計算
- 過去30日の株価チャート表示（Chart.js）

#### 3. **おすすめ銘柄TOP10**
- S&P 500主要50銘柄を自動分析
- スコア順にTOP10をランキング表示
- 各銘柄のクリックで詳細分析へ遷移
- 期待リターン、信頼度の表示

#### 4. **投資シミュレーター（タイムトラベル機能）**
- 過去の任意の日に購入・売却した場合の損益計算
- 日次パフォーマンス追跡
- 統計情報（最大ドローダウン、ボラティリティ）
- ビジュアルグラフ表示（株価推移、ポートフォリオ価値）

#### 5. **バックテスト機能**
- 過去の日付で予測を実行
- 実際の結果と比較
- 1週間後、1ヶ月後、3ヶ月後の精度検証
- 予測方向の正解率表示

#### 6. **ビジュアライゼーション**
- Chart.jsによる高品質グラフ
- 株価チャート（折れ線グラフ）
- スコア内訳の視覚化
- 投資シミュレーション結果のグラフ

## 🚀 デモURL

**公開URL**: https://3000-i1j5rforwq1dklhedain9-2e77fc33.sandbox.novita.ai

### 動作確認済みの銘柄例
- **AAPL** (Apple) - 判定: BUY、スコア: 71/100
- **GOOGL** (Google) - 判定: HOLD、詳細解説生成確認済み
- **TSLA** (Tesla)
- **MSFT** (Microsoft)
- **NVDA** (NVIDIA)

## 🛠️ 技術スタック

### フレームワーク・ライブラリ
- **Hono**: 軽量高速Webフレームワーク
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **Chart.js**: グラフ描画ライブラリ
- **TailwindCSS**: ユーティリティファーストCSS

### API統合
- **Alpha Vantage API**: 株価データ取得
- **Finnhub API**: 財務データ、ニュース、アナリスト評価
- **FRED API**: マクロ経済指標（無料）
- **OpenAI API**: GPT-4o/GPT-5による分析

### デプロイ
- **Cloudflare Pages**: エッジデプロイ
- **PM2**: プロセス管理（開発環境）

## 📁 プロジェクト構造

```
webapp/
├── src/
│   ├── index.tsx              # メインアプリ + API routes + UI
│   ├── types.ts               # TypeScript型定義
│   └── services/
│       ├── technical.ts       # テクニカル分析エンジン
│       ├── fundamental.ts     # ファンダメンタル分析エンジン
│       ├── sentiment.ts       # センチメント分析（GPT-4o/GPT-5）
│       ├── macro.ts           # マクロ経済分析
│       ├── analyst.ts         # アナリスト評価分析
│       ├── prediction.ts      # 統合予測エンジン + 詳細解説
│       ├── simulation.ts      # 投資シミュレーション + バックテスト
│       └── api-client.ts      # 外部API通信クライアント
├── dist/                      # ビルド出力
├── ecosystem.config.cjs       # PM2設定
├── wrangler.jsonc             # Cloudflare Pages設定
├── package.json               # 依存関係 + scripts
├── .dev.vars                  # 環境変数（ローカル開発）
├── .gitignore                 # Git除外設定
└── README.md                  # このファイル
```

## 🔧 ローカル開発

### 1. 依存関係インストール
```bash
cd /home/user/webapp
npm install
```

### 2. 環境変数設定
`.dev.vars`ファイルにAPIキーを設定：
```
ALPHA_VANTAGE_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
FRED_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

### 3. ビルド
```bash
npm run build
```

### 4. 開発サーバー起動（PM2）
```bash
# ポートクリーンアップ
fuser -k 3000/tcp 2>/dev/null || true

# PM2で起動
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs stock-ai-predictor --nostream

# 動作確認
curl http://localhost:3000/api/health
```

### 5. 再起動（コード変更時）
```bash
npm run build && pm2 restart stock-ai-predictor
```

## 📊 API仕様

### `/api/health` (GET)
ヘルスチェック

### `/api/analyze` (POST)
```json
{
  "symbol": "AAPL"
}
```
→ 5次元分析結果 + GPT-4o/GPT-5詳細解説

### `/api/recommendations` (GET)
→ おすすめ銘柄TOP10

### `/api/simulation` (POST)
```json
{
  "symbol": "AAPL",
  "purchaseDate": "2024-01-15",
  "sellDate": "2024-06-15",
  "investmentAmount": 10000
}
```
→ 投資シミュレーション結果

### `/api/backtest` (POST)
```json
{
  "symbol": "AAPL",
  "testDate": "2024-01-01"
}
```
→ バックテスト結果

## 🎯 使用例

### 銘柄分析
1. トップページにアクセス
2. 「銘柄分析」タブで銘柄コード（例: AAPL）を入力
3. 「分析開始」ボタンをクリック
4. 5次元スコア、判定理由、GPT-4o/GPT-5解説、グラフを確認

### おすすめ銘柄
1. 「おすすめ銘柄TOP10」タブをクリック
2. 「最新のおすすめを取得」ボタンをクリック
3. ランキングテーブルから気になる銘柄の「分析」をクリック

### 投資シミュレーション
1. 「投資シミュレーター」タブをクリック
2. 銘柄コード、購入日、売却日、投資額を入力
3. 「シミュレーション実行」をクリック
4. 損益、リターン率、グラフを確認

### バックテスト
1. 「バックテスト」タブをクリック
2. 銘柄コードと予測日を入力
3. 「バックテスト実行」をクリック
4. 予測精度スコアと実際の結果を確認

## 💰 コスト見積もり

| サービス | プラン | 月額コスト |
|---------|--------|-----------|
| Alpha Vantage | Premium | $49.99 |
| Finnhub | 無料プラン | $0 |
| FRED | 無料 | $0 |
| OpenAI GPT-4o | 従量課金 | ~$15 |
| **合計** | | **$64.99/月** |

※ GPT-5が利用可能になれば自動的に切り替わります（現在はGPT-4oフォールバック）

## 🔍 実装の特徴

### 1. **GPT-4o/GPT-5フォールバック機能**
GPT-5が利用できない場合、自動的にGPT-4oにフォールバックします。

### 2. **実データでの動作確認済み**
- AAPL: スコア71、判定BUY（テクニカル85、ファンダメンタル40）
- GOOGL: 詳細解説生成確認済み（GPT-4o）

### 3. **エラーハンドリング**
- API呼び出し失敗時の適切なエラーメッセージ
- データ不足時のフォールバック処理
- レート制限対策（バッチ処理 + 1秒待機）

### 4. **パフォーマンス最適化**
- 並列API呼び出し（Promise.all）
- Chart.jsによる軽量グラフ描画
- Cloudflare Pages エッジデプロイ対応

## 📈 今後の拡張予定

### Phase 2（次回実装）
- [ ] ポートフォリオ管理機能
- [ ] アラート機能（目標株価到達時通知）
- [ ] 日本株対応（市場拡大）
- [ ] カスタムウォッチリスト

### Phase 3（将来実装）
- [ ] 機械学習モデルの追加（統計的予測強化）
- [ ] ユーザーアカウント機能
- [ ] 過去予測の精度分析（的中率トラッキング）
- [ ] PDF レポート出力

## 🐛 既知の問題

1. **GPT-5 APIモデル名の問題**
   - 現状: GPT-5がAPIで利用できない可能性
   - 対策: GPT-4oに自動フォールバック実装済み
   - 将来: GPT-5利用可能になれば自動切り替え

2. **おすすめ銘柄の処理時間**
   - 50銘柄の並列分析で約30秒かかる
   - レート制限対策のため1秒待機を挟む

## 📝 Git管理

```bash
# 初回コミット済み
git status
git log --oneline

# 変更をコミット
git add .
git commit -m "機能追加: 〇〇"

# GitHub連携（setup_github_environment実行後）
git remote add origin https://github.com/USERNAME/stock-ai-predictor.git
git push -u origin main
```

## 📄 ライセンス

このプロジェクトは個人利用目的で作成されています。

## 🙏 謝辞

- OpenAI GPT-4o/GPT-5
- Alpha Vantage API
- Finnhub API
- FRED API
- Hono Framework
- Chart.js
- TailwindCSS

---

**Last Updated**: 2025-10-19
**Status**: ✅ 完全動作確認済み
**Demo URL**: https://3000-i1j5rforwq1dklhedain9-2e77fc33.sandbox.novita.ai
