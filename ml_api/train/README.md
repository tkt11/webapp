# Stock Prediction Model Training

機械学習モデルの学習用スクリプト

## 📋 概要

このディレクトリには、LightGBMモデルを学習するためのスクリプトが含まれています。

### ファイル構成

```
train/
├── collect_data.py       # データ収集スクリプト
├── train_model.py        # モデル学習スクリプト
├── requirements.txt      # Python依存パッケージ
└── README.md            # このファイル
```

---

## 🚀 使い方

### ステップ1: 環境準備

```bash
# Python仮想環境の作成(オプション)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存パッケージのインストール
pip install -r requirements.txt
```

### ステップ2: Finnhub APIキーの取得

1. https://finnhub.io/register にアクセス
2. 無料アカウントを作成
3. APIキーをコピー
4. 環境変数に設定:

```bash
export FINNHUB_API_KEY='your_api_key_here'
```

### ステップ3: データ収集

```bash
python collect_data.py
```

**実行内容**:
- デフォルトで5銘柄(AAPL, GOOGL, MSFT, TSLA, AMZN)のデータを収集
- 過去3年分の日次データ取得
- 技術指標(SMA, RSI, MACD等)を自動計算
- ファンダメンタルデータ(PER, ROE等)を取得
- `data/` ディレクトリにCSVファイルを保存

**出力例**:
```
data/
├── AAPL_training_data.csv
├── AAPL_metadata.json
├── GOOGL_training_data.csv
├── GOOGL_metadata.json
└── ...
```

**APIコスト**: **無料** (Finnhub Free tier内)

### ステップ4: モデル学習

```bash
python train_model.py
```

**実行内容**:
- 収集したデータを読み込み
- 25個以上の特徴量を使用
- LightGBMモデルを学習
- 時系列分割(80% train, 20% test)
- Early stopping で過学習防止
- 学習済みモデルを `models/` に保存

**出力例**:
```
models/
├── AAPL_model.txt              # 学習済みモデル
├── AAPL_metrics.json           # 評価指標
├── AAPL_feature_importance.csv # 特徴量重要度
├── AAPL_deployment.json        # デプロイ情報
└── ...
```

**学習時間**: 銘柄ごとに1-5分

**実行環境**: ローカルPC or Google Colab無料版

**コスト**: **無料**

---

## 📊 学習データの詳細

### データ収集範囲
- **期間**: 過去3年分(約750日)
- **頻度**: 日次
- **銘柄**: カスタマイズ可能

### 特徴量(25個以上)

#### 価格データ(5個)
- open, high, low, close, volume

#### 技術指標(19個)
- **移動平均**: SMA(5,10,20,50), EMA(12,26)
- **トレンド**: MACD, MACD Signal, MACD差分
- **モメンタム**: RSI, 5日/10日/20日モメンタム
- **ボラティリティ**: Bollinger Bands(上/中/下), BB幅
- **ボリューム**: 20日平均ボリューム, ボリューム比率
- **その他**: ボラティリティ, ボラティリティ比率

#### ファンダメンタル(3-4個、利用可能な場合)
- PER (Price-to-Earnings Ratio)
- ROE (Return on Equity)
- PBR (Price-to-Book Ratio)
- 時価総額

### ターゲット変数
- **target**: 翌日の終値

---

## 💰 APIコストの詳細

### データ収集フェーズ
```
1銘柄あたり:
- 日次データ取得: 1 APIコール
- ファンダメンタルデータ: 2 APIコール
- 合計: 3 APIコール

5銘柄の場合:
- 合計: 15 APIコール
- Finnhub Free tier: 60コール/分
- コスト: $0 (無料枠内)
```

### 学習フェーズ
```
- 実行環境: ローカルPC or Google Colab
- APIコール: 0
- コスト: $0
```

### 定期再学習(月1回)
```
月次コスト:
- データ収集: $0 (無料枠内)
- 学習実行: $0
- 合計: $0

年間コスト:
- 12回の再学習: $0
```

---

## 🔄 定期再学習の実装

### 手動再学習(月1回推奨)

```bash
# 1. 最新データ収集
export FINNHUB_API_KEY='your_api_key'
python collect_data.py

# 2. モデル再学習
python train_model.py

# 3. モデルをAPI用にコピー
cp models/AAPL_model.txt ../model.txt

# 4. main.pyを更新(以下のコメント解除)
# model = lgb.Booster(model_file='model.txt')

# 5. GitHubにプッシュ(Cloud Runが自動再デプロイ)
git add .
git commit -m "Update trained model"
git push origin main
```

### 自動再学習(オプション・上級者向け)

Google Cloud Schedulerを使用:
1. Cloud Schedulerでcronジョブ作成(月1回実行)
2. Cloud Functionsでスクリプト実行
3. 学習完了後、Cloud Runに自動デプロイ

**追加コスト**: Cloud Scheduler $0.10/月、Cloud Functions $0.40/月
**合計**: $0.50/月

---

## 📈 モデル評価指標

学習完了後、以下の指標で評価:

- **RMSE** (Root Mean Squared Error): 予測誤差の平均
  - 目標: $5以下が良好
- **MAE** (Mean Absolute Error): 絶対誤差の平均
  - 目標: $3以下が良好
- **R²** (決定係数): モデルの説明力
  - 目標: 0.7以上が良好

---

## 🎯 カスタマイズ

### 銘柄の変更

`collect_data.py` の `main()` 関数を編集:

```python
symbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'META']  # お好みの銘柄
```

### データ期間の変更

```python
df = collect_data_for_symbol(symbol, years=5)  # 5年分に変更
```

### ハイパーパラメータの調整

`train_model.py` の `params` を編集:

```python
params = {
    'num_leaves': 31,        # ツリーの複雑さ
    'learning_rate': 0.05,   # 学習率
    'max_depth': 6,          # ツリーの深さ
}
```

---

## 🐛 トラブルシューティング

### Q: APIキーエラーが出る
A: 環境変数 `FINNHUB_API_KEY` が正しく設定されているか確認

### Q: データが取得できない
A: Finnhub APIの無料枠制限(60コール/分)を超えていないか確認

### Q: メモリエラーが出る
A: 学習期間を短くする(3年 → 2年)

### Q: 学習が遅い
A: `num_boost_round` を減らす(1000 → 500)

---

## 📚 参考資料

- **LightGBM公式ドキュメント**: https://lightgbm.readthedocs.io/
- **Finnhub API**: https://finnhub.io/docs/api
- **技術指標の解説**: https://www.investopedia.com/

---

## 🎓 学習のヒント

### 初心者向け
1. まず1銘柄(AAPL)で試す
2. デフォルト設定で学習
3. 評価指標を確認
4. 精度が低ければ特徴量を増やす

### 中級者向け
1. 複数銘柄で学習
2. ハイパーパラメータ調整
3. 特徴量エンジニアリング
4. Cross-validation実装

### 上級者向け
1. アンサンブル学習
2. AutoML (Optuna)
3. リアルタイム予測API
4. 自動再学習パイプライン

---

**質問・バグ報告**: GitHubのIssueまで
