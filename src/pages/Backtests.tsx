import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, BarChart3, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

const Backtests: React.FC = () => {
  const [pairs, setPairs] = useState<string[]>([]);
  const [selectedPair, setSelectedPair] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [tradeData, setTradeData] = useState<any>(null);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [years, setYears] = useState<number[]>([]);

  // Fetch available pairs
  useEffect(() => {
    const fetchPairs = async () => {
      setLoadingPairs(true);
      try {
        const res = await fetch(`${API_BASE_URL}/backtest/pairs`);
        const data = await res.json();
        setPairs(data);
        if (data.length > 0) setSelectedPair("ALL");
      } catch (err) {
        console.error('Failed to load pairs', err);
      } finally {
        setLoadingPairs(false);
      }
    };
    fetchPairs();
  }, []);

  // Fetch years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/backtest/years`);
        const data: number[] = await res.json();
        setYears(data);
        if (!selectedYear && data.length > 0) setSelectedYear("ALL");
      } catch (err) {
        console.error('Failed to load years', err);
      }
    };
    fetchYears();
  }, []);

  // Fetch trades
  useEffect(() => {
    if (!selectedPair || !selectedYear) return;

    const fetchTrades = async () => {
      setLoadingTrades(true);
      try {
        const yearParam = selectedYear === "ALL" ? "ALL" : parseInt(selectedYear, 10);
        const res = await fetch(`${API_BASE_URL}/backtest/?pair=${selectedPair}&year=${yearParam}`);
        const data = await res.json();
        setTradeData(data);
      } catch (err) {
        console.error('Error fetching trades:', err);
        setTradeData(null);
      } finally {
        setLoadingTrades(false);
      }
    };
    fetchTrades();
  }, [selectedPair, selectedYear]);

  if (loadingPairs) return <p className="text-center py-8">Loading pairs...</p>;

  const stats = tradeData ?? {};
  const recentTrades = tradeData?.recent_ten_trades ?? [];
  const equityCurve = tradeData?.equityCurve ?? [];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Backtest Results</h1>
        <p className="text-muted-foreground">Historical performance analysis of {selectedPair}</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <Select value={selectedPair} onValueChange={setSelectedPair}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Pair" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="ALL" value="ALL">All Pairs</SelectItem>
            {pairs.map((pair) => (
              <SelectItem key={pair} value={pair}>{pair}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="ALL" value="ALL">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-bold font-mono text-success">{stats.win_rate ?? 0}%</p>
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
              <p className="text-2xl font-bold font-mono text-foreground">{stats.total_trades ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net PnL</p>
              <p className="text-2xl font-bold font-mono text-success">${stats.net_pnl ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      {equityCurve.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Equity Curve</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                />
                <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#equityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Type-specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {['pullback', 'choch'].map((type) => (
          <div key={type} className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">{type.toUpperCase()}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Trades</span>
                <span className="font-mono font-semibold text-foreground">{stats[type]?.trades ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Wins</span>
                <span className="font-mono text-success">{stats[type]?.win ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Losses</span>
                <span className="font-mono text-destructive">{stats[type]?.loss ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-mono font-semibold text-success">{stats[type]?.win_rate ?? 0}%</span>
              </div>
            </div>
          </div>
        ))}
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
              <th>Trade Type</th>
            </tr>
          </thead>
          <tbody>
            {recentTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 font-mono text-muted-foreground">
                  No trade data available.
                </td>
              </tr>
            ) : (
              recentTrades.map((trade) => (
                <tr key={trade.id}>
                  <td className="font-mono text-sm">{trade.trade_date}</td>
                  <td className="font-medium">{trade.pair}</td>
                  <td>
                    <span className={trade.side === 'BUY' ? 'text-success' : 'text-destructive'}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="font-mono">{trade.entry}</td>
                  <td className="font-mono">{trade.exit_price}</td>
                  <td className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                  </td>
                  <td>
                    <span className={trade.result === 'WIN' ? 'badge-success' : 'badge-destructive'}>
                      {trade.result}
                    </span>
                  </td>
                  <td className="font-mono">{trade.trade_type}</td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Backtests;
