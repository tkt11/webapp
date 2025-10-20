# Stock Prediction ML API

LightGBM-based stock price prediction service for Cloudflare Workers integration.

## Features

- **FastAPI** for high-performance API
- **LightGBM** for gradient boosting prediction
- **Statistical Hybrid Model** combining ML with technical indicators
- **Rate Limiting** with 1000 requests/day
- **CORS Support** for frontend integration
- **Health Check** endpoint for monitoring

## API Endpoints

### `POST /predict`
Predict stock price based on historical data and indicators.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "prices": [150.0, 151.2, 149.8, 152.3, 153.1],
  "rsi": 65.5,
  "macd": 1.23,
  "sentiment_score": 72.5,
  "pe_ratio": 28.5,
  "roe": 15.3,
  "volume": 50000000
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "predicted_price": 154.23,
  "confidence": 0.78,
  "change_percent": 1.52,
  "model": "LightGBM v1.0",
  "features_used": 12,
  "timestamp": "2024-01-15T10:30:00"
}
```

### `GET /health`
Health check endpoint.

### `GET /stats`
API usage statistics.

## Deployment to Google Cloud Run

See parent directory README for deployment instructions.

## Local Development

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

Visit: http://localhost:8080/docs for interactive API documentation.

## Model Features

The model uses 12 features:
1. Current price
2. 5-day SMA
3. 10-day SMA
4. 20-day SMA
5. Volatility (standard deviation)
6. Price change percentage
7. RSI (normalized)
8. MACD
9. Sentiment score (normalized)
10. P/E ratio (normalized)
11. ROE (normalized)
12. Trading volume (log-transformed)

## Rate Limits

- **1000 requests/day** per instance
- Automatic daily reset at midnight UTC

## License

MIT
