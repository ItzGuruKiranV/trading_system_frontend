import React, { useState } from 'react';
import {
  Calculator as CalcIcon,
  DollarSign,
  Percent,
  Target,
  AlertTriangle,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TradingCard } from '@/components/ui/card';
import { API_BASE_URL } from '@/config/api';

/* ============================================================
   SUPPORTED PAIRS (ONLY 5)
============================================================ */
const CURRENCY_PAIRS = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'GBPJPY', label: 'GBP/JPY' },
  { value: 'EURAUD', label: 'EUR/AUD' },
  { value: 'XAUUSD', label: 'XAU/USD' },
];

const Calculator: React.FC = () => {
  /* -----------------------------
     INPUT STATE
  ----------------------------- */
  const [accountSize, setAccountSize] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [stopLossPips, setStopLossPips] = useState('50');
  const [selectedPair, setSelectedPair] = useState('EURUSD');

  /* -----------------------------
     RESULT STATE (FROM BACKEND)
  ----------------------------- */
  const [result, setResult] = useState<null | {
    lot_size: number;
    pip_value_per_lot: number;
    risk_amount: number;
  }>(null);

  const [loading, setLoading] = useState(false);

  /* -----------------------------
     CALCULATE (BACKEND CALL)
  ----------------------------- */
  const handleCalculate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/lot-size`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedPair,
          account_balance: Number(accountSize),
          risk_percent: Number(riskPercent),
          stop_loss_pips: Number(stopLossPips),
        }),
      });

      if (!res.ok) {
        throw new Error('Calculation failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Failed to calculate lot size');
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     RESET
  ----------------------------- */
  const handleReset = () => {
    setAccountSize('10000');
    setRiskPercent('1');
    setStopLossPips('50');
    setSelectedPair('EURUSD');
    setResult(null);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalcIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Forex Calculator
          </h1>
        </div>
        <p className="text-muted-foreground">
          Calculate position size and risk for your trades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ================= INPUT SECTION ================= */}
        <div className="space-y-6">
          <TradingCard>
            <h2 className="text-lg font-semibold mb-6">
              Trade Parameters
            </h2>

            <div className="space-y-2 mb-4">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Account Size (USD)
              </Label>
              <Input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
              />
            </div>

            <div className="space-y-2 mb-4">
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Risk Percentage (%)
              </Label>
              <Input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
              />
              {Number(riskPercent) > 2 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  High risk! Consider 1–2%
                </p>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Stop Loss (Pips)
              </Label>
              <Input
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(e.target.value)}
              />
            </div>

            <div className="space-y-2 mb-6">
              <Label>Currency Pair</Label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_PAIRS.map((pair) => (
                    <SelectItem key={pair.value} value={pair.value}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleCalculate}
                disabled={loading}
              >
                {loading ? 'Calculating…' : 'Calculate'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </TradingCard>
        </div>

        {/* ================= RESULT SECTION ================= */}
        <div className="space-y-6">
          <TradingCard className="bg-gradient-to-br from-primary/10 to-transparent">
            <h2 className="text-lg font-semibold mb-4">
              Position Size
            </h2>

            <div className="text-center py-6">
              <p className="text-5xl font-bold text-primary">
                {result ? result.lot_size.toFixed(2) : '—'}
              </p>
              <p className="text-muted-foreground">Standard Lots</p>
            </div>
          </TradingCard>

          <TradingCard>
            <h2 className="text-lg font-semibold mb-4">
              Calculation Details
            </h2>

            <div className="space-y-4">
              <Detail label="Risk Amount" value={result ? `$${result.risk_amount}` : '—'} />
              <Detail label="Pip Value / Lot" value={result ? `$${result.pip_value_per_lot}` : '—'} />
              <Detail
                label="Potential Loss"
                value={
                  result
                    ? `-$${result.risk_amount}`
                    : '—'
                }
                danger
              />
            </div>
          </TradingCard>

          <div className="p-4 bg-warning/10 border rounded-lg">
            <p className="text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4" />
              Backend-calculated values. Always verify with broker.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -----------------------------
   SMALL HELPER (UI SAFE)
----------------------------- */
const Detail = ({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) => (
  <div className={`flex justify-between p-3 rounded ${danger ? 'bg-destructive/10' : 'bg-secondary/30'}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-mono ${danger ? 'text-destructive' : ''}`}>
      {value}
    </span>
  </div>
);

export default Calculator;
