/**
 * NASDAQ-100 銘柄リスト
 * 
 * NASDAQ-100は時価総額の大きい非金融企業100社で構成
 * 定期的に入れ替えがあるため、四半期ごとに更新推奨
 * 
 * 最終更新: 2025-10-23
 */

export const NASDAQ_100_SYMBOLS = [
  // メガキャップテクノロジー
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA',
  
  // 大手テクノロジー・半導体
  'AVGO', 'AMD', 'INTC', 'QCOM', 'TXN', 'ADI', 'AMAT', 'LRCX', 'KLAC',
  'MRVL', 'NXPI', 'SNPS', 'CDNS', 'ON', 'MCHP',
  
  // ソフトウェア・クラウド
  'ADBE', 'CRM', 'ORCL', 'INTU', 'WDAY', 'PANW', 'CRWD', 'FTNT', 'DDOG',
  'ZS', 'TEAM', 'SNOW', 'NOW', 'ANSS',
  
  // インターネット・Eコマース
  'NFLX', 'ABNB', 'BKNG', 'EBAY', 'MELI', 'JD', 'PDD', 'DASH',
  
  // 通信
  'TMUS', 'CMCSA', 'CHTR',
  
  // 消費財
  'COST', 'PEP', 'MDLZ', 'KDP', 'MNST', 'WBD',
  
  // バイオテクノロジー・ヘルスケア
  'AMGN', 'GILD', 'VRTX', 'REGN', 'BIIB', 'ILMN', 'MRNA', 'SGEN',
  
  // 医療機器
  'ISRG', 'DXCM', 'ALGN', 'IDXX',
  
  // 小売・消費者サービス
  'SBUX', 'LULU', 'ORLY', 'PCAR', 'ODFL', 'FAST',
  
  // 産業
  'HON', 'ADP', 'PAYX', 'CPRT', 'VRSK',
  
  // その他テック
  'ASML',  // 半導体製造装置（オランダ）
  'PYPL',  // 決済
  'ADSK',  // 3Dデザインソフトウェア
  'CSX',   // 鉄道
  'DLTR',  // ディスカウント小売
  'CSGP',  // ソフトウェア
  'TTWO',  // ゲーム
  'EA',    // ゲーム
  'ATVI',  // ゲーム（Microsoft買収完了）
  'MAR',   // ホテル
  'CEG',   // エネルギー
  'XEL',   // 電力
  'GEHC',  // 医療機器
  'CTAS',  // ビジネスサービス
  'BKR',   // エネルギー
  'FANG',  // エネルギー
  'WBA',   // 薬局
  'ENPH',  // 太陽光発電
  'ZM',    // ビデオ会議
  'LCID',  // EV
  'RIVN'   // EV
]

/**
 * 銘柄リストの検証
 */
export function validateSymbols(): { valid: string[], invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []
  
  NASDAQ_100_SYMBOLS.forEach(symbol => {
    if (/^[A-Z]{1,5}$/.test(symbol)) {
      valid.push(symbol)
    } else {
      invalid.push(symbol)
    }
  })
  
  return { valid, invalid }
}

/**
 * 銘柄数を取得
 */
export function getSymbolCount(): number {
  return NASDAQ_100_SYMBOLS.length
}

/**
 * 特定のセクターの銘柄を取得（将来的な拡張用）
 */
export function getSymbolsByCategory(category: 'tech' | 'healthcare' | 'consumer' | 'all'): string[] {
  if (category === 'all') {
    return NASDAQ_100_SYMBOLS
  }
  
  // 簡易的な分類（将来的にはより詳細な分類を実装）
  const categories = {
    tech: ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'AMD', 'INTC'],
    healthcare: ['AMGN', 'GILD', 'VRTX', 'REGN', 'BIIB', 'ILMN', 'MRNA', 'ISRG', 'DXCM'],
    consumer: ['COST', 'PEP', 'SBUX', 'MDLZ', 'KDP', 'MNST']
  }
  
  return categories[category] || []
}
