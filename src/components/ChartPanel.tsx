import React, { useEffect, useRef, useState } from 'react';
import { createChart, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import {
  subscribeToMarket,
  subscribeToCandlesLoaded,
  getrenderQueue,
  getCandles,
  getStoreEvents,

} from '@/data/marketStore';


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


// drawnEventIdsRef must be a component ref (hooks cannot be used at module scope)

/* -------------------- COMPONENT -------------------- */
const ChartPanel: React.FC = () => {
  const [pair, setPair] = useState<Pair>('EURUSD');
  const [tf, setTf] = useState<Timeframe>('5m');
  const [chartMode, setChartMode] = useState<'plain' | 'system1'>('plain');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const autoScrollRef = useRef(true);
  const firstCandleRef = useRef(true);
  const maxWindowSecondsRef = useRef<number>(0);
  const marketSeriesRef = useRef<any[]>([]);
  const tfRef = useRef<Timeframe>(tf);
  const pairRef = useRef<Pair>(pair);
  const anchorRef = useRef<any>(null);
  const drawnEventIdsRef = useRef<Set<string>>(new Set());




  const [isConnected] = useState(true);

  /* -------------------- REFS SYNC -------------------- */
  useEffect(() => {
    tfRef.current = tf;
  }, [tf]);
  useEffect(() => {
    pairRef.current = pair;
  }, [pair]);

  /* -------------------- PAIR / TF CHANGE (LOCAL RESET ONLY) -------------------- */
  useEffect(() => {
    firstCandleRef.current = true;
    drawnEventIdsRef.current.clear();

    // Clear drawn market structures
    if (chartRef.current) {
      marketSeriesRef.current.forEach(s =>
        chartRef.current.removeSeries(s)
      );
      marketSeriesRef.current = [];
    }
  }, [pair, tf]);

  // Rehydrate from permanent store when pair or tf changes (do NOT mutate store)
  useEffect(() => {
    const events = getStoreEvents(pair);

    for (const ev of events) {
      if (!ev.id) continue;
      if ((ev.timeframe ?? ev.tf ?? '').toString().toLowerCase() !== tf.toLowerCase()) continue;
      if (drawnEventIdsRef.current.has(ev.id)) continue;

      drawMarketEvent({ symbol: pair, timeframe: tf, events: [ev] });
      drawnEventIdsRef.current.add(ev.id);
    }
  }, [pair, tf]);


  /* -------------------- INIT CHART -------------------- */
  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;

    const handleResize = () => {
      chartRef.current.applyOptions({
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
      });
    };

    // ✅ immediately resize chart on mount
    handleResize();

    // ✅ also listen to window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
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
        precision: pair === 'GBPJPY' ? 3 : 5,
        minMove: pair === 'GBPJPY' ? 0.001 : 0.00001,
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

      if ((range.to as number) - (range.from as number) > maxWindow) {
        chart.timeScale().setVisibleRange({
          from: ((range.to as number) - maxWindow) as UTCTimestamp,
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

        // Ensure range.to and range.from are numbers
        const fromNum = typeof range.from === 'number' ? range.from : Number(range.from);
        const toNum = typeof range.to === 'number' ? range.to : Number(range.to);
        const span = toNum - fromNum;

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

    // Debug: BOS/CHOCH 5m
    if (data.events && data.events.some((e: any) => (e.type === 'BOS' || e.type === 'CHOCH') && data.timeframe === '5m')) {
      console.log('👀 [ChartPanel] drawMarketEvent called for 5m BOS/CHOCH. TF Check:', data.timeframe, 'vs', tfRef.current);
    }

    if (data.timeframe?.toLowerCase() !== tfRef.current.toLowerCase()) {
      if (data.events && data.events.some((e: any) => (e.type === 'BOS' || e.type === 'CHOCH') && data.timeframe === '5m')) {
        console.warn('❌ [ChartPanel] Skipped 5m BOS/CHOCH due to TF mismatch in drawMarketEvent:', data.timeframe, tfRef.current);
      }
      return;
    }

    const events = Array.isArray(data.events)
      ? data.events
      : [data];

    for (const event of events) {
      let series = null;

      if (event.type === 'BOS') series = drawBOS(event);
      if (event.type === 'PULLBACK_CONFIRMED') series = drawPullbackConfirmed(event);
      if (event.type === 'CHOCH') series = drawCHOCH(event);
      if (event.type === 'POI-OB') series = drawPOI_OB(event);
      if (event.type === 'POI-LIQ') series = drawPOILIQ(event);
      if (event.type === 'RETRACEMENT') drawRetracement(event);
      if (event.type === 'TRADE_PLAN') drawTradePlan(event);
      if (event.type === 'POI-TAP') series = drawPOITAP(event);

      if (series) marketSeriesRef.current.push(series);
    }
  };

  // draw BOS
  const drawBOS = (event: any) => {
    if (!chartRef.current) return;
    if (tfRef.current === '5m') console.log('✅ [ChartPanel] drawBOS (5m) triggered:', event);

    const candleSeconds = TF_SECONDS[tfRef.current];
    const lengthSeconds = candleSeconds * 7; // ✅ next 7 candles

    const startTime = Math.floor(new Date(event.time + 'Z').getTime() / 1000);
    const endTime = startTime + lengthSeconds;
    const midTime = startTime + Math.floor(lengthSeconds / 2);

    const price = event.broken_level;

    const series = chartRef.current.addLineSeries({
      color: '#ffffff', // ✅ white line
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // ✅ BOS horizontal line
    series.setData([
      { time: startTime as UTCTimestamp, value: price },
      { time: endTime as UTCTimestamp, value: price },
    ]);

    // ✅ "B" marker in the middle
    series.setMarkers([
      {
        time: midTime as UTCTimestamp,
        position: 'aboveBar',
        color: '#ffffff',
        shape: 'text',
        text: 'BOS',
      },
    ]);

    return series;
  };

  // draw CHOCH
  const drawCHOCH = (event: any) => {
    if (!chartRef.current) return;
    if (tfRef.current === '5m') console.log('✅ [ChartPanel] drawCHOCH (5m) triggered:', event);

    const candleSeconds = TF_SECONDS[tfRef.current];
    const lengthSeconds = candleSeconds * 7; // ✅ next 7 candles

    const startTime = Math.floor(new Date(event.time + 'Z').getTime() / 1000);
    const endTime = startTime + lengthSeconds;
    const midTime = startTime + Math.floor(lengthSeconds / 2);

    const price = event.broken_level;

    const series = chartRef.current.addLineSeries({
      color: '#ffffff', // ✅ white line
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // ✅ BOS horizontal line
    series.setData([
      { time: startTime as UTCTimestamp, value: price },
      { time: endTime as UTCTimestamp, value: price },
    ]);

    // ✅ "B" marker in the middle
    series.setMarkers([
      {
        time: midTime as UTCTimestamp,
        position: 'aboveBar',
        color: '#ffffff',
        shape: 'text',
        text: 'CHOCH',
      },
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

  // draw POI-OB
  const drawPOI_OB = (event: any) => {
    if (!chartRef.current) return;

    const start = Math.floor(new Date(event.time_start).getTime() / 1000);
    const end = Math.floor(new Date(event.time_end).getTime() / 1000);

    const { high, low } = event;

    // ---------- POI / OB AREA ----------
    const obBaseline = chartRef.current.addBaselineSeries({
      baseValue: { type: 'price', price: low },

      // bottom = fill from low → high
      bottomLineColor: 'transparent',
      bottomFillColor1: 'transparent',
      bottomFillColor2: 'transparent',

      // top = fill area
      topLineColor: '#79651880',
      topFillColor1: 'rgba(250, 204, 21, 0.25)',
      topFillColor2: 'rgba(250, 204, 21, 0.15)',

      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    obBaseline.setData([
      { time: start as UTCTimestamp, value: high },
      { time: end as UTCTimestamp, value: high },
    ]);

    return obBaseline;
  };

  // draw POI-LIQ
  const drawPOILIQ = (event: any) => {
    if (!chartRef.current) return;

    const candleSeconds = TF_SECONDS[tfRef.current];
    const lengthSeconds = candleSeconds * 10;

    const startTime = Math.floor(new Date(event.time + 'Z').getTime() / 1000);
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

    // ---------------- TIME ----------------
    const startTime = Math.floor(
      new Date(event.time_start).getTime() / 1000
    );
    const endTime = Math.floor(
      new Date(event.time_end).getTime() / 1000
    );

    const candleSeconds = TF_SECONDS[tfRef.current];
    const extendSeconds =
      candleSeconds * (event.extend_candles ?? 1);

    const extendTime = endTime + extendSeconds;

    // ---------------- PRICE NORMALIZATION ----------------
    // Use provided high/low if present, else derive from start/end
    const rawHigh =
      event.high ?? Math.max(event.start, event.end);
    const rawLow =
      event.low ?? Math.min(event.start, event.end);

    const high = Math.max(rawHigh, rawLow);
    const low = Math.min(rawHigh, rawLow);

    // Mid must ALWAYS sit between high & low
    const mid =
      event.mid ?? (high + low) / 2;

    // ---------------- UPPER ZONE (HIGH → MID) ----------------
    const upperBaseline = chartRef.current.addBaselineSeries({
      baseValue: { type: 'price', price: mid },

      topLineColor: 'rgba(248, 56, 72, 1)',
      topFillColor1: 'rgba(248, 56, 72, 0.35)',
      topFillColor2: 'rgba(248, 56, 72, 0.2)',

      bottomLineColor: 'transparent',
      bottomFillColor1: 'transparent',
      bottomFillColor2: 'transparent',

      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    upperBaseline.setData([
      { time: startTime as UTCTimestamp, value: high },
      { time: extendTime as UTCTimestamp, value: high },
    ]);

    // ---------------- LOWER ZONE (MID → LOW) ----------------
    const lowerBaseline = chartRef.current.addBaselineSeries({
      baseValue: { type: 'price', price: mid },

      bottomLineColor: 'rgba(56,189,248,0.3)',
      bottomFillColor1: 'rgba(56,189,248,0.08)',
      bottomFillColor2: 'rgba(56,189,248,0.05)',

      topLineColor: 'transparent',
      topFillColor1: 'transparent',
      topFillColor2: 'transparent',

      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    lowerBaseline.setData([
      { time: startTime as UTCTimestamp, value: low },
      { time: extendTime as UTCTimestamp, value: low },
    ]);

    // ---------------- MID LINE ----------------
    const midLine = chartRef.current.addLineSeries({
      color: '#1bcc0b',
      lineWidth: 1,
      lineStyle: 2, // dashed
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    midLine.setData([
      { time: startTime as UTCTimestamp, value: mid },
      { time: extendTime as UTCTimestamp, value: mid },
    ]);

    // ---------------- TRACK SERIES (for cleanup) ----------------
    marketSeriesRef.current.push(
      upperBaseline,
      lowerBaseline,
      midLine
    );
  };

  // draw POI TAP
  const drawPOITAP = (event: any) => {
    if (!chartRef.current) return;

    const time = Math.floor(new Date(event.time).getTime() / 1000);
    const price = event.POI_TAP;

    const tapSeries = chartRef.current.addLineSeries({
      color: '#22c55e',
      lineWidth: 0,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      pointMarkersVisible: true,
      pointMarkersRadius: 7,
    });

    tapSeries.setMarkers([
      {
        time: time as UTCTimestamp,
        position: 'belowBar',
        color: '#22c55e',
        shape: 'diamond',
        text: 'POI TAP',
      },
    ]);

    tapSeries.setData([
      { time: time as UTCTimestamp, value: price },
    ]);

    return tapSeries;
  };

  // draw TRADE PLAN
  const drawTradePlan = (event: any) => {
    if (!chartRef.current) return;

    // ---------------- TIME ----------------
    const startTime = Math.floor(
      new Date(event.time_start).getTime() / 1000
    );
    const endTime = Math.floor(
      new Date(event.time_end).getTime() / 1000
    );
    const extend_candles = 5
    const candleSeconds = TF_SECONDS[tfRef.current];
    const extendTime =
      endTime + candleSeconds * (extend_candles ?? 1);

    // ---------------- PRICE ----------------
    const TP = event.TP;
    const SL = event.SL;
    const Entry = event.Entry;

    const isLong = event.plan_direction === 'LONG';

    // ---------------- PROFIT ZONE ----------------
    const profitBaseline = chartRef.current.addBaselineSeries({
      baseValue: {
        type: 'price',
        price: Entry,
      },

      // GREEN = profit
      topLineColor: isLong ? 'rgba(36, 119, 54, 0.9)' : 'transparent',
      topFillColor1: isLong ? 'rgba(36, 119, 54, 0.35)' : 'transparent',
      topFillColor2: isLong ? 'rgba(36, 119, 54, 0.2)' : 'transparent',

      bottomLineColor: !isLong ? 'rgba(36, 119, 54, 0.9)' : 'transparent',
      bottomFillColor1: !isLong ? 'rgba(36, 119, 54, 0.35)' : 'transparent',
      bottomFillColor2: !isLong ? 'rgba(36, 119, 54, 0.2)' : 'transparent',

      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    profitBaseline.setData([
      {
        time: startTime as UTCTimestamp,
        value: isLong ? TP : TP,
      },
      {
        time: extendTime as UTCTimestamp,
        value: isLong ? TP : TP,
      },
    ]);

    // ---------------- LOSS ZONE ----------------
    const lossBaseline = chartRef.current.addBaselineSeries({
      baseValue: {
        type: 'price',
        price: Entry,
      },

      // RED = loss
      bottomLineColor: isLong ? 'rgba(120, 30, 30, 0.9)' : 'transparent',
      bottomFillColor1: isLong ? 'rgba(120, 30, 30, 0.35)' : 'transparent',
      bottomFillColor2: isLong ? 'rgba(120, 30, 30, 0.2)' : 'transparent',

      topLineColor: !isLong ? 'rgba(120, 30, 30, 0.9)' : 'transparent',
      topFillColor1: !isLong ? 'rgba(120, 30, 30, 0.35)' : 'transparent',
      topFillColor2: !isLong ? 'rgba(120, 30, 30, 0.2)' : 'transparent',

      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    lossBaseline.setData([
      {
        time: startTime as UTCTimestamp,
        value: isLong ? SL : SL,
      },
      {
        time: extendTime as UTCTimestamp,
        value: isLong ? SL : SL,
      },
    ]);

    // ---------------- ENTRY LINE ----------------
    const entryLine = chartRef.current.addLineSeries({
      color: '#ffffff',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    entryLine.setData([
      { time: startTime as UTCTimestamp, value: Entry },
      { time: extendTime as UTCTimestamp, value: Entry },
    ]);

    // ---------------- TRACK SERIES ----------------
    marketSeriesRef.current.push(
      profitBaseline,
      lossBaseline,
      entryLine
    );
  };

  useEffect(() => {
    const loadAndSetCandles = () => {
      const candles = getCandles(pairRef.current, tfRef.current);
      if (!seriesRef.current || !candles || !candles.length) return;

      const data = candles.map(c => ({
        time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      seriesRef.current.setData(data);

      // Set initial visible range to start at the first candle (only once)
      if (firstCandleRef.current && chartRef.current) {
        const last = data[data.length - 1].time;
        const windowSeconds = TF_SECONDS[tfRef.current] * VISIBLE_CANDLES;
        const first = data[0].time;

        // Show window starting at first candle; don't go past last
        const from = first;
        const to = Math.min(first + windowSeconds, last);

        chartRef.current.timeScale().setVisibleRange({
          from: from as UTCTimestamp,
          to: to as UTCTimestamp,
        });

        maxWindowSecondsRef.current = windowSeconds;
        firstCandleRef.current = false;
      }
    };

    loadAndSetCandles();

    // React to CSV load completing (in case CSV finishes after mount)
    const unsubLoaded = subscribeToCandlesLoaded(() => {
      loadAndSetCandles();
    });

    return () => { if (typeof unsubLoaded === 'function') unsubLoaded(); };
  }, [pair, tf]);

  // initial-only auto-scroll handled in loadAndSetCandles

  // Update price precision when pair changes
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({
      priceFormat: {
        type: 'price',
        precision: pair === 'GBPJPY' ? 3 : 5,
        minMove: pair === 'GBPJPY' ? 0.001 : 0.00001,
      },
    });
  }, [pair]);

  useEffect(() => {
    const unsubscribe = subscribeToMarket(() => {
      const pair = pairRef.current;
      const tf = tfRef.current;
      const queue = getrenderQueue(pair);
      if (!queue.length) return;

      // Build a quick lookup of IDs from permanent store (storeEvents is source of truth)
      const store = getStoreEvents(pair);
      const storeIds = new Set(store.map((s: any) => s.id));

      // consume render buffer (renderQueue is delivery-only; mutating it is allowed)
      while (queue.length) {
        const ev = queue.shift()!;
        if (!ev.id) continue;

        const is5mStruct = (ev.type === 'BOS' || ev.type === 'CHOCH') && (ev.timeframe === '5m' || ev.tf === '5m');
        if (is5mStruct) {
          console.log(`🔍 [ChartPanel] Processing 5m ${ev.type} from queue:`, ev);
        }

        // Ensure the event exists in permanent store before rendering
        if (!storeIds.has(ev.id)) {
          if (is5mStruct) console.warn(`❌ [ChartPanel] 5m ${ev.type} skipped: Not in storeIds`, ev.id);
          continue;
        }

        // TF guard
        if ((ev.timeframe ?? ev.tf ?? '').toString().toLowerCase() !== tf.toLowerCase()) {
          if (is5mStruct) console.warn(`❌ [ChartPanel] 5m ${ev.type} skipped: Timeframe mismatch`, ev.timeframe, tf);
          continue;
        }

        // duplicate guard
        if (drawnEventIdsRef.current.has(ev.id)) {
          if (is5mStruct) console.warn(`❌ [ChartPanel] 5m ${ev.type} skipped: Already drawn`, ev.id);
          continue;
        }

        // if (ev.type === 'TRADE_PLAN') console.log('✅ [ChartPanel] Dispatching TRADE_PLAN to drawMarketEvent');
        if (is5mStruct) console.log(`✅ [ChartPanel] Dispatching 5m ${ev.type} to drawMarketEvent`);
        drawMarketEvent({ symbol: pair, timeframe: tf, events: [ev] });
        drawnEventIdsRef.current.add(ev.id);
      }
    });

    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

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

  /* -------------------- UI -------------------- */
  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Charts</h1>
          <div className={`px-2 py-0.5 rounded text-xs font-mono border ${isConnected ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>

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

export default ChartPanel;