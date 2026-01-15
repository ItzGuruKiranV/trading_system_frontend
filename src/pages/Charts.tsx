import React, { useEffect, useRef, useState } from 'react';
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
import { MousePointer, TrendingUp, Square, Type, Trash2 } from 'lucide-react';

/* -------------------- CONFIG -------------------- */
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
type MarketEvent = { id: string; type: MarketEventType; broken_level: number; time: string };
type MarketMessage = { symbol: Pair; timeframe: Timeframe; events: MarketEvent[] };

/* -------------------- HELPERS -------------------- */
const pad = (n: number) => String(n).padStart(2, '0');
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* -------------------- CHART -------------------- */
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
  const marketDrawingsRef = useRef<Record<string, { line: any; lastType: MarketEventType }>>({});

  /* -------------------- INIT -------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: '#020617' }, textColor: '#cbd5e1' },
      grid: {
        vertLines: { color: '#1e293b', visible: true },
        horzLines: { color: '#1e293b', visible: true },
      },
      rightPriceScale: {
        borderColor: '#334155',
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        barSpacing: 10,
        fixRightEdge: true,
        rightBarStaysOnScroll: true,
        borderColor: '#334155',
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#475569' },
        horzLine: { color: '#475569' },
      },
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

    /* ---------- TIME ANCHOR ---------- */
    const anchor = chart.addLineSeries({
      color: 'rgba(0,0,0,0)',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: '',
    });

    const step = 5 * 60;
    const start = Date.UTC(2020, 0, 15) / 1000;
    const end   = Date.UTC(2026, 0, 15, 23, 55) / 1000;

    const data = [];
    for (let t = start; t <= end; t += step)
      data.push({ time: t as UTCTimestamp, value: 1 });

    anchor.setData(data);
    chart.timeScale().setVisibleLogicalRange({ from: start, to: end });

    /* ---------- TRADINGVIEW-LIKE AXIS ---------- */
    const applyAxisLogic = () => {
      const range = chart.timeScale().getVisibleLogicalRange();
      if (!range) return;

      const bars = range.to - range.from;

      // Dynamic visibility
      chart.timeScale().applyOptions({
        timeVisible: bars < 500,
        secondsVisible: bars < 50,
      });

      chart.timeScale().applyOptions({
        tickMarkFormatter: (time: UTCTimestamp) => {
          const d = new Date(time * 1000);
          const h = d.getUTCHours();
          const m = d.getUTCMinutes();

          // ZOOM 0 — YEARS (MAX ZOOM OUT)
          if (bars > 5000) {
            // Show year once per year (January candles)
            return d.getUTCMonth() === 0 && d.getUTCDate() <= 3
              ? `${d.getUTCFullYear()}`
              : '';
          }

          // ZOOM 1 — DAYS (FEW DAYS)
          if (bars > 1000) {
            // Show day numbers at midnight
            return h === 0 && m === 0
              ? `${d.getUTCDate()}`
              : '';
          }


          // ZOOM 2 — DAYS
          if (bars > 300) {
            return h === 0 && m === 0 ? `${d.getUTCDate()}` : '';
          }

          // ZOOM 3 — HOURS (3h)
          if (bars > 80) {
            return m === 0 && h % 3 === 0 ? `${pad(h)}:00` : '';
          }

          // ZOOM 4 — HOURS
          if (bars > 30) {
            return m === 0 ? `${pad(h)}:00` : '';
          }

          // ZOOM 5 — 15 MIN
          if (bars > 10) {
            return m % 15 === 0 ? `${pad(h)}:${pad(m)}` : '';
          }

          // ZOOM 6 — 5 MIN
          return m % 5 === 0 ? `${pad(h)}:${pad(m)}` : '';
        },
      });
    };

    applyAxisLogic();
    chart.timeScale().subscribeVisibleLogicalRangeChange(applyAxisLogic);

    chartRef.current = chart;
    seriesRef.current = series;

    return () => chart.remove();
  }, []);

  /* -------------------- SOCKETS (UNCHANGED) -------------------- */
  useEffect(() => {
    if (!seriesRef.current) return;
    candleSocketRef.current?.close();

    const ws = new WebSocket(API_BASE_URL.replace('http', 'ws') + '/ws/candles');
    candleSocketRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ symbol: pair, tf }));

    ws.onmessage = e => {
      const m: CandleMessage = JSON.parse(e.data);
      if (m.symbol !== pair || m.tf !== tf) return;

      seriesRef.current!.update({
        time: Math.floor(m.timestamp / 1000),
        open: m.open,
        high: m.high,
        low: m.low,
        close: m.close,
      });

      if (autoScrollRef.current)
        chartRef.current?.timeScale().scrollToRealTime();
    };

    return () => ws.close();
  }, [pair, tf]);

  /* -------------------- UI -------------------- */
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
