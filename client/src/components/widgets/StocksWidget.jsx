import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import React from 'react'

// Free Yahoo Finance-compatible API via query1.finance.yahoo.com is blocked by CORS.
// Instead, use a simple approach: parse the user's symbols config and fetch from a free proxy.
// Fallback: show configured symbols with "–" values until a data source is available.

function StocksWidget({ config, size }) {
  const [data, setData] = useState(null)

  const symbols = (config.symbols || 'BEL20, CAC40')
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean)

  useEffect(() => {
    // Attempt to fetch from Yahoo Finance proxy API
    const tickers = symbols.map(s => {
      // Map common European indices to Yahoo tickers
      const map = {
        'BEL20': '^BFX', 'CAC40': '^FCHI', 'AEX': '^AEX',
        'DAX': '^GDAXI', 'FTSE': '^FTSE', 'IBEX': '^IBEX',
        'SMI': '^SSMI', 'STOXX50': '^STOXX50E',
        'DOW': '^DJI', 'SP500': '^GSPC', 'NASDAQ': '^IXIC',
        'NIKKEI': '^N225', 'EUR/USD': 'EURUSD=X', 'GBP/USD': 'GBPUSD=X',
        'USD/JPY': 'USDJPY=X', 'BTC/USD': 'BTC-USD', 'ETH/USD': 'ETH-USD',
      }
      return { label: s, ticker: map[s.toUpperCase()] || s }
    })

    async function fetchQuotes() {
      try {
        const tickerStr = tickers.map(t => t.ticker).join(',')
        const resp = await fetch(`/api/v1/yahoo-quote?symbols=${encodeURIComponent(tickerStr)}`, {
          signal: AbortSignal.timeout(10000),
        })
        if (!resp.ok) throw new Error('Yahoo API error')
        const json = await resp.json()
        const quotes = json.quoteResponse?.result || []
        const results = tickers.map(t => {
          const q = quotes.find(q => q.symbol === t.ticker)
          if (!q) return { label: t.label, price: '–', change: '', up: null }
          const price = q.regularMarketPrice?.toLocaleString('fr', { maximumFractionDigits: 2 }) || '–'
          const pct = q.regularMarketChangePercent
          const changeStr = pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : ''
          return { label: t.label, price, change: changeStr, up: pct > 0 ? true : pct < 0 ? false : null }
        })
        setData(results)
      } catch {
        // If Yahoo API fails (CORS), show symbols with dashes
        setData(tickers.map(t => ({ label: t.label, price: '–', change: '', up: null })))
      }
    }

    fetchQuotes()
    const interval = setInterval(fetchQuotes, (config.refreshSeconds || 60) * 1000)
    return () => clearInterval(interval)
  }, [config.symbols, config.refreshSeconds])

  const headerSize = Math.max(11, Math.min(size.h / 12, size.w / 16))
  const symbolSize = Math.max(12, Math.min(size.h / 10, size.w / 14))
  const priceSize = Math.max(11, symbolSize * 0.9)
  const changeSize = Math.max(10, symbolSize * 0.8)
  const iconSize = Math.max(10, symbolSize * 0.7)

  const st = config._style || {}
  const accentColor = config.accentColor || st.textColor || '#5eead4'
  const textColor = st.textColor || config.textColor || '#d4d4d8'
  const bgColor = st.backgroundColor || config.backgroundColor || 'rgba(255,255,255,.05)'
  const fontFamily = st.fontFamily ? `'${st.fontFamily}', sans-serif` : undefined

  const items = data || symbols.map(s => ({ label: s, price: '–', change: '', up: null }))

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,.08)', fontFamily }}>
      <div className="flex-shrink-0"
        style={{ padding: `${Math.max(6, size.h / 20)}px ${Math.max(8, size.w / 16)}px`, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize: headerSize, fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Bourse
        </span>
      </div>
      <div className="flex-1 overflow-hidden" style={{ padding: `${Math.max(4, size.h / 25)}px ${Math.max(8, size.w / 16)}px` }}>
        {items.map((s, i) => (
          <div key={i} className="flex items-center justify-between"
            style={{ padding: `${Math.max(4, size.h / 25)}px 0` }}>
            <span style={{ fontWeight: 500, color: textColor, fontSize: symbolSize, minWidth: symbolSize * 4 }}>{s.label}</span>
            <span style={{ color: `${textColor}aa`, fontVariantNumeric: 'tabular-nums', fontSize: priceSize }}>{s.price}</span>
            <span className="flex items-center" style={{
              fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: changeSize, gap: 3,
              color: s.up === true ? '#34d399' : s.up === false ? '#f87171' : '#71717a',
            }}>
              {s.up === true && <TrendingUp size={iconSize} />}
              {s.up === false && <TrendingDown size={iconSize} />}
              {s.up === null && s.change && <Minus size={iconSize} />}
              {s.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(StocksWidget)
