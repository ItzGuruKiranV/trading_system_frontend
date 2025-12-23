import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { system1Rules, generateCandleData, tradingPairs, timeframes } from '@/data/mockData';
import { ArrowLeft, Info } from 'lucide-react';

const System1: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState('EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('H1');
  const [showRules, setShowRules] = useState(true);

  const candleData = useMemo(() => generateCandleData(80), []);

  const renderSystemChart = () => {
    const width = 800;
    const height = 350;
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
        {/* Grid */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (i * (height - padding * 2)) / 4;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="hsl(var(--chart-grid))"
              strokeWidth="1"
            />
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
              <line
                x1={x}
                y1={scaleY(candle.high)}
                x2={x}
                y2={scaleY(candle.low)}
                stroke={color}
                strokeWidth="1"
              />
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

        {/* System 1 Overlays */}
        {/* Higher High markers */}
        <g>
          <circle cx={padding + 15 * candleWidth} cy={scaleY(candleData[15]?.high || 0) - 8} r="3" fill="hsl(var(--success))" />
          <text x={padding + 15 * candleWidth} y={scaleY(candleData[15]?.high || 0) - 15} fill="hsl(var(--success))" fontSize="8" textAnchor="middle">HH</text>
        </g>
        <g>
          <circle cx={padding + 35 * candleWidth} cy={scaleY(candleData[35]?.high || 0) - 8} r="3" fill="hsl(var(--success))" />
          <text x={padding + 35 * candleWidth} y={scaleY(candleData[35]?.high || 0) - 15} fill="hsl(var(--success))" fontSize="8" textAnchor="middle">HH</text>
        </g>

        {/* Higher Low markers */}
        <g>
          <circle cx={padding + 25 * candleWidth} cy={scaleY(candleData[25]?.low || 0) + 8} r="3" fill="hsl(var(--primary))" />
          <text x={padding + 25 * candleWidth} y={scaleY(candleData[25]?.low || 0) + 20} fill="hsl(var(--primary))" fontSize="8" textAnchor="middle">HL</text>
        </g>

        {/* BOS Line */}
        <line
          x1={padding + 30 * candleWidth}
          y1={scaleY(candleData[30]?.high || 0) - 3}
          x2={padding + 55 * candleWidth}
          y2={scaleY(candleData[30]?.high || 0) - 3}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="6,3"
        />
        <text
          x={padding + 42 * candleWidth}
          y={scaleY(candleData[30]?.high || 0) - 10}
          fill="hsl(var(--primary))"
          fontSize="10"
          textAnchor="middle"
          fontWeight="bold"
        >
          BOS ↑
        </text>

        {/* CHoCH marker */}
        <line
          x1={padding + 55 * candleWidth}
          y1={scaleY(candleData[55]?.low || 0) + 3}
          x2={padding + 70 * candleWidth}
          y2={scaleY(candleData[55]?.low || 0) + 3}
          stroke="hsl(var(--warning))"
          strokeWidth="2"
          strokeDasharray="6,3"
        />
        <text
          x={padding + 62 * candleWidth}
          y={scaleY(candleData[55]?.low || 0) + 18}
          fill="hsl(var(--warning))"
          fontSize="10"
          textAnchor="middle"
          fontWeight="bold"
        >
          CHoCH
        </text>

        {/* Order Block */}
        <rect
          x={padding + 45 * candleWidth}
          y={scaleY(candleData[45]?.high || 0)}
          width={candleWidth * 8}
          height={20}
          fill="hsl(var(--primary))"
          opacity="0.2"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          strokeDasharray="4"
        />
        <text
          x={padding + 49 * candleWidth}
          y={scaleY(candleData[45]?.high || 0) + 13}
          fill="hsl(var(--primary))"
          fontSize="8"
          fontWeight="500"
        >
          OB
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/systems')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{system1Rules.name}</h1>
          <p className="text-muted-foreground">{system1Rules.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          {/* Controls */}
          <div className="glass-card p-4 mb-4 flex flex-wrap items-center gap-3">
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
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
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button 
              variant={showRules ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setShowRules(!showRules)}
            >
              <Info className="w-4 h-4 mr-2" />
              Rules
            </Button>
          </div>

          {/* Chart */}
          <div className="glass-card p-4">
            <div className="bg-background/50 rounded-lg trading-grid aspect-[16/9] max-h-[400px] overflow-hidden">
              {renderSystemChart()}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Chart Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">HH (Higher High)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">HL (Higher Low)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-primary" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 6px, transparent 6px, transparent 9px)' }} />
                <span className="text-muted-foreground">BOS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-warning" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--warning)) 0, hsl(var(--warning)) 6px, transparent 6px, transparent 9px)' }} />
                <span className="text-muted-foreground">CHoCH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rules Panel */}
        {showRules && (
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Entry Conditions
              </h3>
              <ul className="space-y-3">
                {system1Rules.entryConditions.map((condition, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-mono">{i + 1}.</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                Exit Conditions
              </h3>
              <ul className="space-y-3">
                {system1Rules.exitConditions.map((condition, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-mono">{i + 1}.</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" />
                Risk Management
              </h3>
              <ul className="space-y-3">
                {system1Rules.riskRules.map((rule, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-mono">•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default System1;
