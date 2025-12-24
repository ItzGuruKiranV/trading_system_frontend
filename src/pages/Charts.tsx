import React, { useEffect, useState, useRef } from 'react';
import { tradingPairs, timeframes } from '@/data/mockData';
import { API_BASE_URL } from '@/config/api';
import { createChart, CandlestickData } from 'lightweight-charts';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Minus,
  Plus,
  MousePointer,
  Square,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

/* ---------------------------------------
   TYPES
--------------------------------------- */

type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

/* ---------------------------------------
   TF MAP (UI → BACKEND)
--------------------------------------- */

const TF_MAP: Record<string, string> = {
  M1: '1m',
  M5: '5m',
  M15: '15m',
  H1: '1h',
};

/* ---------------------------------------
   CONFIG
--------------------------------------- */



/* ---------------------------------------
   COMPONENT
--------------------------------------- */

const Charts: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState('EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('H1');
  const [chartMode, setChartMode] = useState<'plain' | 'system1'>('plain');

  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const currentPair = tradingPairs.find(p => p.symbol === selectedPair);

  /* ---------------------------------------
     FETCH CANDLES (UNCHANGED)
  --------------------------------------- */

  useEffect(() => {
    const fetchCandles = async () => {
      try {
        setLoading(true);
        setError(null);

        const tf = TF_MAP[selectedTimeframe];

        const res = await fetch(
          `${API_BASE_URL}/api/candles?symbol=${selectedPair}&tf=${tf}&limit=300`
        );

        if (!res.ok) {
          throw new Error('Failed to fetch candle data');
        }

        const data = await res.json();
        setCandles(data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        setCandles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
  }, [selectedPair, selectedTimeframe]);

  /* ---------------------------------------
     TRADINGVIEW CHART RENDER
  --------------------------------------- */

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!candles.length) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const chartData: CandlestickData[] = candles.map(c => ({
      time: Math.floor(new Date(c.timestamp).getTime() / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(chartData);
    chart.timeScale().fitContent();

    const resize = () => {
      chart.applyOptions({
        width: chartContainerRef.current!.clientWidth,
      });
    };

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
    };
  }, [candles]);

  /* ---------------------------------------
     UI (UNCHANGED)
  --------------------------------------- */

  return (
    <div className="h-screen flex flex-col p-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Charts</h1>
          <p className="text-muted-foreground">
            Analyze price action and market structure
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tradingPairs.map(pair => (
                <SelectItem key={pair.symbol} value={pair.symbol}>
                  {pair.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map(tf => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MODE */}
      <Tabs value={chartMode} onValueChange={v => setChartMode(v as any)}>
        <TabsList>
          <TabsTrigger value="plain">Plain</TabsTrigger>
          <TabsTrigger value="system1">System 1</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* CHART */}
      <div className="glass-card flex-1 mt-4">
        <div className="bg-background/50 rounded-lg w-full h-full">
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>
      </div>

    </div>
  );
};

export default Charts;
