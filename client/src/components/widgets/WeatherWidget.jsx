import { useState, useEffect } from 'react'
import { CloudSun, Cloud, Sun, CloudRain, CloudSnow, CloudFog, CloudLightning, Droplets, Wind } from 'lucide-react'
import React from 'react'

const WMO_ICONS = {
  0: Sun, 1: Sun, 2: CloudSun, 3: Cloud,
  45: CloudFog, 48: CloudFog,
  51: CloudRain, 53: CloudRain, 55: CloudRain,
  61: CloudRain, 63: CloudRain, 65: CloudRain,
  71: CloudSnow, 73: CloudSnow, 75: CloudSnow,
  80: CloudRain, 81: CloudRain, 82: CloudLightning,
  95: CloudLightning, 96: CloudLightning, 99: CloudLightning,
}

const WMO_LABEL = {
  0: 'Ensoleillé', 1: 'Dégagé', 2: 'Partiellement nuageux', 3: 'Couvert',
  45: 'Brouillard', 48: 'Brouillard givrant',
  51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte',
  61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte',
  71: 'Neige légère', 73: 'Neige', 75: 'Neige forte',
  80: 'Averses', 81: 'Averses fortes', 82: 'Orages',
  95: 'Orage', 96: 'Orage avec grêle', 99: 'Orage violent',
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function WeatherWidget({ config, size }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const lat = config.lat || 50.85
    const lon = config.lon || 4.35
    const units = config.units === '°F' ? 'fahrenheit' : 'celsius'
    // forecastDays: new numeric config (0-7); fallback to legacy showForecast boolean
    const numForecast = Math.min(7, Math.max(0,
      config.forecastDays != null ? parseInt(config.forecastDays) : (config.showForecast ? 3 : 0)
    ))
    const apiDays = numForecast + 1 // +1 to include today

    function fetchWeather() {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true&temperature_unit=${units}` +
        `&hourly=relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min` +
        `&forecast_days=${Math.max(2, apiDays)}&timezone=auto`
      )
        .then(r => r.json())
        .then(d => {
          const w = d.current_weather || {}
          const humidity = d.hourly?.relativehumidity_2m?.[new Date().getHours()] ?? '--'
          const forecast = d.daily ? d.daily.time.slice(1).map((date, i) => ({
            day: DAY_LABELS[new Date(date).getDay()],
            code: d.daily.weathercode[i + 1] ?? 0,
            max: Math.round(d.daily.temperature_2m_max[i + 1] ?? 0),
            min: Math.round(d.daily.temperature_2m_min[i + 1] ?? 0),
          })) : []
          setData({
            temp: Math.round(w.temperature ?? 0),
            wind: Math.round(w.windspeed ?? 0),
            code: w.weathercode ?? 0,
            humidity,
            forecast: forecast.slice(0, numForecast),
          })
        })
        .catch(() => {})
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [config.lat, config.lon, config.units, config.forecastDays, config.showForecast])

  const numForecast = Math.min(7, Math.max(0,
    config.forecastDays != null ? parseInt(config.forecastDays) : (config.showForecast ? 3 : 0)
  ))
  const hasForecast = numForecast > 0
  const iconSize = Math.min(size.w / (hasForecast ? 4 : 3), size.h / (hasForecast ? 3 : 2.2))
  const tempFontSize = Math.max(18, size.h / (hasForecast ? 4 : 3.2))
  const cityFontSize = Math.max(11, size.h / 9)
  const detailFontSize = Math.max(10, size.h / 11)
  const detailIconSize = Math.max(10, size.h / 13)
  // Scale forecast columns: more days → smaller labels
  const forecastLabelSize = Math.max(8, Math.min(size.w / (numForecast * 3.5 + 4), 16))

  const st = config._style || {}
  const mainColor = st.textColor || config.textColor || '#ffffff'
  const subColor = st.textColor ? `${st.textColor}aa` : '#a1a1aa'
  const mutedColor = st.textColor ? `${st.textColor}66` : '#71717a'
  const iconColor = config.iconColor || st.textColor || 'rgba(251,191,36,.75)'
  const bgColor = st.backgroundColor || config.backgroundColor || 'rgba(255,255,255,.05)'
  const fontFamily = st.fontFamily ? `'${st.fontFamily}', sans-serif` : undefined

  const Icon = data ? (WMO_ICONS[data.code] || CloudSun) : CloudSun
  const temp = data ? `${data.temp}${config.units || '°C'}` : '--'
  const condition = data ? (WMO_LABEL[data.code] || '') : ''

  return (
    <div className="w-full h-full flex flex-col rounded-xl p-4"
      style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,.08)', justifyContent: 'space-between', fontFamily }}>
      {/* Current weather */}
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontWeight: 700, color: mainColor, fontSize: tempFontSize, lineHeight: 1 }}>{temp}</div>
          <div style={{ color: subColor, fontSize: cityFontSize, marginTop: 4 }}>{config.city || 'Bruxelles'}</div>
          {condition && !config.showForecast && (
            <div style={{ color: mutedColor, fontSize: detailFontSize, marginTop: 2 }}>{condition}</div>
          )}
        </div>
        <Icon size={iconSize} style={{ color: iconColor, flexShrink: 0 }} />
      </div>

      {/* Current details */}
      <div className="flex items-center" style={{ gap: detailFontSize * 0.8, color: mutedColor, fontSize: detailFontSize }}>
        <span className="flex items-center" style={{ gap: 4 }}>
          <Droplets size={detailIconSize} /> {data?.humidity ?? '--'}%
        </span>
        <span className="flex items-center" style={{ gap: 4 }}>
          <Wind size={detailIconSize} /> {data?.wind ?? '--'} km/h
        </span>
      </div>

      {/* Forecast row — up to 7 days */}
      {hasForecast && data?.forecast?.length > 0 && (
        <div style={{ display: 'flex', gap: 2, marginTop: 8, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 8 }}>
          {data.forecast.map((day, i) => {
            const FIcon = WMO_ICONS[day.code] || CloudSun
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: forecastLabelSize, color: mutedColor, fontWeight: 600 }}>{day.day}</span>
                <FIcon size={Math.max(10, forecastLabelSize * 1.1)} style={{ color: iconColor }} />
                <span style={{ fontSize: forecastLabelSize, color: mainColor, fontWeight: 600 }}>{day.max}°</span>
                <span style={{ fontSize: forecastLabelSize * 0.85, color: subColor }}>{day.min}°</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default React.memo(WeatherWidget)
