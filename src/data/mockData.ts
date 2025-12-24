// Mock trading data for the platform

export const tradingPairs = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', price: 1.0876, change: 0.12 },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', price: 1.2654, change: -0.08 },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', price: 149.82, change: 0.24 },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', price: 0.6543, change: -0.15 },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', price: 1.3621, change: 0.05 },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', price: 0.5987, change: -0.22 },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', price: 0.8876, change: 0.09 },
  { symbol: 'GBPJPY', name: 'Euro / British Pound', price: 0.8594, change: 0.03 },
];

export const timeframes = [
  { value: 'M1', label: '1m' },
  { value: 'M5', label: '5m' },
  { value: 'M15', label: '15m' },
  { value: 'M30', label: '30m' },
  { value: 'H1', label: '1H' },
  { value: 'H4', label: '4H' },
  { value: 'D1', label: '1D' },
  { value: 'W1', label: '1W' },
];

export const generateCandleData = (count: number = 100) => {
  const data = [];
  let basePrice = 1.0850;
  const now = Date.now();
  const hourMs = 3600000;

  for (let i = count; i >= 0; i--) {
    const volatility = 0.002;
    const change = (Math.random() - 0.5) * volatility;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 10000) + 1000;

    data.push({
      time: now - i * hourMs,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
      volume,
    });

    basePrice = close;
  }

  return data;
};

export const backtestResults = {
  system1: {
    totalTrades: 247,
    winRate: 62.3,
    profitFactor: 1.87,
    maxDrawdown: 8.4,
    netProfit: 12847.50,
    averageWin: 187.32,
    averageLoss: -98.45,
    sharpeRatio: 1.42,
    trades: [
      { id: 1, pair: 'EURUSD', date: '2024-12-15', type: 'Long', entry: 1.0845, exit: 1.0892, pnl: 470, result: 'Win' },
      { id: 2, pair: 'GBPUSD', date: '2024-12-14', type: 'Short', entry: 1.2701, exit: 1.2654, pnl: 470, result: 'Win' },
      { id: 3, pair: 'USDJPY', date: '2024-12-13', type: 'Long', entry: 149.50, exit: 149.20, pnl: -200, result: 'Loss' },
      { id: 4, pair: 'AUDUSD', date: '2024-12-12', type: 'Short', entry: 0.6580, exit: 0.6543, pnl: 370, result: 'Win' },
      { id: 5, pair: 'EURUSD', date: '2024-12-11', type: 'Long', entry: 1.0810, exit: 1.0856, pnl: 460, result: 'Win' },
    ],
  },
  equityCurve: Array.from({ length: 50 }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    equity: 10000 + Math.sin(i * 0.2) * 500 + i * 50 + Math.random() * 200,
  })),
};

export const tradeOpportunities = [
  {
    pair: 'EURUSD',
    price: 1.0876,
    condition: 'Trending',
    validity: 'Valid',
    confidence: 78,
    direction: 'Long',
    explanation: 'Strong bullish momentum detected. Price broke above key resistance at 1.0850. Market structure shows higher highs and higher lows. Recommended entry zone: 1.0865-1.0880.',
  },
  {
    pair: 'GBPUSD',
    price: 1.2654,
    condition: 'Ranging',
    validity: 'Almost',
    confidence: 52,
    direction: 'Neutral',
    explanation: 'Price consolidating within range. Waiting for breakout confirmation. Key levels: Support 1.2600, Resistance 1.2720. No clear directional bias.',
  },
  {
    pair: 'USDJPY',
    price: 149.82,
    condition: 'Trending',
    validity: 'Valid',
    confidence: 85,
    direction: 'Long',
    explanation: 'Strong uptrend intact. BOJ policy divergence supporting bullish bias. Clear BOS at 149.50. Target: 150.50, Stop: 149.20.',
  },
  {
    pair: 'AUDUSD',
    price: 0.6543,
    condition: 'Unclear',
    validity: 'Not valid',
    confidence: 28,
    direction: 'None',
    explanation: 'Mixed signals. Conflicting timeframe analysis. Recommend waiting for clarity. Major news events pending.',
  },
  {
    pair: 'USDCAD',
    price: 1.3621,
    condition: 'Trending',
    validity: 'Valid',
    confidence: 71,
    direction: 'Short',
    explanation: 'Bearish CHoCH identified at 1.3680. Oil prices supporting CAD strength. Entry zone: 1.3610-1.3630.',
  },
];

export const journalEntries = [
  {
    id: 1,
    date: '2024-12-18',
    pair: 'EURUSD',
    system: 'System 1',
    direction: 'Long',
    entry: 1.0845,
    exit: 1.0892,
    result: 'Win',
    pnl: 470,
    notes: 'Followed system rules perfectly. Entry on BOS confirmation. Exited at target.',
    emotion: 'Confident',
  },
  {
    id: 2,
    date: '2024-12-17',
    pair: 'GBPUSD',
    system: 'System 1',
    direction: 'Short',
    entry: 1.2701,
    exit: 1.2654,
    result: 'Win',
    pnl: 470,
    notes: 'Clean setup. CHoCH confirmed trend reversal. Held through minor pullback.',
    emotion: 'Calm',
  },
  {
    id: 3,
    date: '2024-12-16',
    pair: 'USDJPY',
    system: 'System 1',
    direction: 'Long',
    entry: 149.50,
    exit: 149.20,
    result: 'Loss',
    pnl: -200,
    notes: 'Stopped out. Entry was premature - should have waited for confirmation.',
    emotion: 'Frustrated',
  },
];

export const system1Rules = {
  name: 'System 1 - Market Structure Strategy',
  description: 'A mechanical trading system based on market structure analysis, focusing on Break of Structure (BOS) and Change of Character (CHoCH) patterns.',
  entryConditions: [
    'Identify clear market structure (Higher Highs/Higher Lows for uptrend, Lower Highs/Lower Lows for downtrend)',
    'Wait for Break of Structure (BOS) in the direction of the trend',
    'Confirm with Change of Character (CHoCH) on lower timeframe',
    'Enter on pullback to order block or FVG (Fair Value Gap)',
    'Ensure risk-to-reward ratio is at least 1:2',
  ],
  exitConditions: [
    'Take profit at next significant structure level',
    'Trail stop loss below/above swing points',
    'Exit if opposing CHoCH forms on entry timeframe',
    'Close partial position at 1:1 RR, let remainder run',
  ],
  riskRules: [
    'Maximum 1% risk per trade',
    'Maximum 3 open positions',
    'No trading during high-impact news',
    'Daily loss limit: 3%',
    'Weekly loss limit: 6%',
  ],
};

export const userSettings = {
  defaultPair: 'EURUSD',
  defaultTimeframe: 'H1',
  enabledSystems: ['system1'],
  notifications: true,
  soundAlerts: false,
  darkMode: true,
};
