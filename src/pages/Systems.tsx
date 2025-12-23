import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TradingCard } from '@/components/ui/card';
import { Cog, Lock, Layers } from 'lucide-react';

const systemCards = [
  {
    id: 'system1',
    title: 'System 1',
    subtitle: 'Market Structure Strategy',
    description: 'Mechanical trading based on BOS and CHoCH patterns',
    status: 'Active',
    icon: Cog,
    path: '/systems/system1',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'system2',
    title: 'System 2',
    subtitle: 'Momentum Strategy',
    description: 'Trend-following with momentum indicators',
    status: 'Coming Soon',
    icon: Lock,
    path: '#',
    disabled: true,
    color: 'from-gray-500 to-gray-600',
  },
  {
    id: 'combined',
    title: 'Combined Systems',
    subtitle: 'Multi-System Approach',
    description: 'Confluence of multiple trading systems',
    status: 'Coming Soon',
    icon: Layers,
    path: '#',
    disabled: true,
    color: 'from-gray-500 to-gray-600',
  },
];

const Systems: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Trading Systems</h1>
        <p className="text-muted-foreground">Manage and analyze your mechanical trading strategies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemCards.map((system) => {
          const Icon = system.icon;
          return (
            <TradingCard
              key={system.id}
              onClick={() => !system.disabled && navigate(system.path)}
              className={system.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${system.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{system.title}</h3>
                    <span className={system.disabled ? 'badge-muted' : 'badge-success'}>
                      {system.status}
                    </span>
                  </div>
                  <p className="text-sm text-primary mb-2">{system.subtitle}</p>
                  <p className="text-sm text-muted-foreground">{system.description}</p>
                </div>
              </div>
            </TradingCard>
          );
        })}
      </div>

      {/* System Overview Stats */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">System Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Active Systems</p>
            <p className="text-2xl font-bold font-mono text-foreground">1</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Total Trades (30d)</p>
            <p className="text-2xl font-bold font-mono text-foreground">47</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Combined Win Rate</p>
            <p className="text-2xl font-bold font-mono text-success">62.3%</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
            <p className="text-2xl font-bold font-mono text-foreground">1.87</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Systems;
