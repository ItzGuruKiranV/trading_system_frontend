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

/* -------------------- CHART COMPONENT -------------------- */
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

  /* -------------------- INIT CHART -------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: '#020617' }, textColor: '#cbd5e1' },
      grid: {
        vertLines: { color: '#1e293b', style: 0, visible: true },
        horzLines: { color: '#1e293b', style: 0, visible: true },
      },
      rightPriceScale: { borderColor: '#334155', scaleMargins: { top: 0.15, bottom: 0.15 } },
      timeScale: {
        timeVisible: true,
        secondsVisible: true, // show minutes when zoomed in
        barSpacing: 10,
        fixRightEdge: true,
        rightBarStaysOnScroll: true,
        borderColor: '#334155',
      },
      crosshair: {
        mode: 1,
        vertLine: { width: 1, color: '#475569', style: 0, labelBackgroundColor: '#020617' },
        horzLine: { width: 1, color: '#475569', style: 0, labelBackgroundColor: '#020617' },
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

    /* -------------------- TIME ANCHOR -------------------- */
    const timeAnchor = chart.addLineSeries({
      color: 'rgba(0,0,0,0)',
      lineWidth: 0,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: '',
    });

    const start = Date.UTC(2020, 0, 1) / 1000;
    const end = Date.UTC(2025, 11, 31, 23, 59, 59) / 1000;
    const step = 24 * 60 * 60;
    const timelinePoints: { time: UTCTimestamp; value: number }[] = [];
    for (let t = start; t <= end; t += step) {
      timelinePoints.push({ time: t as UTCTimestamp, value: 1 });
    }
    timeAnchor.setData(timelinePoints);

    chart.timeScale().setVisibleLogicalRange({ from: start, to: end });

    /* -------------------- HIERARCHICAL TICK FORMATTER -------------------- */
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const updateTickFormatter = () => {
      chart.timeScale().applyOptions({
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          const range = chart.timeScale().getVisibleLogicalRange();
          if (!range) return '';
          const visibleBars = range.to - range.from;

          // Hierarchical logic
          if (visibleBars > 5000) return `${date.getUTCFullYear()}`; // Years
          if (visibleBars > 500) return `${date.getUTCFullYear()} ${monthNames[date.getUTCMonth()]}`; // Months inside years
          if (visibleBars > 50) return `${date.getUTCDate()}`; // Days inside months
          if (visibleBars > 10) return `${String(date.getUTCHours()).padStart(2,'0')}:00`; // Hours inside days
          return `${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`; // Minutes inside hours
        },
      });
    };

    updateTickFormatter();
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => updateTickFormatter());

    chartRef.current = chart;
    seriesRef.current = series;

    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (!range) return;
      autoScrollRef.current = range.to >= chart.timeScale().getLogicalRange()?.to! - 2;
    });

    return () => {
      candleSocketRef.current?.close();
      marketSocketRef.current?.close();
      chart.remove();
    };
  }, []);

  /* -------------------- CANDLE SOCKET -------------------- */
  useEffect(() => {
    if (!seriesRef.current) return;
    candleSocketRef.current?.close();

    const ws = new WebSocket(API_BASE_URL.replace('http', 'ws') + '/ws/candles');
    candleSocketRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ symbol: pair, tf }));
    ws.onmessage = (event) => {
      const msg: CandleMessage = JSON.parse(event.data);
      if (msg.type !== 'candle' || msg.symbol !== pair || msg.tf !== tf) return;
      seriesRef.current!.update({
        time: Math.floor(msg.timestamp / 1000),
        open: msg.open,
        high: msg.high,
        low: msg.low,
        close: msg.close,
      });
      if (autoScrollRef.current) chartRef.current?.timeScale().scrollToRealTime();
    };

    return () => ws.close();
  }, [pair, tf]);

  /* -------------------- MARKET SOCKET -------------------- */
  useEffect(() => {
    marketSocketRef.current?.close();
    const ws = new WebSocket(API_BASE_URL.replace('http', 'ws') + '/ws/market');
    marketSocketRef.current = ws;

    ws.onmessage = (event) => {
      const msg: MarketMessage = JSON.parse(event.data);
      if (msg.symbol !== pair) return;
      msg.events.forEach(ev => {
        const timestamp = Math.floor(new Date(ev.time).getTime() / 1000);
        const price = ev.broken_level;
        const existing = marketDrawingsRef.current[ev.id];

        if (!existing) {
          const line = chartRef.current.addLineSeries({ color: '#22c55e', lineWidth: 2, lineStyle: LineStyle.Solid });
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

  /* -------------------- UI -------------------- */
  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Charts</h1>
        <div className="flex gap-3">
          <Select value={pair} onValueChange={v => setPair(v as Pair)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{tradingPairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
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
