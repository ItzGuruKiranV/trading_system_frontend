import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TradingCard } from '@/components/ui/card';
import { 
  BookOpen, 
  BarChart3, 
  LineChart, 
  Cog, 
  Lock,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import { tradingPairs } from '@/data/mockData';

const dashboardCards = [
  { 
    id: 'journal', 
    title: 'Journal', 
    description: 'Track your trades and emotions',
    icon: BookOpen, 
    path: '/journal',
    color: 'from-blue-500 to-blue-600' 
  },
  { 
    id: 'backtests', 
    title: 'Backtest Results', 
    description: 'View historical performance',
    icon: BarChart3, 
    path: '/backtests',
    color: 'from-green-500 to-green-600' 
  },
  { 
    id: 'charts', 
    title: 'Charts', 
    description: 'Analyze price action',
    icon: LineChart, 
    path: '/charts',
    color: 'from-purple-500 to-purple-600' 
  },
  { 
    id: 'system1', 
    title: 'System 1 Chart', 
    description: 'Market structure analysis',
    icon: Cog, 
    path: '/systems/system1',
    color: 'from-cyan-500 to-cyan-600' 
  },
  { 
    id: 'system2', 
    title: 'System 2 Chart', 
    description: 'Coming soon',
    icon: Lock, 
    path: '#',
    color: 'from-gray-500 to-gray-600',
    disabled: true 
  },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = (card: typeof dashboardCards[0]) => {
    if (!card.disabled) {
      navigate(card.path);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, <span className="text-gradient">{user?.name}</span>
        </h1>
        <p className="text-muted-foreground">Your trading command center awaits.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Today's P&L</p>
              <p className="text-2xl font-bold font-mono text-success">+$847.50</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate (30d)</p>
              <p className="text-2xl font-bold font-mono text-foreground">62.3%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Trades</p>
              <p className="text-2xl font-bold font-mono text-foreground">2</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Cards */}
      <h2 className="text-xl font-semibold text-foreground mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <TradingCard
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={card.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <div className="text-center">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                <p className="text-xs text-muted-foreground">{card.description}</p>
                {card.disabled && (
                  <span className="badge-muted mt-2 inline-block">Coming Soon</span>
                )}
              </div>
            </TradingCard>
          );
        })}
      </div>

      {/* Market Overview */}
      <h2 className="text-xl font-semibold text-foreground mb-4">Market Overview</h2>
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="bg-secondary/30">
              <th>Pair</th>
              <th>Price</th>
              <th>Change</th>
              <th className="hidden md:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {tradingPairs.slice(0, 5).map((pair) => (
              <tr key={pair.symbol} className="cursor-pointer" onClick={() => navigate(`/charts?pair=${pair.symbol}`)}>
                <td>
                  <div className="font-medium text-foreground">{pair.symbol}</div>
                  <div className="text-xs text-muted-foreground hidden md:block">{pair.name}</div>
                </td>
                <td className="font-mono text-foreground">{pair.price.toFixed(pair.symbol.includes('JPY') ? 2 : 4)}</td>
                <td className={pair.change >= 0 ? 'text-success' : 'text-destructive'}>
                  <span className="font-mono">{pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%</span>
                </td>
                <td className="hidden md:table-cell">
                  <span className={pair.change >= 0 ? 'badge-success' : 'badge-destructive'}>
                    {pair.change >= 0 ? 'Bullish' : 'Bearish'}
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

export default Dashboard;
