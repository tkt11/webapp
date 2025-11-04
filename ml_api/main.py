"""
Stock Price Prediction ML API
FastAPI + LightGBM for stock price forecasting
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import lightgbm as lgb
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import hashlib
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock ML API", version="2.0.0")

# CORS configuration for Cloudflare Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Cloudflare Pages domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global cache for trained models
MODEL_CACHE = {}
MAX_CACHE_SIZE = 100
REQUEST_COUNT = 0


class MLPredictionRequest(BaseModel):
    symbol: str
    prices: List[float]
    rsi: Optional[float] = None
    macd: Optional[float] = None
    sentiment_score: Optional[float] = None
    pe_ratio: Optional[float] = None
    roe: Optional[float] = None
    volume: Optional[float] = None
    enable_backfit: Optional[bool] = False


class MLPredictionResponse(BaseModel):
    symbol: str
    predicted_price: float
    confidence: float
    change_percent: float
    model: str
    features_used: int
    timestamp: str
    feature_importances: Optional[List[dict]] = None
    model_metrics: Optional[dict] = None
    training_info: Optional[dict] = None
    ml_training: Optional[dict] = None


class MLTrainingResponse(BaseModel):
    symbol: str
    model_id: str
    training_duration: float
    accuracy_metrics: dict
    feature_importance: List[dict]
    backfit_validation: Optional[dict] = None


def create_features(prices: List[float], rsi: float = None, macd: float = None, 
                   sentiment: float = None, pe_ratio: float = None, roe: float = None) -> pd.DataFrame:
    """Create feature matrix from price history and indicators"""
    
    prices_array = np.array(prices)
    
    # Technical features
    features = {
        'close': prices_array[-1],
        'sma_5': np.mean(prices_array[-5:]) if len(prices_array) >= 5 else prices_array[-1],
        'sma_20': np.mean(prices_array[-20:]) if len(prices_array) >= 20 else prices_array[-1],
        'sma_50': np.mean(prices_array[-50:]) if len(prices_array) >= 50 else prices_array[-1],
        'volatility': np.std(prices_array[-30:]) if len(prices_array) >= 30 else 0,
        'momentum_7d': ((prices_array[-1] - prices_array[-7]) / prices_array[-7] * 100) if len(prices_array) >= 7 else 0,
        'momentum_14d': ((prices_array[-1] - prices_array[-14]) / prices_array[-14] * 100) if len(prices_array) >= 14 else 0,
        'price_range_30d': (np.max(prices_array[-30:]) - np.min(prices_array[-30:])) if len(prices_array) >= 30 else 0,
    }
    
    # Add optional indicators
    if rsi is not None:
        features['rsi'] = rsi
    if macd is not None:
        features['macd'] = macd
    if sentiment is not None:
        features['sentiment_score'] = sentiment
    if pe_ratio is not None:
        features['pe_ratio'] = pe_ratio
    if roe is not None:
        features['roe'] = roe
    
    return pd.DataFrame([features])


def prepare_training_data(prices: List[float], lookback: int = 30, horizon: int = 1) -> tuple:
    """Prepare training data with sliding window approach"""
    
    prices_array = np.array(prices)
    X, y = [], []
    
    for i in range(lookback, len(prices_array) - horizon):
        # Features: price statistics from lookback window
        window = prices_array[i-lookback:i]
        features = [
            window[-1],  # current price
            np.mean(window[-5:]),  # SMA5
            np.mean(window[-10:]),  # SMA10
            np.mean(window[-20:]) if len(window) >= 20 else window[-1],  # SMA20
            np.std(window),  # volatility
            (window[-1] - window[-7]) / window[-7] * 100 if len(window) >= 7 else 0,  # momentum 7d
            (window[-1] - window[0]) / window[0] * 100,  # momentum full window
            (np.max(window) - np.min(window)) / np.min(window) * 100,  # price range
        ]
        X.append(features)
        
        # Target: future price (horizon days ahead)
        y.append(prices_array[i + horizon])
    
    return np.array(X), np.array(y)


def train_model(symbol: str, prices: List[float], enable_backfit: bool = False) -> dict:
    """Train LightGBM model for stock prediction"""
    
    start_time = time.time()
    
    logger.info(f"Training model for {symbol} with {len(prices)} price points")
    
    # Prepare training data
    X, y = prepare_training_data(prices, lookback=30, horizon=1)
    
    if len(X) < 50:
        raise ValueError(f"Insufficient data for training. Need at least 80 days, got {len(prices)}")
    
    # Backfit validation: exclude last 30 days from training
    if enable_backfit:
        # Split: exclude last 30 for validation
        train_size = len(X) - 30
        X_train, y_train = X[:train_size], y[:train_size]
        X_val, y_val = X[train_size:], y[train_size:]
        logger.info(f"Backfit mode: Training on {len(X_train)} samples, validating on {len(X_val)} samples")
    else:
        # Normal mode: use 80% for training, 20% for validation
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    # Train LightGBM model
    params = {
        'objective': 'regression',
        'metric': 'rmse',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.9,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': -1
    }
    
    train_data = lgb.Dataset(X_train_scaled, label=y_train)
    val_data = lgb.Dataset(X_val_scaled, label=y_val, reference=train_data)
    
    model = lgb.train(
        params,
        train_data,
        num_boost_round=100,
        valid_sets=[val_data],
        callbacks=[lgb.early_stopping(stopping_rounds=10), lgb.log_evaluation(period=0)]
    )
    
    # Calculate metrics
    y_pred = model.predict(X_val_scaled)
    mae = np.mean(np.abs(y_val - y_pred))
    rmse = np.sqrt(np.mean((y_val - y_pred) ** 2))
    
    # Calculate R2 score
    ss_res = np.sum((y_val - y_pred) ** 2)
    ss_tot = np.sum((y_val - np.mean(y_val)) ** 2)
    r2_score = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    training_duration = time.time() - start_time
    
    # Feature importance
    feature_names = ['close', 'sma_5', 'sma_10', 'sma_20', 'volatility', 'momentum_7d', 'momentum_full', 'price_range']
    feature_importance = [
        {"feature": name, "importance": float(imp)}
        for name, imp in zip(feature_names, model.feature_importance(importance_type='gain'))
    ]
    feature_importance.sort(key=lambda x: x['importance'], reverse=True)
    
    # Generate model ID
    model_id = hashlib.md5(f"{symbol}_{int(time.time())}".encode()).hexdigest()[:12]
    
    # Store in cache
    MODEL_CACHE[symbol] = {
        'model': model,
        'scaler': scaler,
        'model_id': model_id,
        'trained_at': datetime.now().isoformat(),
        'training_samples': len(X_train)
    }
    
    # Backfit validation results
    backfit_validation = None
    if enable_backfit:
        # Calculate accuracy on validation set (last 30 days)
        predictions = []
        actuals = y_val.tolist()
        
        for i in range(len(X_val)):
            pred = model.predict(X_val_scaled[i:i+1])[0]
            predictions.append(float(pred))
        
        # Calculate prediction accuracy
        correct_direction = sum(
            1 for i in range(1, len(predictions))
            if (predictions[i] > actuals[i-1]) == (actuals[i] > actuals[i-1])
        )
        direction_accuracy = correct_direction / (len(predictions) - 1) * 100 if len(predictions) > 1 else 0
        
        backfit_validation = {
            'validation_days': len(X_val),
            'mae': float(mae),
            'rmse': float(rmse),
            'r2_score': float(r2_score),
            'direction_accuracy': float(direction_accuracy),
            'predictions': predictions[:10],  # First 10 predictions for visualization
            'actuals': actuals[:10]
        }
    
    # Generate future predictions (30 days)
    future_predictions = None
    try:
        last_window = X[-1:] if len(X) > 0 else X_train[-1:]
        future_prices = []
        future_dates = []
        
        current_window = scaler.transform(last_window)[0]
        base_date = datetime.now()
        
        for i in range(30):
            # Predict next price
            next_price = model.predict([current_window])[0]
            future_prices.append(float(next_price))
            future_dates.append((base_date + timedelta(days=i+1)).strftime('%Y-%m-%d'))
            
            # Update window for next prediction (shift left, add new prediction)
            current_window = np.roll(current_window, -1)
            current_window[-1] = next_price
        
        # Calculate confidence bounds (simple ±2 std approach)
        pred_std = np.std(future_prices)
        lower_bound = [float(p - 2 * pred_std) for p in future_prices]
        upper_bound = [float(p + 2 * pred_std) for p in future_prices]
        
        future_predictions = {
            'dates': future_dates,
            'predictions': future_prices,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound
        }
        
        logger.info(f"Generated 30-day future predictions for {symbol}")
    except Exception as e:
        logger.error(f"Failed to generate future predictions: {str(e)}")
    
    # Generate backfit predictions (past 30 days)
    backfit_predictions = None
    if enable_backfit and len(X_val) >= 30:
        try:
            backfit_dates = [(datetime.now() - timedelta(days=30-i)).strftime('%Y-%m-%d') for i in range(30)]
            backfit_preds = [float(model.predict(X_val_scaled[i:i+1])[0]) for i in range(min(30, len(X_val)))]
            backfit_actuals = y_val[:30].tolist()
            
            # Calculate direction accuracy
            correct_direction = sum(
                1 for i in range(1, len(backfit_preds))
                if (backfit_preds[i] > backfit_actuals[i-1]) == (backfit_actuals[i] > backfit_actuals[i-1])
            )
            direction_accuracy = (correct_direction / (len(backfit_preds) - 1) * 100) if len(backfit_preds) > 1 else 0
            
            backfit_predictions = {
                'dates': backfit_dates[:len(backfit_preds)],
                'predictions': backfit_preds,
                'actual_prices': backfit_actuals,
                'rmse': float(rmse),
                'mae': float(mae),
                'direction_accuracy': float(direction_accuracy)
            }
            
            logger.info(f"Generated backfit predictions for {symbol}, direction accuracy: {direction_accuracy:.1f}%")
        except Exception as e:
            logger.error(f"Failed to generate backfit predictions: {str(e)}")
    
    result = {
        'symbol': symbol,
        'model_id': model_id,
        'training_duration': training_duration,
        'accuracy_metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2_score': float(r2_score),
            'training_samples': len(X_train),
            'validation_samples': len(X_val)
        },
        'feature_importance': feature_importance,
        'backfit_validation': backfit_validation,
        'future_predictions': future_predictions,
        'backfit_predictions': backfit_predictions
    }
    
    logger.info(f"Model trained successfully: {model_id}, MAE: {mae:.2f}, R2: {r2_score:.3f}")
    
    return result


@app.get("/")
async def root():
    return {
        "service": "Stock ML API",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "predict": "/predict (POST)",
            "train": "/train (POST)"
        }
    }


@app.get("/health")
async def health():
    global REQUEST_COUNT
    return {
        "status": "healthy",
        "model_loaded": len(MODEL_CACHE) > 0,
        "cached_models": len(MODEL_CACHE),
        "requests_today": REQUEST_COUNT,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=MLPredictionResponse)
async def predict(request: MLPredictionRequest):
    """Predict stock price using trained or generic model"""
    
    global REQUEST_COUNT
    REQUEST_COUNT += 1
    
    try:
        logger.info(f"Prediction request for {request.symbol} with {len(request.prices)} prices")
        
        # Check if we have a cached model for this symbol
        cached_model = MODEL_CACHE.get(request.symbol)
        use_trained_model = cached_model is not None
        
        if use_trained_model:
            logger.info(f"Using cached trained model for {request.symbol}")
            model = cached_model['model']
            scaler = cached_model['scaler']
            model_id = cached_model['model_id']
        else:
            logger.info(f"No cached model for {request.symbol}, training generic model")
            # Train a quick model on provided data
            train_result = train_model(request.symbol, request.prices, enable_backfit=False)
            cached_model = MODEL_CACHE.get(request.symbol)
            model = cached_model['model']
            scaler = cached_model['scaler']
            model_id = cached_model['model_id']
        
        # Create features for prediction
        features_df = create_features(
            request.prices,
            request.rsi,
            request.macd,
            request.sentiment_score,
            request.pe_ratio,
            request.roe
        )
        
        # Use only the features that were used in training
        feature_subset = features_df[['close', 'sma_5', 'sma_20', 'sma_50', 'volatility', 
                                      'momentum_7d', 'momentum_14d', 'price_range_30d']].values
        
        # Scale and predict
        features_scaled = scaler.transform(feature_subset)
        predicted_price = float(model.predict(features_scaled)[0])
        
        current_price = request.prices[-1]
        change_percent = ((predicted_price - current_price) / current_price) * 100
        
        # Calculate confidence based on model performance
        if use_trained_model:
            # Higher confidence for trained models
            confidence = min(0.85, 0.70 + abs(change_percent) / 100)
        else:
            # Lower confidence for generic models
            confidence = min(0.75, 0.60 + abs(change_percent) / 100)
        
        # Feature importance
        feature_names = ['close', 'sma_5', 'sma_20', 'sma_50', 'volatility', 'momentum_7d', 'momentum_14d', 'price_range_30d']
        feature_importances = [
            {"feature": name, "importance": float(imp)}
            for name, imp in zip(feature_names, model.feature_importance(importance_type='gain'))
        ]
        feature_importances.sort(key=lambda x: x['importance'], reverse=True)
        
        response = MLPredictionResponse(
            symbol=request.symbol,
            predicted_price=predicted_price,
            confidence=confidence,
            change_percent=change_percent,
            model="LightGBM-Trained" if use_trained_model else "LightGBM-Generic",
            features_used=len(feature_subset[0]),
            timestamp=datetime.now().isoformat(),
            feature_importances=feature_importances[:10],
            model_metrics={
                "model_id": model_id,
                "trained_at": cached_model['trained_at'],
                "training_samples": cached_model['training_samples']
            },
            training_info={
                "data_start_date": (datetime.now().date() - pd.Timedelta(days=len(request.prices))).isoformat(),
                "data_end_date": datetime.now().date().isoformat(),
                "training_days": len(request.prices),
                "last_trained": cached_model['trained_at']
            }
        )
        
        logger.info(f"Prediction complete: {predicted_price:.2f} ({change_percent:+.2f}%)")
        
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/train", response_model=MLTrainingResponse)
async def train(request: MLPredictionRequest):
    """Train a custom model for specific symbol"""
    
    global REQUEST_COUNT
    REQUEST_COUNT += 1
    
    try:
        logger.info(f"Training request for {request.symbol} (backfit: {request.enable_backfit})")
        
        if len(request.prices) < 80:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data. Need at least 80 days, got {len(request.prices)}"
            )
        
        result = train_model(request.symbol, request.prices, request.enable_backfit)
        
        return MLTrainingResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Training error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.delete("/cache/{symbol}")
async def clear_cache(symbol: str):
    """Clear cached model for symbol"""
    if symbol in MODEL_CACHE:
        del MODEL_CACHE[symbol]
        return {"message": f"Cache cleared for {symbol}"}
    return {"message": f"No cache found for {symbol}"}


@app.delete("/cache")
async def clear_all_cache():
    """Clear all cached models"""
    MODEL_CACHE.clear()
    return {"message": "All cache cleared"}


class TechnicalAnalysisRequest(BaseModel):
    """テクニカル分析リクエスト"""
    symbol: str
    alpha_vantage_api_key: str
    mode: str = "both"  # "simple", "advanced", or "both"
    timeframe: str = "medium"  # "short" (1-7日, 5分-1時間足) or "medium" (1週-3ヶ月, 日足)
    interval: str = "60min"  # "5min", "15min", "30min", "60min" (短期のみ有効)


class TechnicalAnalysisResponse(BaseModel):
    """テクニカル分析レスポンス"""
    symbol: str
    timestamp: str
    system_a: Optional[dict] = None  # シンプル評価
    system_b: Optional[dict] = None  # 高度な複合評価
    execution_time: float


@app.post("/api/technical-analysis", response_model=TechnicalAnalysisResponse)
async def analyze_technical_indicators(request: TechnicalAnalysisRequest):
    """
    テクニカル分析API
    
    システムA: シンプル評価（5指標のみ）
    システムB: 高度な複合評価（全指標 + 多層スコアリング）
    """
    start_time = time.time()
    
    try:
        logger.info(f"Starting technical analysis for {request.symbol} (mode: {request.mode})")
        
        # テクニカル指標モジュールをインポート
        from alpha_vantage_client import fetch_technical_indicators, fetch_intraday_technical_indicators
        from technical_scoring import SystemA_SimpleScoring
        from technical_scoring_advanced import SystemB_AdvancedScoring
        from technical_scoring_short import SystemB_ShortTermScoring
        
        # Alpha Vantageから全テクニカル指標を取得
        if request.timeframe == "short":
            logger.info(f"Fetching intraday data for {request.symbol} (interval: {request.interval})")
            indicators = await fetch_intraday_technical_indicators(request.symbol, request.alpha_vantage_api_key, request.interval)
        else:
            logger.info(f"Fetching daily data for {request.symbol}")
            indicators = await fetch_technical_indicators(request.symbol, request.alpha_vantage_api_key)
        
        # データチェック
        if not indicators or indicators.get('prices', pd.DataFrame()).empty:
            raise HTTPException(status_code=400, detail=f"No data available for symbol {request.symbol}")
        
        result = {
            "symbol": request.symbol,
            "timestamp": datetime.now().isoformat(),
            "system_a": None,
            "system_b": None,
            "execution_time": 0.0
        }
        
        # システムA: シンプル評価
        if request.mode in ["simple", "both"]:
            logger.info("Calculating System A (Simple) score...")
            score_a = SystemA_SimpleScoring.calculate(indicators)
            
            result["system_a"] = {
                "name": "シンプル評価（5指標）",
                "total_score": score_a.total_score,
                "signal_type": score_a.signal_type.value,
                "confidence": score_a.confidence,
                "category_scores": score_a.category_scores,
                "explanations": [
                    {
                        "indicator": exp.indicator,
                        "signal_type": exp.signal_type.value,
                        "current_value": exp.current_value,
                        "score": exp.score,
                        "explanation": exp.explanation,
                        "importance": exp.importance
                    }
                    for exp in score_a.explanations
                ]
            }
        
        # システムB: 高度な複合評価
        if request.mode in ["advanced", "both"]:
            if request.timeframe == "short":
                logger.info("Calculating System B-Short (Short-term) score...")
                score_b = SystemB_ShortTermScoring.calculate(indicators)
            else:
                logger.info("Calculating System B-Medium (Advanced) score...")
                score_b = SystemB_AdvancedScoring.calculate(indicators)
            
            # Calculate logic details
            try:
                if request.timeframe == "short":
                    weights = SystemB_ShortTermScoring._get_dynamic_weights(score_b.market_regime)
                    correlation_adj = SystemB_ShortTermScoring._calculate_correlation_adjustment(score_b.explanations)
                else:
                    weights = SystemB_AdvancedScoring._get_dynamic_weights(score_b.market_regime)
                    correlation_adj = SystemB_AdvancedScoring._calculate_correlation_adjustment(score_b.explanations)
            except Exception as e:
                logger.error(f"Failed to calculate logic details: {e}")
                if request.timeframe == "short":
                    weights = {'trend': 0.20, 'momentum': 0.55, 'volatility': 0.15, 'volume': 0.10}
                else:
                    weights = {'trend': 0.40, 'momentum': 0.30, 'volatility': 0.20, 'volume': 0.10}
                correlation_adj = 1.0
            
            system_b_name = "短期トレード専用（5分-1時間足）" if request.timeframe == "short" else "高度な複合評価（日足）"
            result["system_b"] = {
                "name": system_b_name,
                "timeframe": request.timeframe,
                "total_score": score_b.total_score,
                "signal_type": score_b.signal_type.value,
                "confidence": score_b.confidence,
                "market_regime": score_b.market_regime.value,
                "risk_score": score_b.risk_score,
                "category_scores": score_b.category_scores,
                "calculation_logic": {
                    "step1_category_scores": {
                        "trend": score_b.category_scores.get('trend', 50.0),
                        "momentum": score_b.category_scores.get('momentum', 50.0),
                        "volatility": score_b.category_scores.get('volatility', 50.0),
                        "volume": score_b.category_scores.get('volume', 50.0)
                    },
                    "step2_market_regime": score_b.market_regime.value,
                    "step3_dynamic_weights": {
                        "trend": f"{weights['trend']*100:.0f}%",
                        "momentum": f"{weights['momentum']*100:.0f}%",
                        "volatility": f"{weights['volatility']*100:.0f}%",
                        "volume": f"{weights['volume']*100:.0f}%"
                    },
                    "step4_weighted_score": round(
                        score_b.category_scores.get('trend', 50) * weights['trend'] +
                        score_b.category_scores.get('momentum', 50) * weights['momentum'] +
                        score_b.category_scores.get('volatility', 50) * weights['volatility'] +
                        score_b.category_scores.get('volume', 50) * weights['volume'],
                        2
                    ),
                    "step5_correlation_adjustment": f"{correlation_adj:.2f}x",
                    "step6_pattern_bonus": "パターンボーナス適用済み",
                    "step7_final_score": score_b.total_score
                },
                "explanations": [
                    {
                        "indicator": exp.indicator,
                        "signal_type": exp.signal_type.value,
                        "current_value": exp.current_value,
                        "score": exp.score,
                        "explanation": exp.explanation,
                        "importance": exp.importance
                    }
                    for exp in score_b.explanations
                ]
            }
        
        execution_time = time.time() - start_time
        result["execution_time"] = round(execution_time, 2)
        
        logger.info(f"Technical analysis completed in {execution_time:.2f}s")
        
        return result
        
    except Exception as e:
        logger.error(f"Technical analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Technical analysis failed: {str(e)}")


class TechnicalMLRequest(BaseModel):
    """テクニカルML予測リクエスト（システムC）"""
    symbol: str
    alpha_vantage_api_key: str
    enable_backfit: bool = False
    force_retrain: bool = False


class TechnicalMLResponse(BaseModel):
    """テクニカルML予測レスポンス"""
    symbol: str
    timestamp: str
    training: dict
    future_predictions: dict
    explanations: List[dict]
    feature_count: int
    sample_count: int
    execution_time: float


@app.post("/api/technical-ml-predict", response_model=TechnicalMLResponse)
async def predict_with_technical_ml(request: TechnicalMLRequest):
    """
    テクニカル指標特化型ML予測API（システムC）
    
    125特徴量 + LightGBM for stock price prediction
    """
    start_time = time.time()
    
    try:
        logger.info(f"Starting technical ML prediction for {request.symbol}")
        
        # モジュールをインポート
        from alpha_vantage_client import fetch_technical_indicators
        from technical_ml_model import get_or_train_model
        
        # Alpha Vantageから全テクニカル指標を取得
        indicators = await fetch_technical_indicators(request.symbol, request.alpha_vantage_api_key)
        
        # データチェック
        if not indicators or indicators.get('prices', pd.DataFrame()).empty:
            raise HTTPException(status_code=400, detail=f"No data available for symbol {request.symbol}")
        
        # モデルを取得または学習
        model, result = get_or_train_model(
            indicators=indicators,
            symbol=request.symbol,
            enable_backfit=request.enable_backfit,
            force_retrain=request.force_retrain
        )
        
        execution_time = time.time() - start_time
        result['execution_time'] = round(execution_time, 2)
        result['timestamp'] = datetime.now().isoformat()
        
        logger.info(f"Technical ML prediction completed in {execution_time:.2f}s")
        
        return result
        
    except Exception as e:
        logger.error(f"Technical ML prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Technical ML prediction failed: {str(e)}")


@app.get("/api/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "ok",
        "service": "Stock ML API",
        "version": "2.1.0",
        "endpoints": {
            "ml_prediction": "/api/predict",
            "ml_training": "/api/train",
            "technical_analysis": "/api/technical-analysis",
            "technical_ml_predict": "/api/technical-ml-predict"
        },
        "cache_size": len(MODEL_CACHE),
        "requests_processed": REQUEST_COUNT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
