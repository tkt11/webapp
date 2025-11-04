// Technical ML Analysis Service
// このサービスは外部ML APIにプロキシするため、簡易実装

export interface TechnicalMLResult {
  score: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  indicators?: any;
}

export async function getAdvancedTechnicalAnalysis(
  symbol: string,
  mlApiUrl?: string
): Promise<TechnicalMLResult> {
  // ML APIが利用可能な場合はそちらを使用
  if (mlApiUrl) {
    try {
      const response = await fetch(`${mlApiUrl}/api/technical-ml-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('[Technical ML] Error calling ML API:', error);
    }
  }
  
  // フォールバック: デフォルト値を返す
  return {
    score: 50,
    signal: 'HOLD'
  };
}
