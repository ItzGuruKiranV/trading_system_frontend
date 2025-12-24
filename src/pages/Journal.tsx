import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/config/api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Search, BookOpen, TrendingUp, TrendingDown,
  Calendar, Image as ImageIcon, MessageSquare, Heart, X,
} from 'lucide-react';
import { TradingCard } from '@/components/ui/card';

/* ================================
   TYPES (DB MATCH)
================================ */
type JournalEntry = {
  id: number;
  trade_date: string;
  day_of_week: string;
  session: string;
  timeframe: string;
  symbol: string;
  system: string;
  direction: 'Long' | 'Short';
  entry_price: number;
  exit_price: number;
  pnl: number;
  result: 'Win' | 'Loss';
  hold_minutes: number;
  emotion: string;
  notes?: string;
  screenshot_url?: string | null;
};

const Journal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSystem, setActiveSystem] = useState('System 1');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);

  /* ================================
     ENTRY FORM STATE (FULL)
  ================================ */
  const [form, setForm] = useState({
    trade_date: '',
    session: 'London',
    timeframe: '1h',
    symbol: '',
    system: 'System 1',
    direction: 'Long',
    entry_price: '',
    exit_price: '',
    pnl: '',
    hold_minutes: '',
    emotion: 'Calm',
    notes: '',
    screenshot_url: '',
  });

  /* ================================
     FETCH JOURNAL
  ================================ */
  const fetchJournal = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/api/journal`);
    const data = await res.json();
    setJournalEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJournal();
  }, []);

  /* ================================
     SEARCH (SESSION + SYMBOL ONLY)
  ================================ */
  const filteredEntries = journalEntries.filter(e =>
    (activeSystem === 'combined' || e.system === activeSystem) &&
    (
      e.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.session.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const stats = {
    totalTrades: filteredEntries.length,
    wins: filteredEntries.filter(e => e.result === 'Win').length,
    losses: filteredEntries.filter(e => e.result === 'Loss').length,
    totalPnl: filteredEntries.reduce((a, e) => a + e.pnl, 0),
  };

  /* ================================
     SUBMIT ENTRY (SCHEMA SAFE)
  ================================ */
  const handleSubmit = async () => {
    if (!form.trade_date || !form.symbol) {
      alert('Trade date and symbol are required');
      return;
    }

    const dateObj = new Date(form.trade_date);

    const payload = {
      trade_date: form.trade_date,
      day_of_week: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      session: form.session,
      timeframe: form.timeframe,
      symbol: form.symbol.toUpperCase(),
      system: form.system,
      direction: form.direction,
      entry_price: Number(form.entry_price),
      exit_price: Number(form.exit_price),
      pnl: Number(form.pnl),
      result: Number(form.pnl) >= 0 ? 'Win' : 'Loss',
      hold_minutes: Number(form.hold_minutes),
      emotion: form.emotion,
      notes: form.notes || null,
      screenshot_url: form.screenshot_url || null,
    };

    const res = await fetch(`${API_BASE_URL}/api/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert('Failed to save trade');
      return;
    }

    const inserted = await res.json();

    setJournalEntries(prev => [inserted, ...prev]);
    setShowEntryModal(false);

    setForm({
      trade_date: '',
      session: 'London',
      timeframe: '1h',
      symbol: '',
      system: 'System 1',
      direction: 'Long',
      entry_price: '',
      exit_price: '',
      pnl: '',
      hold_minutes: '',
      emotion: 'Calm',
      notes: '',
      screenshot_url: '',
    });
  };

  /* ================================
     UI (UNCHANGED EXCEPT MODAL FIELDS)
  ================================ */
  return (
    <div className="min-h-screen p-6 lg:p-8">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen /> Trade Journal
          </h1>
          <p className="text-muted-foreground">
            Document your trades, emotions, and learnings
          </p>
        </div>
        <Button variant="trading" onClick={() => setShowEntryModal(true)}>
          <Plus className="mr-2 w-4 h-4" /> New Entry
        </Button>
      </div>

      {/* TABS */}
      <Tabs value={activeSystem} onValueChange={setActiveSystem}>
        <TabsList>
          <TabsTrigger value="System 1">System 1</TabsTrigger>
          <TabsTrigger value="System 2" disabled>System 2</TabsTrigger>
          <TabsTrigger value="combined">Combined</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 my-6">
        <div className="stat-card">Trades {stats.totalTrades}</div>
        <div className="stat-card text-success">Wins {stats.wins}</div>
        <div className="stat-card text-destructive">Losses {stats.losses}</div>
        <div className="stat-card">P&L {stats.totalPnl}</div>
      </div>

      {/* SEARCH */}
      <div className="glass-card p-4 mb-6 relative">
        <Search className="absolute mt-3 ml-3 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search by session or pair"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-center">Loading…</p>}

      {/* JOURNAL LIST (UNCHANGED) */}
      <div className="space-y-4">
        {filteredEntries.map(entry => (
          <TradingCard key={entry.id}>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {entry.direction === 'Long'
                    ? <TrendingUp className="text-success" />
                    : <TrendingDown className="text-destructive" />}
                  <span className="font-bold">{entry.symbol}</span>
                  <span className="badge-primary">{entry.system}</span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-2">
                  <div><Calendar className="inline w-3 h-3" /> {entry.trade_date}</div>
                  <div>Entry {entry.entry_price}</div>
                  <div>Exit {entry.exit_price}</div>
                  <div>P&L {entry.pnl}</div>
                </div>

                <div className="bg-secondary/30 p-3 rounded">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  {entry.notes}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> {entry.emotion}
                </div>
              </div>

              <div className="w-40 h-28 bg-secondary/50 rounded flex items-center justify-center">
                <ImageIcon className="opacity-40" />
              </div>
            </div>
          </TradingCard>
        ))}
      </div>

      {/* ================================
         ENTRY MODAL (FULL SCHEMA)
      ================================ */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg w-[700px] p-6 relative">
            <button className="absolute top-4 right-4" onClick={() => setShowEntryModal(false)}>
              <X />
            </button>

            <h2 className="text-xl font-bold mb-4">New Journal Entry</h2>

            <div className="grid grid-cols-2 gap-4">
              <Input type="date" value={form.trade_date}
                onChange={e => setForm({ ...form, trade_date: e.target.value })} />

              <Input placeholder="Symbol (EURUSD)" value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value })} />

              <Input placeholder="Session (London / NY)" value={form.session}
                onChange={e => setForm({ ...form, session: e.target.value })} />

              <Input placeholder="Timeframe (1m / 5m / 1h)" value={form.timeframe}
                onChange={e => setForm({ ...form, timeframe: e.target.value })} />

              <Input placeholder="System" value={form.system}
                onChange={e => setForm({ ...form, system: e.target.value })} />

              <Input placeholder="Direction (Long / Short)" value={form.direction}
                onChange={e => setForm({ ...form, direction: e.target.value })} />

              <Input type="number" placeholder="Entry Price" value={form.entry_price}
                onChange={e => setForm({ ...form, entry_price: e.target.value })} />

              <Input type="number" placeholder="Exit Price" value={form.exit_price}
                onChange={e => setForm({ ...form, exit_price: e.target.value })} />

              <Input type="number" placeholder="PnL" value={form.pnl}
                onChange={e => setForm({ ...form, pnl: e.target.value })} />

              <Input type="number" placeholder="Hold Minutes" value={form.hold_minutes}
                onChange={e => setForm({ ...form, hold_minutes: e.target.value })} />

              <Input placeholder="Emotion" value={form.emotion}
                onChange={e => setForm({ ...form, emotion: e.target.value })} />

              <Input placeholder="Screenshot URL" value={form.screenshot_url}
                onChange={e => setForm({ ...form, screenshot_url: e.target.value })} />

              <Input placeholder="Notes" value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <Button className="mt-6 w-full" onClick={handleSubmit}>
              Save Entry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
