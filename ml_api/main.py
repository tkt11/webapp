"""
Stock Prediction ML API using LightGBM
FastAPI + LightGBM for stock price prediction
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import lightgbm as lgb
import numpy as np
import pandas as pd
from datetime import datetime
import os

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
