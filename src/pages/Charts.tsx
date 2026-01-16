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
const VISIBLE_CANDLES = 500;
const TF_SECONDS: Record<Timeframe, number> = {
  '5m': 5 * 60,
  '4h': 4 * 60 * 60,
};
const BOS_CANDLE_LENGTH = 5;



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
  const firstCandleRef = useRef(true);
  const maxWindowSecondsRef = useRef<number>(0);
  const marketEventsRef = useRef<Record<Pair, any[]>>({
    EURUSD: [],
    GBPJPY: [],
  });
  const marketSeriesRef = useRef<any[]>([]);
  const tfRef = useRef<Timeframe>(tf);
  const anchorRef = useRef<any>(null);

  
  useEffect(() => {
    tfRef.current = tf;
  }, [tf]);

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

    const priceDummy = chart.addLineSeries({
      color: 'rgba(0,0,0,0)',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const nowSec = Math.floor(Date.now() / 1000);
    priceDummy.setData([
      { time: (nowSec - 60) as UTCTimestamp, value: 1.0 },
      { time: nowSec as UTCTimestamp, value: 1.2 },
    ]);

    const now = Math.floor(Date.now() / 1000);

    chart.timeScale().subscribeVisibleTimeRangeChange(range => {
      if (!range) return;

      const maxWindow = maxWindowSecondsRef.current;
      if (!maxWindow) return;

      if (range.to - range.from > maxWindow) {
        chart.timeScale().setVisibleRange({
          from: (range.to - maxWindow) as UTCTimestamp,
          to: range.to as UTCTimestamp,
        });
      }
    });


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


  // -------------------- DRAW MARKET EVENTS -------------------- //
  const drawMarketEvent = (data: any) => {
    if (!chartRef.current) return;
    if (data.timeframe?.toLowerCase() !== tfRef.current.toLowerCase()) return;

    const events = Array.isArray(data.events)
      ? data.events
      : [data];

    for (const event of events) {
      let series = null;

      if (event.type === 'BOS') series = drawBOS(event);
      if (event.type === 'PULLBACK_CONFIRMED') series = drawPullbackConfirmed(event);
      if (event.type === 'CHOCH') series = drawCHOCH(event);
      if (event.type === 'POI-OB') drawPOI_OB(event);
      if (event.type === 'POI-LIQ') series = drawPOILIQ(event);
      if (event.type === 'RETRACEMENT') drawRetracement(event);

      if (series) marketSeriesRef.current.push(series);
    }
  };

// draw BOS
  const drawBOS = (event: any) => {
    if (!chartRef.current) return;

    const candleSeconds = TF_SECONDS[tfRef.current]; // ✅ FIX
    const lengthSeconds = candleSeconds * BOS_CANDLE_LENGTH;

    const startTime = Math.floor(new Date(event.time).getTime() / 1000);
    const price = event.broken_level;

    const series = chartRef.current.addLineSeries({
      color: event.direction === 'BULLISH' ? '#22c55e' : '#ef4444',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    series.setData([
      { time: startTime as UTCTimestamp, value: price },
      { time: (startTime + lengthSeconds) as UTCTimestamp, value: price },
    ]);

    return series;
  };


  // draw PULLBACK CONFIRMED
  const drawPullbackConfirmed = (event: any) => {
    if (!chartRef.current) return;

    const time = Math.floor(new Date(event.time).getTime() / 1000);
    const price = event.broken_level;

    const pbSeries = chartRef.current.addLineSeries({
      color: '#facc15',
      lineWidth: 0,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      pointMarkersVisible: true,
      pointMarkersRadius: 6,
    });

    pbSeries.setData([
      { time: time as UTCTimestamp, value: price },
    ]);
    return pbSeries; 

  };

  // draw CHOCH
  const drawCHOCH = (event: any) => {
    if (!chartRef.current) return;

    const candleSeconds = TF_SECONDS[tfRef.current]; 
    const lengthSeconds = candleSeconds * 10;

    const startTime = Math.floor(new Date(event.time).getTime() / 1000);
    const price = event.broken_level;

    const series = chartRef.current.addLineSeries({
      color: '#ffffff',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    series.setData([
      { time: startTime as UTCTimestamp, value: price },
      { time: (startTime + lengthSeconds) as UTCTimestamp, value: price },
    ]);

    return series; 
  };
  
  // draw POI-OB
  const drawPOI_OB = (event: any) => {
    if (!chartRef.current) return;

    const start = Math.floor(new Date(event.time_start).getTime() / 1000);
    const end = Math.floor(new Date(event.time_end).getTime() / 1000);

    const high = event.high;
    const low = event.low;

    const EPS = 1;
    const color = '#facc15'; 

    const createLine = () =>
      chartRef.current!.addLineSeries({
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });

    const top = createLine();
    top.setData([
      { time: start as UTCTimestamp, value: high },
      { time: end as UTCTimestamp, value: high },
    ]);

    const bottom = createLine();
    bottom.setData([
      { time: start as UTCTimestamp, value: low },
      { time: end as UTCTimestamp, value: low },
    ]);

    const left = createLine();
    left.setData([
      { time: start as UTCTimestamp, value: low },
      { time: (start + EPS) as UTCTimestamp, value: high },
    ]);

    const right = createLine();
    right.setData([
      { time: end as UTCTimestamp, value: low },
      { time: (end + EPS) as UTCTimestamp, value: high },
    ]);

    marketSeriesRef.current.push(top, bottom, left, right);
  };

  // draw POI-LIQ
  const drawPOILIQ = (event: any) => {
    if (!chartRef.current) return;

    const candleSeconds = TF_SECONDS[tfRef.current];
    const lengthSeconds = candleSeconds * 10;

    const startTime = Math.floor(new Date(event.time).getTime() / 1000);
    const price = event.price;

    const series = chartRef.current.addLineSeries({
      color: '#22d3ee',
      lineWidth: 1,
      lineStyle: 2, 
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    series.setData([
      { time: startTime as UTCTimestamp, value: price },
      { time: (startTime + lengthSeconds) as UTCTimestamp, value: price },
    ]);

    return series;
  };

  // draw RETRACEMENT

  const drawRetracement = (event: any) => {
    if (!chartRef.current) return;

    const start = Math.floor(new Date(event.time_start).getTime() / 1000);
    const end   = Math.floor(new Date(event.time_end).getTime() / 1000);

    // extend by 1 candle (5m = 300s)
    const extend = end + 300;

    const { high, mid, low } = event;

    // ---------- UPPER: HIGH → MID ----------
    const upperArea = chartRef.current.addAreaSeries({
      topColor: 'rgba(248, 56, 72, 0.35)',
      bottomColor: 'rgba(12, 12, 12, 0.15)',
      lineColor: 'rgba(197, 248, 56, 0.8)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      baseValue: { type: 'price', price: mid },
    });

    upperArea.setData([
      { time: start as UTCTimestamp, value: high },
      { time: extend as UTCTimestamp, value: high },
    ]);

    // ---------- LOWER: MID → LOW ----------
    const lowerArea = chartRef.current.addAreaSeries({
      topColor: 'rgba(199, 231, 15, 0.2)',
      bottomColor: 'rgba(56,189,248,0.05)',
      lineColor: 'rgba(0,0,0,0)',
      lineWidth: 0,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      baseValue: { type: 'price', price: mid },
    });

    lowerArea.setData([
      { time: start as UTCTimestamp, value: low },
      { time: extend as UTCTimestamp, value: low },
    ]);

    // ---------- MID LINE ----------
    const midLine = chartRef.current.addLineSeries({
      color: '#1bcc0b',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    midLine.setData([
      { time: start as UTCTimestamp, value: mid },
      { time: extend as UTCTimestamp, value: mid },
    ]);

    marketSeriesRef.current.push(upperArea, lowerArea, midLine);
  };







  /* -------------------- MARKET EVENTS SOCKET -------------------- */
  useEffect(() => {
    const ws = new WebSocket(
        API_BASE_URL.replace('http', 'ws') + '/ws/market'
      );

    ws.onmessage = e => {
      const data = JSON.parse(e.data);

      if (data.symbol !== pair) return;

      marketEventsRef.current[pair].push(data);

      if (data.timeframe?.toLowerCase() === tfRef.current.toLowerCase()) {
        drawMarketEvent(data);
      }
    };
    return () => ws.close();
  }, [pair]);
 

  /* -------------------- REDRAW MARKET EVENTS ON TF CHANGE -------------------- */
  useEffect(() => {
    if (!chartRef.current) return;
    marketSeriesRef.current.forEach(series =>
      chartRef.current.removeSeries(series)
    );
    marketSeriesRef.current = [];
    marketEventsRef.current[pair]
      .filter(e => e.timeframe?.toLowerCase() === tf.toLowerCase())
      .forEach(drawMarketEvent);
  }, [tf]);


  /* -------------------- CLEAR MARKET EVENTS ON PAIR CHANGE -------------------- */
  useEffect(() => {
    if (!chartRef.current) return;
    marketSeriesRef.current.forEach(series =>
      chartRef.current.removeSeries(series)
    );
    marketSeriesRef.current = [];
  }, [pair]);


  /* -------------------- TIME ANCHOR (TF-AWARE) -------------------- */
  useEffect(() => {
    if (!chartRef.current) return;

    if (anchorRef.current) {
      chartRef.current.removeSeries(anchorRef.current);
      anchorRef.current = null;
    }

    const anchor = chartRef.current.addLineSeries({
      color: 'rgba(0,0,0,0)',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceScaleId: '',
    });

    anchorRef.current = anchor;

    const START = Date.UTC(2020, 0, 1) / 1000;
    const END = Date.UTC(2026, 11, 31, 23, 59) / 1000;
    const STEP = tf === '4h' ? 4 * 60 * 60 : 5 * 60;

    const data = [];
    for (let t = START; t <= END; t += STEP) {
      data.push({ time: t as UTCTimestamp, value: 1 });
    }

    anchor.setData(data);
  }, [tf]);


  /* -------------------- SOCKETS -------------------- */
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData([]);
    }

    firstCandleRef.current = true;

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

    if (firstCandleRef.current) {
      const tfSeconds = TF_SECONDS[tf];
      const windowSeconds = tfSeconds * VISIBLE_CANDLES;

      maxWindowSecondsRef.current = windowSeconds;

      const t = Math.floor(m.timestamp / 1000);

      chartRef.current?.timeScale().setVisibleRange({
        from: (t - windowSeconds) as UTCTimestamp,
        to: t as UTCTimestamp,
      });

      seriesRef.current?.priceScale().applyOptions({
        autoScale: true,
      });

      firstCandleRef.current = false;
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
