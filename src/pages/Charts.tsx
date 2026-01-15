import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ISeriesApi, LineStyle, UTCTimestamp } from 'lightweight-charts';
import { API_BASE_URL } from '@/config/api';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  MousePointer,
  TrendingUp,
  Square,
  Type,
  Trash2,
} from 'lucide-react';

/* ---------------------------------------
   CONFIG
--------------------------------------- */
const tradingPairs = ['EURUSD', 'GBPJPY'] as const;
const timeframes = ['5m', '4h'] as const;

type Pair = typeof tradingPairs[number];
type Timeframe = typeof timeframes[number];

type CandleMessage = {
  type: 'candle';
  symbol: Pair;
  tf: Timeframe;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type MarketEventType = 'BOS' | 'PULLBACK_CONFIRMED' | 'CHOCH';

type MarketEvent = {
  id: string;
  type: MarketEventType;
  broken_level: number;
  time: string;
};

type MarketMessage = {
  symbol: Pair;
  timeframe: Timeframe;
  events: MarketEvent[];
};

/* ---------------------------------------
   TIMELINE GENERATOR - FIXED YEAR GRID
--------------------------------------- */
function generateYearTimeline(): { time: UTCTimestamp; value: number }[] {
  const timeline: { time: UTCTimestamp; value: number }[] = [];
  
  // Generate yearly points from 2020 to 2025
  for (let year = 2020; year <= 2025; year++) {
    const startOfYear = Date.UTC(year, 0, 1) / 1000;
    timeline.push({ time: startOfYear as UTCTimestamp, value: 1 });
  }
  
  // Add end point
  const endOf2025 = Date.UTC(2025, 11, 31, 23, 59, 59) / 1000;
  timeline.push({ time: endOf2025 as UTCTimestamp, value: 1 });
  
  return timeline;
}

/* ---------------------------------------
   CHART COMPONENT
--------------------------------------- */
const Charts: React.FC = () => {
  const [pair, setPair] = useState<Pair>('EURUSD');
  const [tf, setTf] = useState<Timeframe>('5m');
  const [chartMode, setChartMode] = useState<'plain' | 'system1'>('plain');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const candleSocketRef = useRef<WebSocket | null>(null);
  const marketSocketRef = useRef<WebSocket | null>(null);
  const autoScrollRef = useRef(true);
  const timeAnchorRef = useRef<any>(null);
  const marketDrawingsRef = useRef<Record<string, { line: any; lastType: MarketEventType }>>({});
  
  // Store candles in memory to prevent blanks/duplicates
  const candlesRef = useRef<Map<number, any>>(new Map());

  /* ---------------------------------------
     CUSTOM TICK MARK FORMATTER
  --------------------------------------- */
  const tickMarkFormatter = useCallback((time: number, tickMarkType: any, locale: any, chart: any) => {
    const date = new Date(time * 1000);
    const logicalRange = chart.timeScale().getVisibleLogicalRange();
    
    if (!logicalRange) return '';
    
    const rangeInSeconds = (logicalRange.to! - logicalRange.from!) * 
      (chart.timeScale().getBarSpacing() || 1) * 60; // Approximate range
    
    // Zoomed out: show only YEAR
    if (rangeInSeconds > 365 * 24 * 3600 * 0.5) { // More than 6 months
      return String(date.getUTCFullYear());
    }
    
    // Zoomed in: show detailed date
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${date.getUTCFullYear()}-${month}-${day}`;
  }, []);

  /* ---------------------------------------
     INIT CHART - FIXED GRID & TIMELINE
  --------------------------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: '#020617' }, textColor: '#cbd5e1' },
      grid: {
        vertLines: { 
          color: '#1e293b', 
          style: 0, 
          visible: true,
          lineWidth: 1
        },
        horzLines: { 
          color: '#1e293b', 
          style: 0, 
          visible: true,
          lineWidth: 1
        },
      },
      rightPriceScale: { 
        borderColor: '#334155', 
        scaleMargins: { top: 0.15, bottom: 0.15 } 
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 12,
        rightBarStaysOnScroll: true,
        fixRightEdge: true,
        borderColor: '#334155',
        // FIXED YEAR GRID - only shows years when zoomed out
        tickMarkFormatter: (time: number) => tickMarkFormatter(time, null, null, chart),
      },
      crosshair: {
        mode: 1,
        vertLine: { width: 1, color: '#475569', style: 0, labelBackgroundColor: '#020617' },
        horzLine: { width: 1, color: '#475569', style: 0, labelBackgroundColor: '#020617' },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false 
          });
        }
      }
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
    });

    // -----------------------------
    // FIXED TIME ANCHOR (2020-2025)
    // -----------------------------
    const timeAnchor = chart.addLineSeries({
      color: 'rgba(0,0,0,0)',
      lineWidth: 0,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: '',
    });

    // FIXED timeline: 2020-2025 yearly points (GRID REMAINS SAME)
    timeAnchor.setData(generateYearTimeline());
    timeAnchorRef.current = timeAnchor;

    // Initial view: full 2020-2025 range
    const start = Date.UTC(2020, 0, 1) / 1000 as UTCTimestamp;
    const end = Date.UTC(2025, 11, 31, 23, 59, 59) / 1000 as UTCTimestamp;
    chart.timeScale().setVisibleLogicalRange({ from: start, to: end });

    // Track auto-scroll
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (!range) return;
      const totalRange = chart.timeScale().getLogicalRange();
      autoScrollRef.current = range.to >= (totalRange?.to || 0) - 2;
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      candleSocketRef.current?.close();
      marketSocketRef.current?.close();
      chart.remove();
    };
  }, [tickMarkFormatter]); // Re-run when formatter updates

  /* ---------------------------------------
     CANDLE WEBSOCKET - PRECISE HANDLING
  --------------------------------------- */
  useEffect(() => {
    if (!seriesRef.current) return;
    candleSocketRef.current?.close();
    candlesRef.current.clear(); // Clear on TF change

    const ws = new WebSocket(API_BASE_URL.replace('http', 'ws') + '/ws/candles');
    candleSocketRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ symbol: pair, tf }));

    ws.onmessage = event => {
      const msg: CandleMessage = JSON.parse(event.data);
      if (msg.type !== 'candle' || msg.symbol !== pair || msg.tf !== tf) return;

      const candleTime = Math.floor(msg.timestamp / 1000);
      const candleKey = `${msg.symbol}-${msg.tf}-${candleTime}`;

      // PRECISE CANDLE HANDLING - NO BLANKS/DUPLICATES
      if (candlesRef.current.has(candleKey)) {
        // Update existing candle
        const existingCandle = candlesRef.current.get(candleKey)!;
        const updatedCandle = {
          time: candleTime,
          open: existingCandle.open,
          high: Math.max(existingCandle.high, msg.high),
          low: Math.min(existingCandle.low, msg.low),
          close: msg.close,
        };
        
        candlesRef.current.set(candleKey, updatedCandle);
        seriesRef.current!.update(updatedCandle);
      } else {
        // Add new candle
        const newCandle = {
          time: candleTime,
          open: msg.open,
          high: msg.high,
          low: msg.low,
          close: msg.close,
        };
        
        candlesRef.current.set(candleKey, newCandle);
        
        // Use updateBar for precise positioning (works with existing timeline)
        seriesRef.current!.update(newCandle);
      }

      // Auto-scroll only if at right edge
      if (autoScrollRef.current) {
        chartRef.current?.timeScale().scrollToRealTime();
      }
    };

    return () => ws.close();
  }, [pair, tf]);

  /* ---------------------------------------
     MARKET EVENTS WEBSOCKET (UNCHANGED)
  --------------------------------------- */
  useEffect(() => {
    marketSocketRef.current?.close();

    const ws = new WebSocket(API_BASE_URL.replace('http', 'ws') + '/ws/market');
    marketSocketRef.current = ws;

    ws.onmessage = event => {
      const msg: MarketMessage = JSON.parse(event.data);
      if (msg.symbol !== pair) return;

      msg.events.forEach(ev => {
        const timestamp = Math.floor(new Date(ev.time).getTime() / 1000);
        const price = ev.broken_level;
        const existing = marketDrawingsRef.current[ev.id];

        if (!existing) {
          const line = chartRef.current.addLineSeries({ 
            color: '#22c55e', 
            lineWidth: 2, 
            lineStyle: LineStyle.Solid 
          });
          line.setData([{ time: timestamp, value: price }, { time: timestamp + 1, value: price }]);
          marketDrawingsRef.current[ev.id] = { line, lastType: ev.type };
          return;
        }

        if (existing.lastType === ev.type) return;

        if (ev.type === 'PULLBACK_CONFIRMED')
          existing.line.applyOptions({ color: '#3b82f6', lineWidth: 3, lineStyle: LineStyle.Solid });
        if (ev.type === 'CHOCH')
          existing.line.applyOptions({ color: '#f59e0b', lineWidth: 3, lineStyle: LineStyle.Dashed });

        existing.lastType = ev.type;
      });
    };

    return () => ws.close();
  }, [pair]);

  /* ---------------------------------------
     UI (UNCHANGED)
  --------------------------------------- */
  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Charts</h1>
        <div className="flex gap-3">
          <Select value={pair} onValueChange={v => setPair(v as Pair)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tradingPairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tf} onValueChange={v => setTf(v as Timeframe)}>
            <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5M</SelectItem>
              <SelectItem value="4h">4H</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={chartMode} onValueChange={v => setChartMode(v as any)}>
        <TabsList>
          <TabsTrigger value="plain">Plain</TabsTrigger>
          <TabsTrigger value="system1">System 1</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 mt-3 relative">
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-20 left-3 bg-background/80 border rounded-md p-1 space-y-1">
          <MousePointer size={16} />
          <TrendingUp size={16} />
          <Square size={16} />
          <Type size={16} />
          <Trash2 size={16} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
