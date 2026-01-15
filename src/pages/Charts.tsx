import React, { useEffect, useRef, useState } from 'react';
import { createChart, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
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

/* -------------------- HELPERS -------------------- */
const pad = (n: number) => String(n).padStart(2, '0');

/* -------------------- TIME WINDOW LIMIT -------------------- */
const MAX_VISIBLE_SECONDS =
  9 * 24 * 60 * 60 +
  9 * 60 * 60 +
  50 * 60;

/* -------------------- COMPONENT -------------------- */
const Charts: React.FC = () => {
  const [pair, setPair] = useState<Pair>('EURUSD');
  const [tf, setTf] = useState<Timeframe>('5m');
  const [chartMode, setChartMode] = useState<'plain' | 'system1'>('plain');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const candleSocketRef = useRef<WebSocket | null>(null);
  const autoScrollRef = useRef(true);

  /* -------------------- INIT CHART -------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: '#020617' },
        textColor: '#cbd5e1',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      rightPriceScale: {
        borderColor: '#334155',
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        fixRightEdge: true,
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#475569' },
        horzLine: { color: '#475569' },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
    });

    /* ---------- SERIES ---------- */
    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
      },
    });
    /* ---------- DUMMY PRICE SERIES (FOR PRICE AXIS) ---------- */
    const priceDummy = chart.addLineSeries({
      color: 'rgba(0,0,0,0)',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const nowSec = Math.floor(Date.now() / 1000);

    priceDummy.setData([
      { time: (nowSec - 60) as UTCTimestamp, value: 0 },
      { time: nowSec as UTCTimestamp, value: 2 },
    ]);


    /* ---------- TIME ANCHOR ---------- */
    const anchor = chart.addLineSeries({
      color: 'rgba(0,0,0,0)',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: '',
    });

    const START = Date.UTC(2020, 0, 1) / 1000;
    const END = Date.UTC(2026, 11, 31, 23, 59) / 1000;
    const STEP = 5 * 60;

    const anchorData = [];
    for (let t = START; t <= END; t += STEP) {
      anchorData.push({ time: t as UTCTimestamp, value: 1 });
    }
    anchor.setData(anchorData);

    /* ---------- INITIAL WINDOW ---------- */
    const now = Math.floor(Date.now() / 1000);
    chart.timeScale().setVisibleRange({
      from: (now - MAX_VISIBLE_SECONDS) as UTCTimestamp,
      to: now as UTCTimestamp,
    });

    /* ---------- CLAMP ZOOM OUT ---------- */
    chart.timeScale().subscribeVisibleTimeRangeChange(range => {
      if (!range) return;
      if (range.to - range.from > MAX_VISIBLE_SECONDS) {
        chart.timeScale().setVisibleRange({
          from: (range.to - MAX_VISIBLE_SECONDS) as UTCTimestamp,
          to: range.to as UTCTimestamp,
        });
      }
    });

    /* ---------- X AXIS FORMAT ---------- */
    chart.timeScale().applyOptions({
      tickMarkFormatter: (time: UTCTimestamp) => {
        const d = new Date(time * 1000);
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth();
        const day = d.getUTCDate();
        const h = d.getUTCHours();
        const min = d.getUTCMinutes();

        const range = chart.timeScale().getVisibleRange();
        if (!range) return '';

        const span = range.to - range.from;

        if (span > 3600 * 24 * 60) {
          return day === 1 ? d.toLocaleString('en', { month: 'short' }) : '';
        }

        if (span > 3600 * 24 * 2) {
          if (h !== 0) return '';
          if (day === 1) {
            return m === 0
              ? String(y)
              : d.toLocaleString('en', { month: 'short' });
          }
          return String(day);
        }

        if (span > 3600 * 2) {
          return min === 0 ? `${pad(h)}:00` : '';
        }

        return min % 5 === 0 ? `${pad(h)}:${pad(min)}` : '';
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => chart.remove();
  }, []);

  /* -------------------- SOCKETS -------------------- */
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

      if (autoScrollRef.current) {
        chartRef.current?.timeScale().scrollToRealTime();
      }
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
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tradingPairs.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tf} onValueChange={v => setTf(v as Timeframe)}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
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
