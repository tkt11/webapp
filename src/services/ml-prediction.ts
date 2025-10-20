/**
 * ML Prediction Service
 * Calls external LightGBM API for machine learning-based stock prediction
 */

const ML_API_URL = 'https://stock-ml-api-621848899229.asia-northeast1.run.app';

export interface MLPredictionRequest {
  symbol: string;
  prices: number[];
  rsi?: number;
  macd?: number;
  sentiment_score?: number;
  pe_ratio?: number;
  roe?: number;
  volume?: number;
}

export interface MLPredictionResponse {
  symbol: string;
  predicted_price: number;
  confidence: number;
  change_percent: number;
  model: string;
  features_used: number;
  timestamp: string;
  // 追加: ML学習詳細情報
  feature_importances?: {
    feature: string;
    importance: number;
  }[];
  model_metrics?: {
    mae: number;
    rmse: number;
    r2_score: number;
    training_samples: number;
  };
  training_info?: {
    data_start_date: string;
    data_end_date: string;
    training_days: number;
    last_trained: string;
  };
}

// 学習レスポンス型
export interface TrainingDataInfo {
  total_samples: number;
  train_samples: number;
  test_samples: number;
  features_count: number;
  date_range_start?: string;
  date_range_end?: string;
}

export interface Hyperparameters {
  objective: string;
  boosting_type: string;
  num_leaves: number;
  learning_rate: number;
  max_depth: number;
  min_data_in_leaf: number;
  feature_fraction: number;
  bagging_fraction: number;
  bagging_freq: number;
  num_boost_round: number;
}

export interface LearningCurves {
  iterations: number[];
  train_loss: number[];
  val_loss: number[];
}

export interface PerformanceMetrics {
  train_rmse: number;
  test_rmse: number;
  train_mae: number;
  test_mae: number;
  train_r2: number;
  test_r2: number;
  generalization_gap: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface MLTrainingResponse {
  success: boolean;
  model_id: string;
  symbol: string;
  training_data: TrainingDataInfo;
  hyperparameters: Hyperparameters;
  learning_curves: LearningCurves;
  performance_metrics: PerformanceMetrics;
  feature_importances: FeatureImportance[];
  training_duration: number;
  timestamp: string;
  message: string;
}

/**
 * Get ML-based stock price prediction
 */
export async function predictWithML(
  symbol: string,
  prices: number[],
  technicalData: any,
  fundamentalData: any,
  sentimentScore: number
): Promise<MLPredictionResponse | null> {
  try {
    // Prepare request data
    const requestData: MLPredictionRequest = {
      symbol,
      prices: prices.slice(-30), // Last 30 days
      rsi: technicalData.rsi,
      macd: technicalData.macd?.macd,
      sentiment_score: sentimentScore,
      pe_ratio: fundamentalData.pe_ratio,
      roe: fundamentalData.roe,
      volume: prices.length > 0 ? 1000000 : undefined // Placeholder
    };

    // Call ML API
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      console.error('ML API error:', response.status, response.statusText);
      return null;
    }

    const result: MLPredictionResponse = await response.json();
    return result;

  } catch (error) {
    console.error('ML prediction error:', error);
    return null;
  }
}

/**
 * Train a stock-specific ML model
 */
export async function trainMLModel(
  symbol: string,
  prices: number[],
  technicalData: any,
  fundamentalData: any,
  sentimentScore: number
): Promise<MLTrainingResponse | null> {
  try {
    const requestData: MLPredictionRequest = {
      symbol,
      prices: prices.slice(-730), // Last 2 years for training
      rsi: technicalData.rsi,
      macd: technicalData.macd?.macd,
      sentiment_score: sentimentScore,
      pe_ratio: fundamentalData.pe_ratio,
      roe: fundamentalData.roe,
      volume: prices.length > 0 ? 1000000 : undefined
    };

    console.log(`Training model for ${symbol} with ${requestData.prices.length} price points...`);

    // Call ML API train endpoint
    const response = await fetch(`${ML_API_URL}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      console.error('ML train API error:', response.status, response.statusText);
      return null;
    }

    const result: MLTrainingResponse = await response.json();
    console.log(`Training complete! Model ID: ${result.model_id}, Duration: ${result.training_duration.toFixed(1)}s`);
    
    return result;
  } catch (error) {
    console.error('ML training error:', error);
    return null;
  }
}

/**
 * Get ML API health status
 */
export async function getMLAPIHealth(): Promise<{
  status: string;
  model_loaded: boolean;
  requests_today: number;
} | null> {
  try {
    const response = await fetch(`${ML_API_URL}/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('ML API health check error:', error);
    return null;
  }
}
