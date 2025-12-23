import React, { useState } from 'react';
import { backtestResults, tradingPairs, timeframes } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';

const Backtests: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2024');

  const { system1, equityCurve } = backtestResults;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Backtest Results</h1>
        <p className="text-muted-foreground">Historical performance analysis of System 1</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <Select value={selectedPair} onValueChange={setSelectedPair}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Pairs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pairs</SelectItem>
            {tradingPairs.map((pair) => (
              <SelectItem key={pair.symbol} value={pair.symbol}>
                {pair.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Timeframes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Timeframes</SelectItem>
            {timeframes.map((tf) => (
              <SelectItem key={tf.value} value={tf.value}>
                {tf.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-bold font-mono text-success">{system1.winRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
              <p className="text-2xl font-bold font-mono text-foreground">{system1.totalTrades}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
              <p className="text-2xl font-bold font-mono text-foreground">{system1.profitFactor}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Max Drawdown</p>
              <p className="text-2xl font-bold font-mono text-destructive">{system1.maxDrawdown}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Equity Curve</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
              />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Trade Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Net Profit</span>
              <span className="font-mono font-semibold text-success">${system1.netProfit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Win</span>
              <span className="font-mono text-success">${system1.averageWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Loss</span>
              <span className="font-mono text-destructive">${system1.averageLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span className="font-mono text-foreground">{system1.sharpeRatio}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Win/Loss Distribution</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-success">Wins</span>
                <span className="font-mono">{Math.round(system1.totalTrades * system1.winRate / 100)}</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full"
                  style={{ width: `${system1.winRate}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-destructive">Losses</span>
                <span className="font-mono">{Math.round(system1.totalTrades * (100 - system1.winRate) / 100)}</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-destructive rounded-full"
                  style={{ width: `${100 - system1.winRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Trades</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr className="bg-secondary/30">
              <th>Date</th>
              <th>Pair</th>
              <th>Type</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P&L</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {system1.trades.map((trade) => (
              <tr key={trade.id}>
                <td className="font-mono text-sm">{trade.date}</td>
                <td className="font-medium">{trade.pair}</td>
                <td>
                  <span className={trade.type === 'Long' ? 'text-success' : 'text-destructive'}>
                    {trade.type}
                  </span>
                </td>
                <td className="font-mono">{trade.entry}</td>
                <td className="font-mono">{trade.exit}</td>
                <td className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                </td>
                <td>
                  <span className={trade.result === 'Win' ? 'badge-success' : 'badge-destructive'}>
                    {trade.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Backtests;
