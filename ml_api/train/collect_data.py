"""
Data collection script for stock prediction model training
Fetches historical data from Finnhub API
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import os
import json

# Finnhub API configuration
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY', 'YOUR_API_KEY_HERE')
BASE_URL = 'https://finnhub.io/api/v1'

def fetch_stock_candles(symbol, from_date, to_date):
    """
    Fetch historical stock price data (OHLCV)
    
    Args:
        symbol: Stock ticker (e.g., 'AAPL')
        from_date: Start date (Unix timestamp)
        to_date: End date (Unix timestamp)
    
    Returns:
        DataFrame with OHLCV data
    """
    url = f"{BASE_URL}/stock/candle"
    params = {
        'symbol': symbol,
        'resolution': 'D',  # Daily data
        'from': from_date,
        'to': to_date,
        'token': FINNHUB_API_KEY
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data['s'] != 'ok':
        raise Exception(f"API Error: {data}")
    
    df = pd.DataFrame({
        'timestamp': data['t'],
        'open': data['o'],
        'high': data['h'],
        'low': data['l'],
        'close': data['c'],
        'volume': data['v']
    })
    
    df['date'] = pd.to_datetime(df['timestamp'], unit='s')
    return df

def fetch_company_profile(symbol):
    """Fetch company fundamental data"""
    url = f"{BASE_URL}/stock/profile2"
    params = {
        'symbol': symbol,
        'token': FINNHUB_API_KEY
    }
    
    response = requests.get(url, params=params)
    return response.json()

def fetch_company_metrics(symbol):
    """Fetch company financial metrics"""
    url = f"{BASE_URL}/stock/metric"
    params = {
        'symbol': symbol,
        'metric': 'all',
        'token': FINNHUB_API_KEY
    }
    
    response = requests.get(url, params=params)
    return response.json()

def calculate_technical_indicators(df):
    """
    Calculate technical indicators
    
    Args:
        df: DataFrame with OHLCV data
    
    Returns:
        DataFrame with technical indicators added
    """
    # Simple Moving Averages
    df['sma_5'] = df['close'].rolling(window=5).mean()
    df['sma_10'] = df['close'].rolling(window=10).mean()
    df['sma_20'] = df['close'].rolling(window=20).mean()
    df['sma_50'] = df['close'].rolling(window=50).mean()
    
    # Exponential Moving Averages
    df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
    df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
    
    # MACD
    df['macd'] = df['ema_12'] - df['ema_26']
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_diff'] = df['macd'] - df['macd_signal']
    
    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    # Bollinger Bands
    df['bb_middle'] = df['close'].rolling(window=20).mean()
    bb_std = df['close'].rolling(window=20).std()
    df['bb_upper'] = df['bb_middle'] + (bb_std * 2)
    df['bb_lower'] = df['bb_middle'] - (bb_std * 2)
    df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
    
    # Volatility
    df['volatility'] = df['close'].rolling(window=20).std()
    df['volatility_ratio'] = df['volatility'] / df['close']
    
    # Volume indicators
    df['volume_sma_20'] = df['volume'].rolling(window=20).mean()
    df['volume_ratio'] = df['volume'] / df['volume_sma_20']
    
    # Price momentum
    df['momentum_5'] = df['close'].pct_change(5)
    df['momentum_10'] = df['close'].pct_change(10)
    df['momentum_20'] = df['close'].pct_change(20)
    
    # Target: Next day's price
    df['target'] = df['close'].shift(-1)
    df['target_change'] = df['target'].pct_change()
    
    return df

def collect_data_for_symbol(symbol, years=3):
    """
    Collect all data for a single symbol
    
    Args:
        symbol: Stock ticker
        years: Number of years of historical data
    
    Returns:
        DataFrame with all features
    """
    print(f"\n📊 Collecting data for {symbol}...")
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years*365)
    
    from_timestamp = int(start_date.timestamp())
    to_timestamp = int(end_date.timestamp())
    
    # Fetch OHLCV data
    print("  ├─ Fetching price data...")
    df = fetch_stock_candles(symbol, from_timestamp, to_timestamp)
    print(f"  ├─ Fetched {len(df)} days of data")
    
    # Calculate technical indicators
    print("  ├─ Calculating technical indicators...")
    df = calculate_technical_indicators(df)
    
    # Fetch fundamental data
    print("  ├─ Fetching fundamental data...")
    try:
        profile = fetch_company_profile(symbol)
        metrics = fetch_company_metrics(symbol)
        
        # Add fundamental data (forward-fill for daily data)
        if 'metric' in metrics:
            df['pe_ratio'] = metrics['metric'].get('peNormalizedAnnual', np.nan)
            df['roe'] = metrics['metric'].get('roe', np.nan)
            df['pb_ratio'] = metrics['metric'].get('pbAnnual', np.nan)
            df['market_cap'] = profile.get('marketCapitalization', np.nan)
        
        time.sleep(1)  # Rate limiting
    except Exception as e:
        print(f"  ├─ Warning: Could not fetch fundamentals: {e}")
        df['pe_ratio'] = np.nan
        df['roe'] = np.nan
        df['pb_ratio'] = np.nan
        df['market_cap'] = np.nan
    
    # Remove rows with NaN in critical columns
    df = df.dropna(subset=['close', 'target', 'sma_20', 'rsi'])
    
    print(f"  └─ ✅ Final dataset: {len(df)} rows, {len(df.columns)} columns")
    
    return df

def save_training_data(df, symbol, output_dir='data'):
    """Save collected data to CSV"""
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{output_dir}/{symbol}_training_data.csv"
    df.to_csv(filename, index=False)
    print(f"\n💾 Data saved to: {filename}")
    
    # Save metadata
    metadata = {
        'symbol': symbol,
        'rows': len(df),
        'columns': len(df.columns),
        'date_range': {
            'start': df['date'].min().isoformat(),
            'end': df['date'].max().isoformat()
        },
        'features': list(df.columns),
        'collected_at': datetime.now().isoformat()
    }
    
    metadata_file = f"{output_dir}/{symbol}_metadata.json"
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📋 Metadata saved to: {metadata_file}")
    
    return filename

def main():
    """Main execution"""
    # Symbols to collect data for
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
    
    print("=" * 60)
    print("📈 Stock Data Collection for ML Training")
    print("=" * 60)
    
    if FINNHUB_API_KEY == 'YOUR_API_KEY_HERE':
        print("\n⚠️  WARNING: Please set FINNHUB_API_KEY environment variable")
        print("Get your free API key at: https://finnhub.io/register")
        print("\nUsage:")
        print("  export FINNHUB_API_KEY='your_api_key'")
        print("  python collect_data.py")
        return
    
    for symbol in symbols:
        try:
            df = collect_data_for_symbol(symbol, years=3)
            save_training_data(df, symbol)
            time.sleep(2)  # Rate limiting between symbols
        except Exception as e:
            print(f"\n❌ Error collecting data for {symbol}: {e}")
            continue
    
    print("\n" + "=" * 60)
    print("✅ Data collection complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Review collected data in the 'data' directory")
    print("  2. Run train_model.py to train the LightGBM model")

if __name__ == '__main__':
    main()
