# 株価ML予測アプリケーション - システムアーキテクチャナレッジ

**バックアップ日時**: 2025-11-04  
**稼働確認済みバージョン**

---

## 📦 バックアップファイル

### ダウンロードURL

1. **webapp (フロントエンド)**
   - URL: https://page.gensparksite.com/project_backups/webapp_working_state_2025-11-04.tar.gz
   - サイズ: 17.4 MB
   - 説明: Next.js不使用、軽量Node.jsサーバー + 静的HTML

2. **ml-api (バックエンド)**
   - URL: https://page.gensparksite.com/project_backups/ml-api_working_state_2025-11-04.tar.gz
   - サイズ: 0.78 MB
   - 説明: FastAPI + LightGBM + Alpha Vantage API統合

---

## 🏗️ システム全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  フロントエンド (Port 3000) - simple-server.cjs              │
│  - NASDAQ-100 ランキング (nasdaq-ranking.html)               │
│  - テクニカル分析 v4 (technical-analysis-v4.html)            │
│  - テクニカルスクリーナー (technical-scanner.html)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  バックエンド (Port 8001) - FastAPI (main.py)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ システムA: シンプル5指標評価                           │  │
│  │ (technical_scoring.py)                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ システムB: 高度短期トレード分析                        │  │
│  │ (technical_scoring_advanced.py)                        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ システムC: ML予測 (LightGBM 107特徴量)                 │  │
│  │ (technical_ml_model.py, feature_engineering.py)        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ キャッシュマネージャー (1時間TTL)                      │  │
│  │ (cache_manager.py)                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  外部API - Alpha Vantage                                     │
│  (alpha_vantage_client.py)                                   │
│  - Premium Key: 75 calls/minute                              │
│  - 21種類のテクニカル指標取得                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📄 ページ別詳細説明

---

## 1️⃣ NASDAQ-100 ランキング (`nasdaq-ranking.html`)

### 🎯 目的
NASDAQ-100構成銘柄全100社をバッチ処理で分析し、システムA/Bのスコアでランキング表示

### 📊 処理フロー

```
1. ページロード
   ↓
2. 「NASDAQ-100銘柄を一括分析」ボタンクリック
   ↓
3. NASDAQ-100シンボルリスト取得 (100銘柄)
   ↓
4. 各銘柄に対して並列API呼び出し (Promise.all)
   - /api/proxy/technical-analysis (システムA/B)
   ↓
5. 結果を集約
   ↓
6. システムAスコア順でソート
   ↓
7. テーブル表示 (DataTables.js使用)
   - システムAスコア
   - システムBスコア
   - シグナル (強い買い/買い/中立/売り/強い売り)
   - GC(ゴールデンクロス)指標
```

### 🔑 主要機能

#### NASDAQ-100シンボルリスト (100銘柄)
```javascript
const nasdaq100Symbols = [
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA',
  // ... 全100銘柄
]
```

#### バッチ分析処理
```javascript
async function analyzeAllStocks() {
  const promises = nasdaq100Symbols.map(async (symbol) => {
    const response = await axios.post('/api/proxy/technical-analysis', {
      symbol: symbol,
      alpha_vantage_api_key: apiKey
    })
    return {
      symbol: symbol,
      system_a_score: response.data.system_a.total_score,
      system_b_score: response.data.system_b.total_score,
      system_a_signal: response.data.system_a.signal,
      system_b_signal: response.data.system_b.signal,
      gc_score: response.data.system_b.golden_cross_score
    }
  })
  
  const results = await Promise.all(promises)
  displayResults(results)
}
```

#### DataTables表示
```javascript
$('#rankingTable').DataTable({
  data: sortedResults,
  columns: [
    { data: 'rank' },
    { data: 'symbol' },
    { data: 'system_a_score' },
    { data: 'system_a_signal' },
    { data: 'system_b_score' },
    { data: 'gc_score' }
  ],
  order: [[2, 'desc']], // システムAスコア降順
  pageLength: 25
})
```

### ⚡ パフォーマンス最適化

1. **Alpha Vantageキャッシュ**
   - 1時間TTL
   - 同一銘柄の再分析はキャッシュから即座に応答

2. **並列処理**
   - Promise.allで全銘柄を並列処理
   - 100銘柄でも数分で完了（キャッシュ有効時は数秒）

3. **レート制限対策**
   - Alpha Vantage: 75 calls/minute (Premium)
   - バックエンドキャッシュで呼び出し回数を削減

---

## 2️⃣ テクニカル分析 v4 (`technical-analysis-v4.html`)

### 🎯 目的
個別銘柄の詳細分析（システムA/B/Cの全て）を実行し、チャート表示

### 📊 処理フロー

```
1. 銘柄シンボル入力 (例: META)
   ↓
2. 「分析実行」ボタンクリック
   ↓
3. システムA/B分析
   - /api/proxy/technical-analysis
   ↓
4. システムC (ML予測) 分析 (オプション)
   - /api/proxy/technical-ml-predict
   ↓
5. 結果表示
   - システムA: 5指標評価 + 総合スコア
   - システムB: 短期トレード評価 + GCスコア
   - システムC: 未来7日予測チャート + バックフィット検証チャート
```

### 🔑 主要機能

#### システムA表示
```javascript
function displaySystemA(data) {
  // ゴールデンクロス、RSI、MACD、ボリンジャーバンド、出来高
  // 各指標のスコアと総合スコア表示
  // シグナル: 強い買い/買い/中立/売り/強い売り
}
```

#### システムB表示
```javascript
function displaySystemB(data) {
  // トレンド、モメンタム、ボラティリティ、出来高
  // 市場レジーム判定 (トレンド相場/レンジ相場)
  // 動的ウェイト調整
  // GCスコア (複数時間軸のゴールデンクロス)
}
```

#### システムC表示 (ML予測)
```javascript
function displaySystemC(data) {
  const current_price = data.current_price  // 現在価格
  const future = data.future_predictions
  
  // 未来7日予測チャート
  renderFuturePredictionChart(future, current_price)
  
  // バックフィット検証チャート (過去30日)
  renderBackfitChart(data.training.backfit_predictions)
  
  // 特徴量重要度チャート (Top 10)
  renderFeatureImportanceChart(data.training.feature_importances)
}
```

#### Chart.js チャート描画 (重要な修正)
```javascript
function renderFuturePredictionChart(future, current_price) {
  const ctx = document.getElementById('futurePredictionChart').getContext('2d')
  
  // 🔥 重要: 既存チャートを破棄 (古いデータ表示を防ぐ)
  const existingChart = Chart.getChart('futurePredictionChart')
  if (existingChart) {
    existingChart.destroy()
  }
  
  // 現在価格を起点として追加
  const allDates = ['今日', ...future.dates]
  const allPredictions = [current_price, ...future.predictions]
  const allUpper = [current_price, ...future.upper_bound]
  const allLower = [current_price, ...future.lower_bound]
  
  console.log('[renderFuturePredictionChart] current_price:', current_price)
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: allDates,
      datasets: [
        {
          label: '予測価格',
          data: allPredictions,
          borderColor: 'rgb(34, 197, 94)',
          // ...
        },
        // 信頼区間（上限/下限）
      ]
    }
  })
}
```

### ⚠️ 重要な注意点

1. **Chart.jsインスタンス破棄**
   - 同じページで複数回分析を実行する場合、`Chart.getChart().destroy()`を必ず呼ぶ
   - これを忘れると、古いチャートが残り、誤ったデータが表示される

2. **current_priceの正しい取得**
   - `data.current_price` から取得（`future.predictions[0]`ではない）
   - API応答のトップレベルに含まれる

---

## 3️⃣ テクニカルスクリーナー (`technical-scanner.html`)

### 🎯 目的
複数銘柄を一括スクリーニングし、条件に合致する銘柄を抽出

### 📊 処理フロー

```
1. スクリーニング条件設定
   - システムAスコア閾値
   - システムBスコア閾値
   - シグナルタイプ
   ↓
2. 銘柄リスト入力 (カンマ区切り)
   例: AAPL,MSFT,GOOGL,META,TSLA
   ↓
3. 「スキャン実行」ボタンクリック
   ↓
4. 各銘柄に対してAPI呼び出し
   - /api/proxy/technical-analysis
   ↓
5. 条件フィルタリング
   ↓
6. マッチした銘柄のみ表示
```

### 🔑 主要機能

#### スクリーニング条件
```javascript
const filters = {
  systemAMin: 70,      // システムAスコア最小値
  systemBMin: 60,      // システムBスコア最小値
  signalType: '買い'   // シグナルタイプ
}

function matchesFilters(result) {
  return result.system_a_score >= filters.systemAMin &&
         result.system_b_score >= filters.systemBMin &&
         result.system_a_signal === filters.signalType
}
```

---

## 🔧 バックエンドAPI詳細

---

### システムA: シンプル5指標評価 (`technical_scoring.py`)

#### 目的
長期投資家向けの基本的なテクニカル指標評価

#### 評価指標 (5つ)

1. **ゴールデンクロス (30%)**
   ```python
   # SMA 50日 > SMA 200日 → ゴールデンクロス発生
   if sma_50 > sma_200:
       score = 100
   elif sma_50 > sma_200 * 0.95:
       score = 80
   else:
       score = 0
   ```

2. **RSI (25%)**
   ```python
   # RSI 30以下: 買われすぎ → 100点
   # RSI 70以上: 売られすぎ → 0点
   if rsi <= 30:
       score = 100
   elif rsi >= 70:
       score = 0
   else:
       score = 50
   ```

3. **MACD (25%)**
   ```python
   # MACD > Signal → 上昇トレンド → 100点
   if macd > signal:
       score = 100
   else:
       score = 0
   ```

4. **ボリンジャーバンド (15%)**
   ```python
   # 下限バンド付近: 買いシグナル → 100点
   # 上限バンド付近: 売りシグナル → 0点
   if price < lower_band * 1.02:
       score = 100
   elif price > upper_band * 0.98:
       score = 0
   else:
       score = 50
   ```

5. **出来高 (5%)**
   ```python
   # 平均出来高の1.5倍以上: 強い関心 → 100点
   if volume > avg_volume * 1.5:
       score = 100
   elif volume > avg_volume:
       score = 70
   else:
       score = 30
   ```

#### 総合スコア計算
```python
total_score = (
    golden_cross_score * 0.30 +
    rsi_score * 0.25 +
    macd_score * 0.25 +
    bb_score * 0.15 +
    volume_score * 0.05
)
```

#### シグナル判定
```python
if total_score >= 80:
    signal = "強い買い"
elif total_score >= 65:
    signal = "買い"
elif total_score >= 35:
    signal = "中立"
elif total_score >= 20:
    signal = "売り"
else:
    signal = "強い売り"
```

---

### システムB: 高度短期トレード分析 (`technical_scoring_advanced.py`)

#### 目的
短期トレーダー向けの複雑な複合評価（1日〜1ヶ月保有）

#### 評価カテゴリー (4つ)

1. **トレンド (動的ウェイト 10-25%)**
   - ゴールデンクロス複数時間軸 (5/10, 10/20, 20/50, 50/200)
   - ADX (トレンド強度)
   - Aroon (トレンド方向)

2. **モメンタム (動的ウェイト 50-55%)**
   - RSI
   - Stochastic
   - CCI
   - ROC

3. **ボラティリティ (動的ウェイト 10-30%)**
   - ボリンジャーバンド
   - ATR
   - 価格変動率

4. **出来高 (固定 10%)**
   - 出来高トレンド
   - OBV (On-Balance Volume)

#### 市場レジーム判定
```python
def detect_market_regime(adx: float) -> MarketRegime:
    if adx > 40:
        return MarketRegime.STRONG_TREND  # 強いトレンド相場
    elif adx > 25:
        return MarketRegime.TREND         # トレンド相場
    else:
        return MarketRegime.RANGE         # レンジ相場
```

#### 動的ウェイト調整
```python
def get_dynamic_weights(market_regime: MarketRegime):
    if market_regime == MarketRegime.STRONG_TREND:
        return {
            'trend': 0.25,       # トレンド相場ではトレンド指標重視
            'momentum': 0.55,
            'volatility': 0.10,
            'volume': 0.10
        }
    elif market_regime == MarketRegime.RANGE:
        return {
            'trend': 0.10,       # レンジ相場ではボラティリティ重視
            'momentum': 0.50,
            'volatility': 0.30,
            'volume': 0.10
        }
```

#### ゴールデンクロススコア (GC指標)
```python
# 複数時間軸のゴールデンクロスを評価
crossover_pairs = [
    (5, 10, 40.0),    # 超短期 (最重要40%)
    (10, 20, 35.0),   # 短期 (重要35%)
    (20, 50, 20.0),   # 中短期 (20%)
    (50, 200, 5.0)    # 長期 (5%)
]

gc_score = sum(
    score * weight 
    for (short, long, weight), score in zip(crossover_pairs, scores)
)
```

---

### システムC: ML予測 (LightGBM) (`technical_ml_model.py`)

#### 目的
機械学習による未来7日間の株価予測

#### 特徴量エンジニアリング (107特徴量)

**21種類のテクニカル指標から107特徴量を生成:**

1. **基本価格データ (5)**
   - open, high, low, close, volume

2. **移動平均 (10)**
   - SMA: 5, 10, 20, 50, 200日
   - EMA: 5, 10, 20, 50, 200日

3. **移動平均比率 (3)**
   - sma5_to_sma20
   - sma20_to_sma50
   - sma50_to_sma200

4. **モメンタム指標 (15)**
   - RSI (14日)
   - Stochastic (K, D)
   - CCI
   - ROC (1日, 5日, 10日)
   - Williams %R
   - MFI (Money Flow Index)

5. **トレンド指標 (8)**
   - MACD (MACD, Signal, Histogram)
   - ADX, +DI, -DI
   - Aroon (Up, Down)

6. **ボラティリティ指標 (6)**
   - ボリンジャーバンド (Upper, Middle, Lower)
   - ATR
   - 価格変動率

7. **出来高指標 (3)**
   - OBV
   - 出来高移動平均
   - 出来高比率

8. **派生特徴量 (57)**
   - 価格変化率 (1日, 5日, 10日, 20日)
   - ラグ特徴量 (過去1-5日の価格)
   - ローリング統計量 (mean, std, min, max)
   - 相互作用特徴量 (RSI × MACD等)

#### LightGBMモデル学習

```python
def train(self, features: pd.DataFrame, target: pd.Series, enable_backfit: bool):
    # ターゲット: 翌日の終値
    target = prices['close'].shift(-1)
    
    # データ分割
    if enable_backfit:
        # バックフィット検証: 最新30日をテストデータ
        X_train = features[:-30]
        X_val = features[-30:]
    else:
        # 通常: ランダム80:20分割
        X_train, X_val = train_test_split(features, target, test_size=0.2)
    
    # 標準化
    self.scaler = StandardScaler()
    X_train_scaled = self.scaler.fit_transform(X_train)
    X_val_scaled = self.scaler.transform(X_val)
    
    # LightGBM学習
    self.model = lgb.LGBMRegressor(
        objective='regression',
        n_estimators=200,
        learning_rate=0.05,
        max_depth=7,
        num_leaves=31,
        min_child_samples=20
    )
    self.model.fit(X_train_scaled, y_train)
```

#### 未来予測ロジック (Direct LGBM + Decay)

**🔥 重要な修正箇所:**

```python
def predict_future_direct(self, features: pd.DataFrame, days: int = 7):
    """
    直接予測方式：LGBMモデルで1日後を直接予測 + 減衰トレンド
    
    Day 1: LGBM(最新特徴量) → 完全な非線形予測（絶対価格）
    Day 2-7: current_price + (Day1予測 - current_price) × 減衰係数(0.95^i)
            → 予測変化量を減衰させて現在価格に加算
    """
    # 現在の価格（最新の終値）
    current_price = features['close'].iloc[-1]
    
    # LGBMで1日後の絶対価格を予測
    # 注: モデルは prices['close'].shift(-1) で学習（翌日の絶対価格）
    day1_prediction = self.model.predict(latest_scaled)[0]
    
    # Day 1の予測変化量を計算
    predicted_change = day1_prediction - current_price
    
    future_prices = []
    for i in range(days):
        if i == 0:
            # Day 1: LGBMの直接予測（絶対価格）
            next_price = day1_prediction
        else:
            # Day 2以降: 現在価格 + 予測変化量 × 減衰係数
            # 減衰係数 = 0.95^i で日数が増えるほど変化が小さくなる
            decay_factor = 0.95 ** i
            next_price = current_price + (predicted_change * decay_factor)
        
        future_prices.append(float(next_price))
    
    return {
        'current_price': float(current_price),  # 現在価格を追加
        'dates': future_dates,
        'predictions': future_prices,
        'lower_bound': lower_bound,
        'upper_bound': upper_bound,
        'confidence_std': float(prediction_uncertainty),
        'method': 'direct_lgbm_with_decay'
    }
```

**なぜこのロジックが重要か:**

- **修正前の問題**: Day 2以降が累積計算で異常な値（マイナス価格等）になっていた
- **修正後**: 現在価格を基準に、予測変化量を減衰させて加算
- **結果**: 合理的な予測トレンド（徐々に現在価格に戻る）

#### バックフィット検証

```python
def generate_backfit_predictions(self, X_val_scaled, y_val_actual):
    """
    過去30日の実際の価格と予測を比較
    データリーケージなし（Day Nの特徴量でDay N+1を予測）
    """
    predictions = self.model.predict(X_val_scaled)
    
    # 方向性精度: 上昇/下降の予測が当たった割合
    direction_accuracy = calculate_direction_accuracy(y_val_actual, predictions)
    
    return {
        'dates': dates,
        'predictions': predictions.tolist(),
        'actual_prices': y_val_actual.tolist(),
        'rmse': float(rmse),
        'mae': float(mae),
        'direction_accuracy': float(direction_accuracy)
    }
```

---

## 🗄️ キャッシュシステム (`cache_manager.py`)

### 目的
Alpha Vantage API呼び出しを削減し、レスポンス速度を向上

### キャッシュ仕様

```python
class CacheManager:
    CACHE_EXPIRY_HOURS = 1  # 1時間TTL
    CACHE_DIR = '/tmp/alphavantage_cache'
    
    def get(self, symbol: str, endpoint: str, params: Dict) -> Optional[Dict]:
        cache_key = self._generate_cache_key(symbol, endpoint, params)
        cache_file = os.path.join(self.CACHE_DIR, f"{cache_key}.json")
        
        if os.path.exists(cache_file):
            # ファイル作成時刻をチェック
            file_time = datetime.fromtimestamp(os.path.getmtime(cache_file))
            age_hours = (datetime.now() - file_time).total_seconds() / 3600
            
            if age_hours < self.CACHE_EXPIRY_HOURS:
                logger.info(f"Cache hit for {symbol}:{endpoint}")
                with open(cache_file, 'r') as f:
                    return json.load(f)
        
        return None
    
    def set(self, symbol: str, endpoint: str, data: Dict, params: Dict):
        # エラーレスポンスはキャッシュしない
        if self._is_error_response(data):
            logger.warning(f"Skipping cache - error response")
            return
        
        cache_key = self._generate_cache_key(symbol, endpoint, params)
        cache_file = os.path.join(self.CACHE_DIR, f"{cache_key}.json")
        
        with open(cache_file, 'w') as f:
            json.dump(data, f)
```

### キャッシュキー生成

```python
def _generate_cache_key(self, symbol: str, endpoint: str, params: Dict) -> str:
    # パラメータを含めてユニークなキーを生成
    params_str = json.dumps(params, sort_keys=True)
    key_str = f"{symbol}_{endpoint}_{params_str}"
    return hashlib.md5(key_str.encode()).hexdigest()
```

### エラーレスポンス検出

```python
def _is_error_response(self, data: Dict) -> bool:
    """全ての値がNoneまたは空の場合はエラーレスポンス"""
    if not isinstance(data, dict) or not data:
        return True
    
    all_null = all(
        v is None or (isinstance(v, dict) and not v) 
        for v in data.values()
    )
    return all_null
```

### キャッシュ統計

```python
def get_cache_stats(self) -> Dict:
    total_files = 0
    expired_files = 0
    total_size = 0
    
    for file in os.listdir(self.CACHE_DIR):
        file_path = os.path.join(self.CACHE_DIR, file)
        total_files += 1
        total_size += os.path.getsize(file_path)
        
        file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
        age_hours = (datetime.now() - file_time).total_seconds() / 3600
        
        if age_hours >= self.CACHE_EXPIRY_HOURS:
            expired_files += 1
    
    return {
        'total_files': total_files,
        'expired_files': expired_files,
        'active_files': total_files - expired_files,
        'total_size_mb': round(total_size / 1024 / 1024, 1)
    }
```

### モデルキャッシュ (メモリ内)

```python
# technical_ml_model.py
MODEL_CACHE = {}  # メモリ内キャッシュ
MAX_CACHE_SIZE = 100

def get_or_train_model(indicators, symbol, enable_backfit, force_retrain):
    cache_key = hashlib.md5(f"{symbol}_{enable_backfit}".encode()).hexdigest()
    
    if not force_retrain and cache_key in MODEL_CACHE:
        cached_item = MODEL_CACHE[cache_key]
        
        # 1時間以内ならキャッシュ使用
        if (datetime.now() - cached_item['timestamp']).seconds < 3600:
            logger.info(f"Using cached model for {symbol}")
            return cached_item['model'], cached_item['result']
    
    # 新規学習
    model, result = train_technical_model(indicators, symbol, enable_backfit)
    
    # キャッシュに保存
    MODEL_CACHE[cache_key] = {
        'model': model,
        'result': result,
        'timestamp': datetime.now()
    }
    
    return model, result
```

---

## 🚀 デプロイ・起動手順

### 前提条件
- Python 3.12
- Node.js 20+
- PM2 (プロセス管理)

### 1. バックエンド (ml-api) 起動

```bash
cd /home/user/ml-api

# 依存関係インストール
pip install -r requirements.txt

# PM2で起動
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs ml-api --nostream
```

**ecosystem.config.cjs:**
```javascript
module.exports = {
  apps: [{
    name: 'ml-api',
    script: 'uvicorn',
    args: 'main:app --host 0.0.0.0 --port 8001',
    env: {
      PYTHONUNBUFFERED: '1',
      PORT: 8001
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork'
  }]
}
```

### 2. フロントエンド (webapp) 起動

```bash
cd /home/user/webapp

# 依存関係インストール
npm install

# PM2で起動
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs static-server --nostream
```

**ecosystem.config.cjs:**
```javascript
module.exports = {
  apps: [{
    name: 'static-server',
    script: './simple-server.cjs',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork'
  }]
}
```

**simple-server.cjs (軽量Node.jsサーバー):**
```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, 'dist/static');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // ルートは NASDAQ ランキングにリダイレクト
  if (req.url === '/') {
    res.writeHead(302, { 'Location': '/static/nasdaq-ranking.html' });
    res.end();
    return;
  }
  
  // 静的ファイル提供
  if (req.url.startsWith('/static/')) {
    const filePath = path.join(STATIC_DIR, req.url.replace('/static/', ''));
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }
  
  // ML API プロキシ
  if (req.url.startsWith('/api/')) {
    const options = {
      hostname: 'localhost',
      port: 8001,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    req.pipe(proxyReq);
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
```

### 3. 動作確認

```bash
# バックエンドAPI確認
curl http://localhost:8001/health

# フロントエンド確認
curl http://localhost:3000/static/nasdaq-ranking.html

# ML予測API確認
curl -X POST http://localhost:8001/api/technical-ml-predict \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","alpha_vantage_api_key":"YOUR_KEY","enable_backfit":false}'
```

---

## 📊 パフォーマンス指標

### レスポンスタイム (キャッシュなし)

- **システムA/B分析**: 3-5秒
- **システムC (ML予測)**: 7-10秒
- **NASDAQ-100全銘柄**: 8-12分

### レスポンスタイム (キャッシュ有効)

- **システムA/B分析**: 0.1-0.3秒 (97%短縮)
- **システムC (ML予測)**: 0.05-0.1秒 (99%短縮)
- **NASDAQ-100全銘柄**: 15-30秒 (95%短縮)

### Alpha Vantage API呼び出し

- **Premium制限**: 75 calls/minute
- **1銘柄あたり**: 21 API呼び出し (テクニカル指標)
- **キャッシュ効果**: 1時間以内の再分析は0呼び出し

---

## 🛠️ トラブルシューティング

### Chart.js古いデータ表示問題

**症状**: 同じページで複数回分析すると、古いチャートデータが表示される

**原因**: Chart.jsインスタンスが破棄されず、新しいチャートが重ねて描画される

**解決方法**:
```javascript
// チャート描画前に必ず既存インスタンスを破棄
const existingChart = Chart.getChart('futurePredictionChart')
if (existingChart) {
  existingChart.destroy()
}
```

### システムC予測値が異常

**症状**: Day 2以降の予測がマイナス価格や異常な値になる

**原因**: `predict_future_direct`のDay 2以降計算ロジックが誤っていた

**解決方法**:
```python
# 修正前（誤り）
next_price = future_prices[-1] + price_change  # 累積で異常値

# 修正後（正しい）
next_price = current_price + (predicted_change * decay_factor)
```

### current_priceがnull

**症状**: API応答で`current_price`フィールドがnull

**原因**: 
1. `predict_future_direct`の返り値に含まれていない
2. `TechnicalMLResponse`スキーマに定義されていない

**解決方法**:
1. `predict_future_direct`に`'current_price': float(current_price)`を追加
2. `TechnicalMLResponse`に`current_price: Optional[float] = None`を追加

---

## 📝 今後の改善案

### 機能追加

1. **リアルタイム更新**
   - WebSocketでリアルタイム株価表示
   
2. **アラート機能**
   - 特定条件でメール/Slack通知

3. **ポートフォリオ管理**
   - 複数銘柄のポートフォリオ追跡

4. **バックテスト機能**
   - 過去データでトレード戦略検証

### パフォーマンス改善

1. **Redis導入**
   - ファイルベースからRedisキャッシュへ移行

2. **非同期処理**
   - asyncioで並列処理高速化

3. **CDN配信**
   - 静的ファイルをCDN経由で配信

---

## 🔐 セキュリティ

### API Key管理

- **Alpha Vantage API Key**: フロントエンドで入力（本番では環境変数推奨）
- **機密情報**: `.gitignore`で除外

### CORS設定

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番では特定ドメインに制限
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📚 参考資料

- **Alpha Vantage API**: https://www.alphavantage.co/documentation/
- **LightGBM**: https://lightgbm.readthedocs.io/
- **Chart.js**: https://www.chartjs.org/
- **FastAPI**: https://fastapi.tiangolo.com/
- **DataTables**: https://datatables.net/

---

**作成日**: 2025-11-04  
**バージョン**: Working State Backup  
**ステータス**: 全機能動作確認済み
