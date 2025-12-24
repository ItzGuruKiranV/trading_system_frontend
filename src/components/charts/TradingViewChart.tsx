/**
 * ============================================================
 * TRADINGVIEW CHART COMPONENT
 * ============================================================
 * Purpose: Renders professional candlestick charts using TradingView's
 *          lightweight-charts library
 * 
 * Features:
 * - Interactive pan and zoom
 * - Crosshair with price tracking
 * - Multiple timeframe support
 * - BOS/CHoCH overlay markers
 * - POI zones visualization
 * 
 * Uses: lightweight-charts library from TradingView
 * ============================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, LineStyle } from 'lightweight-charts';

/**
 * Candlestick data interface
 */
interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Structure event for chart overlays (BOS, CHoCH, etc.)
 */
interface StructureEvent {
  time: number;
  price: number;
  type: 'BOS' | 'CHoCH' | 'SWING_HIGH' | 'SWING_LOW';
  direction: 'BULLISH' | 'BEARISH';
}

/**
 * POI Zone for chart overlays
 */
interface POIZone {
  startTime: number;
  endTime: number;
  priceHigh: number;
  priceLow: number;
  type: 'ORDER_BLOCK' | 'FVG' | 'SUPPLY' | 'DEMAND';
}

/**
 * Component props
 */
interface TradingViewChartProps {
  data: CandleData[];
  pair: string;
  timeframe: string;
  showOverlays?: boolean;
  structureEvents?: StructureEvent[];
  poiZones?: POIZone[];
  height?: number;
}

/**
 * Generate mock candle data for demonstration
 * In production, this would come from the database/API
 */
export const generateMockCandleData = (count: number = 200): CandleData[] => {
  const data: CandleData[] = [];
  let basePrice = 1.0850;
  const now = Math.floor(Date.now() / 1000);
  const hourSeconds = 3600;

  for (let i = count; i >= 0; i--) {
    const volatility = 0.002;
    const change = (Math.random() - 0.5) * volatility;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 10000) + 1000;

    data.push({
      time: now - i * hourSeconds,
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

/**
 * TradingView Chart Component
 * Main chart component that renders interactive candlestick charts
 */
const TradingViewChart: React.FC<TradingViewChartProps> = ({
  data,
  pair,
  timeframe,
  showOverlays = false,
  structureEvents = [],
  poiZones = [],
  height = 500,
}) => {
  // Refs for chart container and chart instance
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // State for current price display
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Initialize chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the chart with dark theme styling
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: 'transparent' },
        textColor: 'hsl(215 20% 55%)',
        fontSize: 12,
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: 'hsl(222 30% 15%)' },
        horzLines: { color: 'hsl(222 30% 15%)' },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: 'hsl(187 85% 53%)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: 'hsl(222 47% 10%)',
        },
        horzLine: {
          color: 'hsl(187 85% 53%)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: 'hsl(222 47% 10%)',
        },
      },
      rightPriceScale: {
        borderColor: 'hsl(222 30% 18%)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'hsl(222 30% 18%)',
        timeVisible: true,
        secondsVisible: false,

        rightBarStaysOnScroll: true,
        fixRightEdge: true,
        fixLeftEdge: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    });

    chartRef.current = chart;

    // Add candlestick series with custom colors
    const candleSeries = chart.addCandlestickSeries({
      upColor: 'hsl(142 76% 45%)',
      downColor: 'hsl(0 72% 55%)',
      borderUpColor: 'hsl(142 76% 45%)',
      borderDownColor: 'hsl(0 72% 55%)',
      wickUpColor: 'hsl(142 76% 45%)',
      wickDownColor: 'hsl(0 72% 55%)',
    });

    candleSeriesRef.current = candleSeries;

    // Transform and set data
    const chartData: CandlestickData[] = data.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(chartData);

    // Set current price from last candle
    if (data.length > 0) {
      setCurrentPrice(data[data.length - 1].close);
    }

    // Subscribe to crosshair movement for price display
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const data = param.seriesData.get(candleSeries);
        if (data && 'close' in data) {
          setCurrentPrice(data.close as number);
        }
      }
    });

    // Fit content to view
    chart.timeScale().fitContent();

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, height]);

  // Add structure overlays when enabled
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !showOverlays) return;

    // Add markers for structure events
    if (structureEvents.length > 0 && candleSeriesRef.current) {
      const markers = structureEvents.map(event => ({
        time: event.time as Time,
        position: event.type === 'SWING_HIGH' || event.type === 'BOS' ? 'aboveBar' as const : 'belowBar' as const,
        color: event.type === 'BOS' ? 'hsl(187 85% 53%)' : event.type === 'CHoCH' ? 'hsl(38 92% 50%)' : 'hsl(142 76% 36%)',
        shape: 'circle' as const,
        text: event.type,
        size: 1,
      }));

      candleSeriesRef.current.setMarkers(markers);
    }
  }, [showOverlays, structureEvents]);

  return (
    <div className="relative w-full">
      {/* Chart Header */}
      <div className="absolute top-2 left-4 z-10 flex items-center gap-4">
        <span className="text-lg font-semibold text-foreground">{pair}</span>
        <span className="text-sm text-muted-foreground">{timeframe}</span>
        {currentPrice && (
          <span className="font-mono text-primary text-lg">
            {currentPrice.toFixed(pair.includes('JPY') ? 2 : 5)}
          </span>
        )}
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />

      {/* Overlay Legend */}
      {showOverlays && (
        <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">BOS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">CHoCH</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Swing</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
