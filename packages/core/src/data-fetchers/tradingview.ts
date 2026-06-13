import type { DataFetcher, KLineData } from '../controllers/types'

const PERIOD_TO_TIMEFRAME: Record<string, string> = {
  daily: '1d',
  weekly: '1w',
  monthly: '1M',
  '5min': '5m',
  '15min': '15m',
  '30min': '30m',
  '60min': '60m',
}

export const tradingviewDataFetcher: DataFetcher = async (source, config) => {
  const baseUrl = source === 'tradingview' ? 'http://localhost:8000' : ''
  const timeframe = PERIOD_TO_TIMEFRAME[config.period] ?? '1d'

  const days = Math.ceil(
    (new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) / 86_400_000,
  )
  const count = Math.max(Math.ceil(days * 1.5), 100)

  const exchangeQ = config.exchange ? `&exchange=${config.exchange}` : ''
  const url = `${baseUrl}/api/tradingview/kdata?symbol=${config.symbol}&timeframe=${timeframe}&count=${count}${exchangeQ}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[tradingview] fetch failed: ${res.status} ${res.statusText}`)
      return []
    }
    const json = await res.json()
    if (!json.success) {
      console.warn(`[tradingview] API error: ${json.error_msg}`)
      return []
    }

    const startTs = new Date(config.startDate).getTime()
    const endTs = new Date(config.endDate).getTime()

    return (json.data ?? [])
      .filter((item: Record<string, unknown>) => {
        const ts = item.ts_open as number
        return ts >= startTs && ts <= endTs
      })
      .map((item: Record<string, unknown>) => ({
        timestamp: item.ts_open as number,
        open: item.open as number,
        high: item.high as number,
        low: item.low as number,
        close: item.close as number,
        volume: (item.volume as number) ?? 0,
        stockCode: config.symbol,
      })) as KLineData[]
  } catch (err) {
    console.warn('[tradingview] network error:', err)
    return []
  }
}
