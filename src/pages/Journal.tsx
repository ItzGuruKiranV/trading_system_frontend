import React, { useState } from 'react';
import { journalEntries } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  Heart
} from 'lucide-react';
import { TradingCard } from '@/components/ui/card';

const Journal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSystem, setActiveSystem] = useState('system1');

  const filteredEntries = journalEntries.filter(entry => 
    entry.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'confident':
        return 'text-success';
      case 'calm':
        return 'text-primary';
      case 'frustrated':
        return 'text-destructive';
      case 'anxious':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const stats = {
    totalTrades: filteredEntries.length,
    wins: filteredEntries.filter(e => e.result === 'Win').length,
    losses: filteredEntries.filter(e => e.result === 'Loss').length,
    totalPnl: filteredEntries.reduce((acc, e) => acc + e.pnl, 0),
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Trade Journal</h1>
          </div>
          <p className="text-muted-foreground">Document your trades, emotions, and learnings</p>
        </div>
        <Button variant="trading">
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* System Tabs */}
      <Tabs value={activeSystem} onValueChange={setActiveSystem} className="mb-6">
        <TabsList>
          <TabsTrigger value="system1">System 1 Journal</TabsTrigger>
          <TabsTrigger value="system2" disabled>System 2 Journal</TabsTrigger>
          <TabsTrigger value="combined" disabled>Combined</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-1">Total Entries</p>
          <p className="text-2xl font-bold font-mono text-foreground">{stats.totalTrades}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-1">Wins</p>
          <p className="text-2xl font-bold font-mono text-success">{stats.wins}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-1">Losses</p>
          <p className="text-2xl font-bold font-mono text-destructive">{stats.losses}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-1">Net P&L</p>
          <p className={`text-2xl font-bold font-mono ${stats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search entries by pair or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <TradingCard key={entry.id} className="cursor-default">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Entry Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {entry.direction === 'Long' ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                    <span className="font-semibold text-lg text-foreground">{entry.pair}</span>
                  </div>
                  <span className="badge-primary">{entry.system}</span>
                  <span className={entry.result === 'Win' ? 'badge-success' : 'badge-destructive'}>
                    {entry.result}
                  </span>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-mono text-sm text-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {entry.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="font-mono text-sm text-foreground">{entry.entry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Exit</p>
                    <p className="font-mono text-sm text-foreground">{entry.exit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">P&L</p>
                    <p className={`font-mono text-sm font-semibold ${entry.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {entry.pnl >= 0 ? '+' : ''}${entry.pnl}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-secondary/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Notes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                </div>

                {/* Emotion */}
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Emotional State:</span>
                  <span className={`text-sm font-medium ${getEmotionColor(entry.emotion)}`}>
                    {entry.emotion}
                  </span>
                </div>
              </div>

              {/* Screenshot Placeholder */}
              <div className="w-full md:w-48 h-32 bg-secondary/50 rounded-lg flex items-center justify-center border border-border/50">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span className="text-xs">Chart Screenshot</span>
                </div>
              </div>
            </div>
          </TradingCard>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No journal entries found</p>
        </div>
      )}
    </div>
  );
};

export default Journal;
