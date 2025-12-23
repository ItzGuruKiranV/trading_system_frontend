import React, { useMemo, useState } from 'react';
import { generateCandleData, tradingPairs, timeframes } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Minus, Plus, MousePointer, Square, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Charts: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState('EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('H1');
  const [chartMode, setChartMode] = useState('plain');

  const candleData = useMemo(() => generateCandleData(100), []);
  const currentPair = tradingPairs.find(p => p.symbol === selectedPair);

  // Simple SVG candlestick chart
  const renderCandleChart = () => {
    const width = 900;
    const height = 400;
    const padding = 40;
    const candleWidth = (width - padding * 2) / candleData.length;
    
    const prices = candleData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    const scaleY = (price: number) => {
      return height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (i * (height - padding * 2)) / 4;
          const price = maxPrice - (i * priceRange) / 4;
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="hsl(var(--chart-grid))"
                strokeWidth="1"
              />
              <text
                x={width - padding + 5}
                y={y + 4}
                fill="hsl(var(--muted-foreground))"
                fontSize="10"
                className="font-mono"
              >
                {price.toFixed(4)}
              </text>
            </g>
          );
        })}

        {/* Candles */}
        {candleData.map((candle, i) => {
          const x = padding + i * candleWidth + candleWidth / 2;
          const isUp = candle.close >= candle.open;
          const color = isUp ? 'hsl(var(--chart-up))' : 'hsl(var(--chart-down))';
          
          const bodyTop = scaleY(Math.max(candle.open, candle.close));
          const bodyBottom = scaleY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x}
                y1={scaleY(candle.high)}
                x2={x}
                y2={scaleY(candle.low)}
                stroke={color}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - candleWidth * 0.3}
                y={bodyTop}
                width={candleWidth * 0.6}
                height={bodyHeight}
                fill={isUp ? 'transparent' : color}
                stroke={color}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* System 1 overlays */}
        {chartMode === 'system1' && (
          <>
            {/* BOS marker */}
            <g>
              <line
                x1={padding + 30 * candleWidth}
                y1={scaleY(candleData[30]?.high || 0) - 5}
                x2={padding + 50 * candleWidth}
                y2={scaleY(candleData[30]?.high || 0) - 5}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="4"
              />
              <text
                x={padding + 40 * candleWidth}
                y={scaleY(candleData[30]?.high || 0) - 12}
                fill="hsl(var(--primary))"
                fontSize="10"
                textAnchor="middle"
                className="font-mono"
              >
                BOS
              </text>
            </g>
            
            {/* CHoCH marker */}
            <g>
              <line
                x1={padding + 60 * candleWidth}
                y1={scaleY(candleData[60]?.low || 0) + 5}
                x2={padding + 75 * candleWidth}
                y2={scaleY(candleData[60]?.low || 0) + 5}
                stroke="hsl(var(--warning))"
                strokeWidth="2"
                strokeDasharray="4"
              />
              <text
                x={padding + 67 * candleWidth}
                y={scaleY(candleData[60]?.low || 0) + 20}
                fill="hsl(var(--warning))"
                fontSize="10"
                textAnchor="middle"
                className="font-mono"
              >
                CHoCH
              </text>
            </g>

            {/* Structure lines */}
            <line
              x1={padding + 20 * candleWidth}
              y1={scaleY(candleData[20]?.high || 0)}
              x2={padding + 80 * candleWidth}
              y2={scaleY(candleData[20]?.high || 0)}
              stroke="hsl(var(--success))"
              strokeWidth="1"
              opacity="0.5"
            />
          </>
        )}
      </svg>
    );
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Charts</h1>
          <p className="text-muted-foreground">Analyze price action and market structure</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select pair" />
            </SelectTrigger>
            <SelectContent>
              {tradingPairs.map((pair) => (
                <SelectItem key={pair.symbol} value={pair.symbol}>
                  {pair.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Mode Tabs */}
      <Tabs value={chartMode} onValueChange={setChartMode} className="mb-6">
        <TabsList>
          <TabsTrigger value="plain">Plain Chart</TabsTrigger>
          <TabsTrigger value="system1">System 1 Overlay</TabsTrigger>
          <TabsTrigger value="system2" disabled>System 2 Overlay</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Price Info Bar */}
      <div className="glass-card p-4 mb-4 flex flex-wrap items-center gap-6">
        <div>
          <span className="text-sm text-muted-foreground">Pair</span>
          <div className="text-lg font-semibold text-foreground">{selectedPair}</div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Price</span>
          <div className="text-lg font-mono text-foreground">
            {currentPair?.price.toFixed(selectedPair.includes('JPY') ? 2 : 4)}
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Change</span>
          <div className={`text-lg font-mono flex items-center gap-1 ${currentPair && currentPair.change >= 0 ? 'text-success' : 'text-destructive'}`}>
            {currentPair && currentPair.change >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {currentPair?.change.toFixed(2)}%
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Select">
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Trendline">
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Rectangle">
            <Square className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button variant="ghost" size="icon" title="Zoom Out">
            <Minus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Zoom In">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="glass-card p-4">
        <div className="bg-background/50 rounded-lg trading-grid aspect-[16/9] max-h-[500px] overflow-hidden">
          {renderCandleChart()}
        </div>
      </div>

      {/* Chart Info */}
      {chartMode === 'system1' && (
        <div className="mt-4 glass-card p-4">
          <h3 className="font-semibold text-foreground mb-2">System 1 Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary" />
              <span className="text-muted-foreground">BOS (Break of Structure)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-warning" />
              <span className="text-muted-foreground">CHoCH (Change of Character)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-success opacity-50" />
              <span className="text-muted-foreground">Structure Level</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts;
