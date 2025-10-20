"""
LightGBM Model Training Script
Train stock prediction model using collected historical data
"""

import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import json
import os
from datetime import datetime

def load_training_data(symbol, data_dir='data'):
    """Load collected training data"""
    filename = f"{data_dir}/{symbol}_training_data.csv"
    
    if not os.path.exists(filename):
        raise FileNotFoundError(f"Training data not found: {filename}")
    
    df = pd.read_csv(filename)
    print(f"📊 Loaded {len(df)} rows for {symbol}")
    
    return df

def prepare_features(df):
    """
    Prepare feature matrix and target vector
    
    Args:
        df: DataFrame with all indicators
    
    Returns:
        X: Feature matrix
        y: Target vector
        feature_names: List of feature names
    """
    # Select features for training
    feature_columns = [
        # Price-based features
        'close', 'open', 'high', 'low', 'volume',
        
        # Technical indicators
        'sma_5', 'sma_10', 'sma_20', 'sma_50',
        'ema_12', 'ema_26',
        'macd', 'macd_signal', 'macd_diff',
        'rsi',
        'bb_middle', 'bb_upper', 'bb_lower', 'bb_width',
        'volatility', 'volatility_ratio',
        'volume_sma_20', 'volume_ratio',
        'momentum_5', 'momentum_10', 'momentum_20',
        
        # Fundamental indicators (if available)
        # 'pe_ratio', 'roe', 'pb_ratio', 'market_cap'
    ]
    
    # Filter to only available columns
    available_features = [col for col in feature_columns if col in df.columns]
    
    # Add fundamental features if available and not mostly NaN
    fundamental_features = ['pe_ratio', 'roe', 'pb_ratio']
    for col in fundamental_features:
        if col in df.columns and df[col].notna().sum() > len(df) * 0.5:
            available_features.append(col)
    
    print(f"\n📋 Using {len(available_features)} features:")
    for i, feature in enumerate(available_features, 1):
        print(f"  {i:2d}. {feature}")
    
    # Create feature matrix
    X = df[available_features].copy()
    y = df['target'].copy()
    
    # Forward-fill missing values in fundamentals
    X = X.fillna(method='ffill').fillna(method='bfill')
    
    # Remove rows with NaN in target
    valid_idx = ~y.isna()
    X = X[valid_idx]
    y = y[valid_idx]
    
    print(f"\n✅ Prepared {len(X)} samples with {len(available_features)} features")
    
    return X, y, available_features

def train_lightgbm_model(X, y, feature_names):
    """
    Train LightGBM model with time series cross-validation
    
    Args:
        X: Feature matrix
        y: Target vector
        feature_names: List of feature names
    
    Returns:
        model: Trained LightGBM model
        metrics: Training metrics
    """
    print("\n" + "=" * 60)
    print("🤖 Training LightGBM Model")
    print("=" * 60)
    
    # Time series split (80% train, 20% test)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    print(f"\n📊 Dataset split:")
    print(f"  Training set: {len(X_train)} samples")
    print(f"  Test set:     {len(X_test)} samples")
    
    # Create LightGBM datasets
    train_data = lgb.Dataset(X_train, label=y_train, feature_name=feature_names)
    test_data = lgb.Dataset(X_test, label=y_test, feature_name=feature_names, reference=train_data)
    
    # LightGBM parameters
    params = {
        'objective': 'regression',
        'metric': ['rmse', 'mae'],
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.9,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': 0,
        'max_depth': 6,
        'min_data_in_leaf': 20,
    }
    
    print(f"\n⚙️  Training parameters:")
    for key, value in params.items():
        print(f"  {key}: {value}")
    
    # Train model
    print(f"\n🏋️  Training in progress...")
    
    evals_result = {}
    model = lgb.train(
        params,
        train_data,
        num_boost_round=1000,
        valid_sets=[train_data, test_data],
        valid_names=['train', 'test'],
        callbacks=[
            lgb.early_stopping(stopping_rounds=50),
            lgb.log_evaluation(period=100)
        ],
        evals_result=evals_result
    )
    
    print(f"\n✅ Training complete! Best iteration: {model.best_iteration}")
    
    # Evaluate model
    y_train_pred = model.predict(X_train, num_iteration=model.best_iteration)
    y_test_pred = model.predict(X_test, num_iteration=model.best_iteration)
    
    # Calculate metrics
    train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    train_mae = mean_absolute_error(y_train, y_train_pred)
    test_mae = mean_absolute_error(y_test, y_test_pred)
    train_r2 = r2_score(y_train, y_train_pred)
    test_r2 = r2_score(y_test, y_test_pred)
    
    metrics = {
        'train_rmse': float(train_rmse),
        'test_rmse': float(test_rmse),
        'train_mae': float(train_mae),
        'test_mae': float(test_mae),
        'train_r2': float(train_r2),
        'test_r2': float(test_r2),
        'best_iteration': model.best_iteration
    }
    
    print(f"\n📈 Model Performance:")
    print(f"  Train RMSE: ${train_rmse:.2f}")
    print(f"  Test RMSE:  ${test_rmse:.2f}")
    print(f"  Train MAE:  ${train_mae:.2f}")
    print(f"  Test MAE:   ${test_mae:.2f}")
    print(f"  Train R²:   {train_r2:.4f}")
    print(f"  Test R²:    {test_r2:.4f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importance(importance_type='gain')
    }).sort_values('importance', ascending=False)
    
    print(f"\n🔍 Top 10 Important Features:")
    for idx, row in feature_importance.head(10).iterrows():
        print(f"  {row['feature']:20s}: {row['importance']:8.0f}")
    
    return model, metrics, feature_importance

def save_model(model, symbol, metrics, feature_importance, output_dir='models'):
    """Save trained model and metadata"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save model
    model_file = f"{output_dir}/{symbol}_model.txt"
    model.save_model(model_file)
    print(f"\n💾 Model saved to: {model_file}")
    
    # Save metrics
    metrics_file = f"{output_dir}/{symbol}_metrics.json"
    with open(metrics_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"📊 Metrics saved to: {metrics_file}")
    
    # Save feature importance
    importance_file = f"{output_dir}/{symbol}_feature_importance.csv"
    feature_importance.to_csv(importance_file, index=False)
    print(f"🔍 Feature importance saved to: {importance_file}")
    
    # Create deployment package info
    deployment_info = {
        'symbol': symbol,
        'model_file': model_file,
        'trained_at': datetime.now().isoformat(),
        'metrics': metrics,
        'features': list(feature_importance['feature']),
        'num_features': len(feature_importance),
        'deployment_instructions': {
            '1': f'Copy {model_file} to ml_api/ directory',
            '2': 'Update main.py to load model: lgb.Booster(model_file="model.txt")',
            '3': 'Redeploy to Cloud Run'
        }
    }
    
    deployment_file = f"{output_dir}/{symbol}_deployment.json"
    with open(deployment_file, 'w') as f:
        json.dump(deployment_info, f, indent=2)
    print(f"📦 Deployment info saved to: {deployment_file}")
    
    return model_file

def main():
    """Main execution"""
    print("=" * 60)
    print("🤖 LightGBM Stock Prediction Model Training")
    print("=" * 60)
    
    # Symbols to train models for
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
    
    for symbol in symbols:
        print(f"\n{'=' * 60}")
        print(f"Training model for: {symbol}")
        print(f"{'=' * 60}")
        
        try:
            # Load data
            df = load_training_data(symbol)
            
            # Prepare features
            X, y, feature_names = prepare_features(df)
            
            # Train model
            model, metrics, feature_importance = train_lightgbm_model(X, y, feature_names)
            
            # Save model
            model_file = save_model(model, symbol, metrics, feature_importance)
            
            print(f"\n✅ Model training complete for {symbol}!")
            
        except FileNotFoundError as e:
            print(f"\n⚠️  Skipping {symbol}: {e}")
            print(f"   Run collect_data.py first to gather training data")
            continue
        except Exception as e:
            print(f"\n❌ Error training model for {symbol}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "=" * 60)
    print("✅ All model training complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Review trained models in the 'models' directory")
    print("  2. Copy model files to ml_api/ directory")
    print("  3. Update main.py to load the trained model")
    print("  4. Redeploy to Cloud Run")
    print("\nDeployment command:")
    print("  cp models/AAPL_model.txt ../model.txt")
    print("  # Update main.py: model = lgb.Booster(model_file='model.txt')")
    print("  # git commit & push to trigger Cloud Run rebuild")

if __name__ == '__main__':
    main()
