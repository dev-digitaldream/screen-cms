// Screen templates — each template defines a complete 1920×1080 layout

export const TEMPLATES = [
  {
    id: 'corporate-dark',
    name: 'Corporate Dark',
    description: 'KPIs + météo + news',
    emoji: '🏢',
  },
  {
    id: 'news-room',
    name: 'News Room',
    description: 'Flux RSS + graphique + ticker',
    emoji: '📰',
  },
  {
    id: 'lobby-welcome',
    name: 'Lobby Welcome',
    description: 'Horloge grande + QR code',
    emoji: '🏨',
  },
  {
    id: 'retail-promo',
    name: 'Retail Promo',
    description: 'Slides + countdown + ticker',
    emoji: '🛍️',
  },
]

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function buildLayout(screenConfig, widgetDefs) {
  const widgets = {}
  const widgetOrder = []
  for (const def of widgetDefs) {
    const id = makeId()
    widgets[id] = {
      id,
      type: def.type,
      x: def.x,
      y: def.y,
      w: def.w,
      h: def.h,
      zIndex: def.zIndex || 1,
      config: def.config || {},
    }
    widgetOrder.push(id)
  }
  return { screenConfig, widgets, widgetOrder }
}

export function applyTemplate(templateId) {
  switch (templateId) {
    case 'corporate-dark':
      return buildLayout(
        {
          slug: '',
          name: '',
          backgroundColor: '#0a0a0e',
          theme: 'dark',
          resolution: 'fhd',
          refreshInterval: 300,
        },
        [
          // Logo top-left
          { type: 'logo', x: 40, y: 30, w: 240, h: 80, config: { showName: true, companyName: 'Entreprise' } },
          // Clock top-right
          { type: 'clock', x: 1620, y: 30, w: 260, h: 140, config: { format: '24h', showDate: true, showSeconds: true } },
          // KPI row
          { type: 'kpi', x: 40, y: 160, w: 220, h: 160, config: { label: 'Chiffre d\'affaires', value: '1.2M€', unit: '', trend: 'up', trendValue: '+8%' } },
          { type: 'kpi', x: 280, y: 160, w: 220, h: 160, config: { label: 'Clients actifs', value: '3 847', unit: '', trend: 'up', trendValue: '+124' } },
          { type: 'kpi', x: 520, y: 160, w: 220, h: 160, config: { label: 'Satisfaction', value: '94%', unit: '', trend: 'neutral', trendValue: '' } },
          { type: 'kpi', x: 760, y: 160, w: 220, h: 160, config: { label: 'SLA', value: '99.8%', unit: '', trend: 'up', trendValue: '+0.2%' } },
          // Chart
          { type: 'chart', x: 40, y: 360, w: 580, h: 300, config: { title: 'Performance mensuelle', chartType: 'bar', data: 'Jan:120,Fév:180,Mar:150,Avr:200,Mai:175,Jun:220', barColor: '#6366f1' } },
          // Weather
          { type: 'weather', x: 640, y: 360, w: 280, h: 200, config: { city: 'Bruxelles', lat: 50.85, lon: 4.35, units: '°C' } },
          // RSS News
          { type: 'rss', x: 1000, y: 30, w: 880, h: 600, config: { feedUrl: 'https://feeds.lemonde.fr/rss/une', maxItems: 6, showImages: false } },
          // Countdown
          { type: 'countdown', x: 640, y: 580, w: 380, h: 140, config: { title: 'Prochain événement', targetDate: '2025-12-31T00:00:00', doneText: '🎉 Bonne année !', accentColor: '#6366f1' } },
          // Ticker
          { type: 'ticker', x: 0, y: 1024, w: 1920, h: 56, config: { content: 'Bienvenue — Corporate Dashboard', speed: 1, backgroundColor: 'rgba(10,10,14,0.9)', textColor: '#FFFFFF' } },
        ]
      )

    case 'news-room':
      return buildLayout(
        {
          slug: '',
          name: '',
          backgroundColor: '#0d1117',
          theme: 'dark',
          resolution: 'fhd',
          refreshInterval: 180,
        },
        [
          // Header bar
          { type: 'logo', x: 40, y: 24, w: 200, h: 72, config: { showName: true, companyName: 'News Room' } },
          { type: 'clock', x: 1640, y: 24, w: 240, h: 120, config: { format: '24h', showDate: true, showSeconds: false } },
          // Main RSS (large)
          { type: 'rss', x: 40, y: 130, w: 700, h: 860, config: { feedUrl: 'https://feeds.lemonde.fr/rss/une', maxItems: 8, showImages: true } },
          // Secondary RSS
          { type: 'rss', x: 760, y: 130, w: 580, h: 420, config: { feedUrl: 'https://www.rtbf.be/rss/info/regions/all', maxItems: 5, showImages: false } },
          // Chart
          { type: 'chart', x: 760, y: 570, w: 580, h: 280, config: { title: 'Audience en direct', chartType: 'line', data: '8h:12,9h:28,10h:45,11h:67,12h:89,13h:75,14h:61', barColor: '#f59e0b' } },
          // Weather
          { type: 'weather', x: 1360, y: 130, w: 520, h: 260, config: { city: 'Bruxelles', lat: 50.85, lon: 4.35, units: '°C' } },
          // QR
          { type: 'qrcode', x: 1360, y: 410, w: 200, h: 200, config: { url: 'https://example.com', label: 'Lire en ligne' } },
          // Stocks
          { type: 'stocks', x: 1580, y: 410, w: 300, h: 200, config: { symbols: 'BEL20, CAC40', refreshSeconds: 60 } },
          // Breaking news ticker
          { type: 'ticker', x: 0, y: 1024, w: 1920, h: 56, config: { rssEnabled: true, rssUrl: 'https://feeds.lemonde.fr/rss/une', speed: 1.5, backgroundColor: '#dc2626', textColor: '#FFFFFF', fontSize: 22 } },
        ]
      )

    case 'lobby-welcome':
      return buildLayout(
        {
          slug: '',
          name: '',
          backgroundColor: '#0f172a',
          theme: 'dark',
          resolution: 'fhd',
          refreshInterval: 600,
        },
        [
          // Big clock center-top
          { type: 'clock', x: 560, y: 80, w: 800, h: 320, config: { format: '24h', showDate: true, showSeconds: true } },
          // Welcome text
          { type: 'text', x: 400, y: 420, w: 1120, h: 160, config: { content: 'Bienvenue !', fontSize: 64, fontWeight: 'bold', textAlign: 'center', textColor: '#FFFFFF' } },
          // Weather left
          { type: 'weather', x: 80, y: 200, w: 420, h: 320, config: { city: 'Bruxelles', lat: 50.85, lon: 4.35, units: '°C' } },
          // QR right
          { type: 'qrcode', x: 1420, y: 200, w: 420, h: 420, config: { url: 'https://example.com', label: 'Notre site web' } },
          // Logo
          { type: 'logo', x: 860, y: 600, w: 200, h: 100, config: { showName: true, companyName: 'Votre Entreprise' } },
          // Calendar
          { type: 'calendar', x: 80, y: 560, w: 420, h: 400, config: { source: 'manual', maxEvents: 5 } },
          // Countdown
          { type: 'countdown', x: 640, y: 720, w: 640, h: 180, config: { title: 'Prochain événement', targetDate: '2025-12-31T18:00:00', doneText: '🎉 L\'événement commence !', accentColor: '#6366f1' } },
          // Ticker
          { type: 'ticker', x: 0, y: 1024, w: 1920, h: 56, config: { content: '👋 Bienvenue dans nos locaux — Pour toute demande, contactez l\'accueil.', speed: 0.8, backgroundColor: 'rgba(15,23,42,0.95)', textColor: '#94a3b8' } },
        ]
      )

    case 'retail-promo':
      return buildLayout(
        {
          slug: '',
          name: '',
          backgroundColor: '#1a0533',
          theme: 'dark',
          resolution: 'fhd',
          refreshInterval: 120,
        },
        [
          // Main promo slides
          { type: 'slides', x: 0, y: 0, w: 1280, h: 720, config: { embedUrl: '', autoAdvance: true, intervalSeconds: 8 } },
          // Countdown promo
          { type: 'countdown', x: 1300, y: 40, w: 580, h: 220, config: { title: '🔥 Offre expire dans', targetDate: '2025-08-31T23:59:59', doneText: 'Offre terminée !', accentColor: '#f59e0b' } },
          // KPIs promo
          { type: 'kpi', x: 1300, y: 280, w: 280, h: 180, config: { label: 'Réduction', value: '-30%', unit: '', trend: 'up', trendValue: 'Limité' } },
          { type: 'kpi', x: 1600, y: 280, w: 280, h: 180, config: { label: 'Articles restants', value: '47', unit: '', trend: 'down', trendValue: '-12 ce matin' } },
          // QR code promo
          { type: 'qrcode', x: 1380, y: 480, w: 200, h: 200, config: { url: 'https://example.com/promo', label: 'Scanner pour commander' } },
          // Clock
          { type: 'clock', x: 1620, y: 480, w: 240, h: 140, config: { format: '24h', showDate: false, showSeconds: false } },
          // Info text
          { type: 'text', x: 40, y: 740, w: 1240, h: 80, config: { content: 'Valable en magasin uniquement • Offre soumise à disponibilité', fontSize: 22, fontWeight: 'normal', textAlign: 'center', textColor: 'rgba(255,255,255,0.6)' } },
          // Ticker
          { type: 'ticker', x: 0, y: 1024, w: 1920, h: 56, config: { content: '🛍️ SOLDES — Jusqu\'à -50% sur une sélection d\'articles — Offre valable jusqu\'au 31 août', speed: 1.2, backgroundColor: '#f59e0b', textColor: '#000000', fontSize: 24 } },
        ]
      )

    default:
      return null
  }
}
