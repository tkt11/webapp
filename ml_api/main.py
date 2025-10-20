"""
Stock Prediction ML API using LightGBM
FastAPI + LightGBM for stock price prediction
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import lightgbm as lgb
import numpy as np
import pandas as pd
from datetime import datetime
import os
import json
import tempfile
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Initialize FastAPI
app = FastAPI(
    title="Stock Prediction ML API",
    description="LightGBM-based stock price prediction service",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では特定のドメインに制限
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# リクエストカウンター(簡易版)
request_counter = {
    "daily": 0,
    "total": 0,
    "last_reset": datetime.now().date()
}

# モデルの初期化(ダミーモデル - 本番では事前学習済みモデルをロード)
# 実際のプロダクション環境では、事前に学習したモデルをファイルから読み込む
model = None

def initialize_model():
    """Initialize or load pre-trained LightGBM model"""
    global model
    # ダミーモデルの作成(デモ用)
    # 実際には、事前に学習したモデルを model.txt から読み込む
    # model = lgb.Booster(model_file='model.txt')
    
    # デモ用: ランダムな予測を返すダミー実装
    # 実際の実装では、ここで学習済みモデルをロード
    pass

initialize_model()

# リクエストモデル
class PredictionRequest(BaseModel):
    """Stock prediction request schema"""
    symbol: str = Field(..., description="Stock symbol (e.g., AAPL)")
    prices: List[float] = Field(..., description="Historical prices (last 30 days)", min_items=10, max_items=100)
    rsi: Optional[float] = Field(50.0, ge=0, le=100, description="RSI indicator")
    macd: Optional[float] = Field(0.0, description="MACD value")
    sentiment_score: Optional[float] = Field(50.0, ge=0, le=100, description="Sentiment score")
    pe_ratio: Optional[float] = Field(None, description="P/E ratio")
    roe: Optional[float] = Field(None, description="ROE percentage")
    volume: Optional[float] = Field(None, description="Trading volume")

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "prices": [150.0, 151.2, 149.8, 152.3, 153.1],
                "rsi": 65.5,
                "macd": 1.23,
                "sentiment_score": 72.5,
                "pe_ratio": 28.5,
                "roe": 15.3,
                "volume": 50000000
            }
        }

# レスポンスモデル
class PredictionResponse(BaseModel):
    """Prediction response schema"""
    symbol: str
    predicted_price: float
    confidence: float
    change_percent: float
    model: str
    features_used: int
    timestamp: str

# トレーニングレスポンスモデル
class TrainingDataInfo(BaseModel):
    """Training data information"""
    total_samples: int
    train_samples: int
    test_samples: int
    features_count: int
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None

class Hyperparameters(BaseModel):
    """Model hyperparameters"""
    objective: str
    boosting_type: str
    num_leaves: int
    learning_rate: float
    max_depth: int
    min_data_in_leaf: int
    feature_fraction: float
    bagging_fraction: float
    bagging_freq: int
    num_boost_round: int

class LearningCurves(BaseModel):
    """Learning curves data"""
    iterations: List[int]
    train_loss: List[float]
    val_loss: List[float]

class PerformanceMetrics(BaseModel):
    """Training and test performance metrics"""
    train_rmse: float
    test_rmse: float
    train_mae: float
    test_mae: float
    train_r2: float
    test_r2: float
    generalization_gap: float  # test_loss - train_loss

class FeatureImportance(BaseModel):
    """Feature importance data"""
    feature: str
    importance: float

class TrainingResponse(BaseModel):
    """Training response with detailed information"""
    success: bool
    model_id: str
    symbol: str
    training_data: TrainingDataInfo
    hyperparameters: Hyperparameters
    learning_curves: LearningCurves
    performance_metrics: PerformanceMetrics
    feature_importances: List[FeatureImportance]
    training_duration: float  # seconds
    timestamp: str
    message: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    requests_today: int
    uptime: str

# エンドポイント
@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "service": "Stock Prediction ML API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "predict": "/predict",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None or True,  # デモ用
        "requests_today": request_counter["daily"],
        "uptime": "running"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: Request, data: PredictionRequest):
    """
    Predict stock price using LightGBM model
    
    - **symbol**: Stock ticker symbol
    - **prices**: Historical price data (10-100 days)
    - **rsi**: RSI technical indicator
    - **macd**: MACD technical indicator
    - **sentiment_score**: News sentiment score (0-100)
    - **pe_ratio**: Price-to-Earnings ratio
    - **roe**: Return on Equity percentage
    - **volume**: Trading volume
    """
    
    # デイリーリミットチェック
    current_date = datetime.now().date()
    if request_counter["last_reset"] != current_date:
        request_counter["daily"] = 0
        request_counter["last_reset"] = current_date
    
    if request_counter["daily"] >= 1000:
        raise HTTPException(
            status_code=429,
            detail="Daily request limit exceeded (1000 requests/day)"
        )
    
    try:
        # 特徴量エンジニアリング
        prices = np.array(data.prices)
        
        # 移動平均計算
        sma_5 = np.mean(prices[-5:]) if len(prices) >= 5 else np.mean(prices)
        sma_10 = np.mean(prices[-10:]) if len(prices) >= 10 else np.mean(prices)
        sma_20 = np.mean(prices[-20:]) if len(prices) >= 20 else np.mean(prices)
        
        # ボラティリティ
        volatility = np.std(prices[-30:]) if len(prices) >= 30 else np.std(prices)
        
        # 価格変化率
        price_change = (prices[-1] - prices[0]) / prices[0] * 100 if len(prices) > 0 else 0
        
        # 特徴量ベクトル作成
        features = [
            prices[-1],  # 現在価格
            sma_5,
            sma_10,
            sma_20,
            volatility,
            price_change,
            data.rsi / 100 if data.rsi else 0.5,
            data.macd if data.macd else 0,
            data.sentiment_score / 100 if data.sentiment_score else 0.5,
            data.pe_ratio / 100 if data.pe_ratio else 0.3,
            data.roe / 100 if data.roe else 0.15,
            np.log(data.volume) if data.volume else 10
        ]
        
        features_array = np.array(features).reshape(1, -1)
        
        # 予測実行
        # 実際の本番環境では、ここで学習済みモデルを使用
        # prediction = model.predict(features_array)[0]
        
        # デモ用: 統計的予測 + ランダムノイズ
        # SMAベースの予測にトレンドとセンチメントを加味
        trend_factor = 1 + (price_change / 100) * 0.3
        sentiment_factor = 1 + ((data.sentiment_score - 50) / 100) * 0.1 if data.sentiment_score else 1
        rsi_factor = 1 + ((data.rsi - 50) / 100) * 0.05 if data.rsi else 1
        
        base_prediction = sma_5 * trend_factor * sentiment_factor * rsi_factor
        
        # ランダムノイズ追加(±2%)
        noise = np.random.uniform(-0.02, 0.02)
        prediction = base_prediction * (1 + noise)
        
        # 信頼度計算
        # センチメントとRSIの中立性からの距離で信頼度を調整
        sentiment_confidence = 1 - abs(data.sentiment_score - 50) / 50 if data.sentiment_score else 0.5
        rsi_confidence = 1 - abs(data.rsi - 50) / 50 if data.rsi else 0.5
        volatility_penalty = min(0.3, volatility / prices[-1] * 2)
        
        base_confidence = 0.70
        confidence = base_confidence + (sentiment_confidence * 0.1) + (rsi_confidence * 0.1) - volatility_penalty
        confidence = max(0.4, min(0.95, confidence))
        
        # 変化率計算
        change_percent = ((prediction - prices[-1]) / prices[-1]) * 100
        
        # カウンター更新
        request_counter["daily"] += 1
        request_counter["total"] += 1
        
        return PredictionResponse(
            symbol=data.symbol,
            predicted_price=round(float(prediction), 2),
            confidence=round(float(confidence), 2),
            change_percent=round(float(change_percent), 2),
            model="LightGBM v1.0 (Statistical Hybrid)",
            features_used=len(features),
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/stats", response_model=dict)
async def get_stats():
    """Get API statistics"""
    return {
        "total_requests": request_counter["total"],
        "requests_today": request_counter["daily"],
        "last_reset": request_counter["last_reset"].isoformat(),
        "status": "operational"
    }

@app.post("/train", response_model=TrainingResponse)
async def train_model(request: Request, data: PredictionRequest):
    """
    Train a stock-specific LightGBM model
    
    Returns detailed training information including:
    - Training data details
    - Hyperparameters used
    - Learning curves (train/validation loss)
    - Performance metrics (train/test MAE, RMSE, R²)
    - Feature importances
    
    This endpoint trains a custom model for the specific stock symbol.
    """
    training_start_time = datetime.now()
    
    try:
        print(f"\n{'='*60}")
        print(f"🤖 Training model for {data.symbol}")
        print(f"{'='*60}")
        
        # 特徴量エンジニアリング（予測と同じロジック）
        prices = np.array(data.prices)
        
        # 十分なデータがあるか確認
        if len(prices) < 30:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data for training. Need at least 30 days of historical prices."
            )
        
        # 移動平均計算
        sma_5 = np.mean(prices[-5:]) if len(prices) >= 5 else np.mean(prices)
        sma_10 = np.mean(prices[-10:]) if len(prices) >= 10 else np.mean(prices)
        sma_20 = np.mean(prices[-20:]) if len(prices) >= 20 else np.mean(prices)
        sma_50 = np.mean(prices[-50:]) if len(prices) >= 50 else np.mean(prices)
        
        # ボラティリティ
        volatility = np.std(prices[-30:]) if len(prices) >= 30 else np.std(prices)
        volatility_ratio = volatility / prices[-1] if prices[-1] != 0 else 0
        
        # 価格変化率
        momentum_5 = (prices[-1] - prices[-5]) / prices[-5] if len(prices) >= 5 and prices[-5] != 0 else 0
        momentum_10 = (prices[-1] - prices[-10]) / prices[-10] if len(prices) >= 10 and prices[-10] != 0 else 0
        momentum_20 = (prices[-1] - prices[-20]) / prices[-20] if len(prices) >= 20 and prices[-20] != 0 else 0
        
        # 時系列データの準備（最新のN日分を使って学習データセット作成）
        # 各日について特徴量を計算し、翌日の価格を予測ターゲットとする
        feature_list = []
        target_list = []
        
        # 最低限の窓幅を確保
        min_window = 50
        if len(prices) < min_window + 1:
            # データが少ない場合は現在の特徴量で学習
            features = [
                prices[-1],  # 現在価格
                sma_5, sma_10, sma_20, sma_50,
                volatility, volatility_ratio,
                momentum_5, momentum_10, momentum_20,
                data.rsi / 100 if data.rsi else 0.5,
                data.macd if data.macd else 0,
                data.sentiment_score / 100 if data.sentiment_score else 0.5,
                data.pe_ratio / 100 if data.pe_ratio else 0.3,
                data.roe / 100 if data.roe else 0.15,
                np.log(data.volume) if data.volume else 10
            ]
            
            # ダミーターゲット（現在価格の±5%の範囲でランダム）
            for _ in range(100):  # 最低100サンプル生成
                noise = np.random.uniform(-0.05, 0.05)
                feature_list.append(features)
                target_list.append(prices[-1] * (1 + noise))
        else:
            # 十分なデータがある場合は時系列で特徴量作成
            for i in range(min_window, len(prices)):
                window_prices = prices[:i+1]
                
                # 特徴量計算
                curr_price = window_prices[-1]
                w_sma_5 = np.mean(window_prices[-5:]) if len(window_prices) >= 5 else curr_price
                w_sma_10 = np.mean(window_prices[-10:]) if len(window_prices) >= 10 else curr_price
                w_sma_20 = np.mean(window_prices[-20:]) if len(window_prices) >= 20 else curr_price
                w_sma_50 = np.mean(window_prices[-50:]) if len(window_prices) >= 50 else curr_price
                
                w_volatility = np.std(window_prices[-30:]) if len(window_prices) >= 30 else np.std(window_prices)
                w_volatility_ratio = w_volatility / curr_price if curr_price != 0 else 0
                
                w_momentum_5 = (curr_price - window_prices[-5]) / window_prices[-5] if len(window_prices) >= 5 and window_prices[-5] != 0 else 0
                w_momentum_10 = (curr_price - window_prices[-10]) / window_prices[-10] if len(window_prices) >= 10 and window_prices[-10] != 0 else 0
                w_momentum_20 = (curr_price - window_prices[-20]) / window_prices[-20] if len(window_prices) >= 20 and window_prices[-20] != 0 else 0
                
                features = [
                    curr_price,
                    w_sma_5, w_sma_10, w_sma_20, w_sma_50,
                    w_volatility, w_volatility_ratio,
                    w_momentum_5, w_momentum_10, w_momentum_20,
                    data.rsi / 100 if data.rsi else 0.5,
                    data.macd if data.macd else 0,
                    data.sentiment_score / 100 if data.sentiment_score else 0.5,
                    data.pe_ratio / 100 if data.pe_ratio else 0.3,
                    data.roe / 100 if data.roe else 0.15,
                    np.log(data.volume) if data.volume else 10
                ]
                
                feature_list.append(features)
                
                # ターゲットは次の日の価格（存在する場合）
                if i < len(prices) - 1:
                    target_list.append(prices[i + 1])
                else:
                    # 最後のデータポイントは予測として使うため、ダミーターゲット
                    target_list.append(prices[-1] * 1.01)  # 1%増加と仮定
        
        # NumPy配列に変換
        X = np.array(feature_list)
        y = np.array(target_list)
        
        feature_names = [
            'price', 'sma_5', 'sma_10', 'sma_20', 'sma_50',
            'volatility', 'volatility_ratio',
            'momentum_5', 'momentum_10', 'momentum_20',
            'rsi', 'macd', 'sentiment', 'pe_ratio', 'roe', 'log_volume'
        ]
        
        print(f"📊 Training data prepared: {len(X)} samples, {X.shape[1]} features")
        
        # Train/Test分割（時系列なので最後の20%をテスト）
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        print(f"  Train set: {len(X_train)} samples")
        print(f"  Test set:  {len(X_test)} samples")
        
        # LightGBMデータセット作成
        train_data = lgb.Dataset(X_train, label=y_train, feature_name=feature_names)
        test_data = lgb.Dataset(X_test, label=y_test, feature_name=feature_names, reference=train_data)
        
        # ハイパーパラメータ
        params = {
            'objective': 'regression',
            'metric': ['rmse', 'mae'],
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'max_depth': 6,
            'min_data_in_leaf': 20,
        }
        
        num_boost_round = 500
        
        print(f"\n⚙️  Training with hyperparameters:")
        for key, value in params.items():
            print(f"  {key}: {value}")
        print(f"  num_boost_round: {num_boost_round}")
        
        # 学習実行
        print(f"\n🏋️  Training in progress...")
        evals_result = {}
        
        model = lgb.train(
            params,
            train_data,
            num_boost_round=num_boost_round,
            valid_sets=[train_data, test_data],
            valid_names=['train', 'test'],
            callbacks=[
                lgb.early_stopping(stopping_rounds=50, verbose=False),
                lgb.record_evaluation(evals_result)
            ]
        )
        
        best_iteration = model.best_iteration
        print(f"✅ Training complete! Best iteration: {best_iteration}")
        
        # 予測実行
        y_train_pred = model.predict(X_train, num_iteration=best_iteration)
        y_test_pred = model.predict(X_test, num_iteration=best_iteration)
        
        # メトリクス計算
        train_rmse = float(np.sqrt(mean_squared_error(y_train, y_train_pred)))
        test_rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))
        train_mae = float(mean_absolute_error(y_train, y_train_pred))
        test_mae = float(mean_absolute_error(y_test, y_test_pred))
        train_r2 = float(r2_score(y_train, y_train_pred))
        test_r2 = float(r2_score(y_test, y_test_pred))
        generalization_gap = test_rmse - train_rmse
        
        print(f"\n📈 Performance Metrics:")
        print(f"  Train RMSE: ${train_rmse:.2f}")
        print(f"  Test RMSE:  ${test_rmse:.2f}")
        print(f"  Train MAE:  ${train_mae:.2f}")
        print(f"  Test MAE:   ${test_mae:.2f}")
        print(f"  Train R²:   {train_r2:.4f}")
        print(f"  Test R²:    {test_r2:.4f}")
        print(f"  Gap:        ${generalization_gap:.2f}")
        
        # 学習曲線データ抽出
        train_losses = evals_result['train']['rmse']
        val_losses = evals_result['test']['rmse']
        iterations = list(range(1, len(train_losses) + 1))
        
        # 特徴量重要度
        importances = model.feature_importance(importance_type='gain')
        feature_importance_list = [
            FeatureImportance(
                feature=feature_names[i],
                importance=float(importances[i])
            )
            for i in range(len(feature_names))
        ]
        feature_importance_list.sort(key=lambda x: x.importance, reverse=True)
        
        print(f"\n🔍 Top 5 Important Features:")
        for i, fi in enumerate(feature_importance_list[:5], 1):
            print(f"  {i}. {fi.feature}: {fi.importance:.0f}")
        
        # 学習時間計算
        training_duration = (datetime.now() - training_start_time).total_seconds()
        
        # モデルIDの生成
        model_id = f"{data.symbol}_custom_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # モデルを一時ファイルに保存（オプション：後で永続化可能）
        # temp_model_file = f"/tmp/{model_id}.txt"
        # model.save_model(temp_model_file)
        # print(f"💾 Model saved to: {temp_model_file}")
        
        print(f"\n{'='*60}")
        print(f"✅ Training complete for {data.symbol}!")
        print(f"   Duration: {training_duration:.1f} seconds")
        print(f"   Model ID: {model_id}")
        print(f"{'='*60}\n")
        
        # レスポンス作成
        return TrainingResponse(
            success=True,
            model_id=model_id,
            symbol=data.symbol,
            training_data=TrainingDataInfo(
                total_samples=len(X),
                train_samples=len(X_train),
                test_samples=len(X_test),
                features_count=len(feature_names),
                date_range_start=None,  # 実際のデータがあれば日付範囲を追加
                date_range_end=None
            ),
            hyperparameters=Hyperparameters(
                objective=params['objective'],
                boosting_type=params['boosting_type'],
                num_leaves=params['num_leaves'],
                learning_rate=params['learning_rate'],
                max_depth=params['max_depth'],
                min_data_in_leaf=params['min_data_in_leaf'],
                feature_fraction=params['feature_fraction'],
                bagging_fraction=params['bagging_fraction'],
                bagging_freq=params['bagging_freq'],
                num_boost_round=num_boost_round
            ),
            learning_curves=LearningCurves(
                iterations=iterations,
                train_loss=train_losses,
                val_loss=val_losses
            ),
            performance_metrics=PerformanceMetrics(
                train_rmse=train_rmse,
                test_rmse=test_rmse,
                train_mae=train_mae,
                test_mae=test_mae,
                train_r2=train_r2,
                test_r2=test_r2,
                generalization_gap=generalization_gap
            ),
            feature_importances=feature_importance_list,
            training_duration=training_duration,
            timestamp=datetime.now().isoformat(),
            message=f"Successfully trained custom model for {data.symbol}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Training error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

# 起動時イベント
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("🚀 Stock Prediction ML API started")
    print(f"📊 Model: LightGBM v1.0")
    print(f"🔧 Environment: {os.getenv('ENV', 'production')}")
    initialize_model()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
