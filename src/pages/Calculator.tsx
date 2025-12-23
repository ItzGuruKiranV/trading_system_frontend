/**
 * ============================================================
 * FOREX CALCULATOR PAGE
 * ============================================================
 * Purpose: Position size calculator for forex trading
 * 
 * Features:
 * - Calculate lot size based on risk parameters
 * - Support for different currency pairs
 * - Account size and risk percentage inputs
 * - Stop loss pip calculator
 * 
 * This page helps traders determine proper position sizing
 * to manage risk effectively.
 * ============================================================
 */

import React, { useState, useMemo } from 'react';
import { Calculator as CalcIcon, DollarSign, Percent, Target, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradingCard } from '@/components/ui/card';

/**
 * Currency pair pip values
 * These are approximate values - in production would be fetched from API
 */
const PIP_VALUES: Record<string, number> = {
  EURUSD: 10,
  GBPUSD: 10,
  USDJPY: 9.09,
  AUDUSD: 10,
  USDCAD: 7.58,
  NZDUSD: 10,
  USDCHF: 10.38,
  EURGBP: 12.50,
};

/**
 * Available currency pairs for calculation
 */
const CURRENCY_PAIRS = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'USDCAD', label: 'USD/CAD' },
  { value: 'NZDUSD', label: 'NZD/USD' },
  { value: 'USDCHF', label: 'USD/CHF' },
  { value: 'EURGBP', label: 'EUR/GBP' },
];

/**
 * Forex Calculator Component
 */
const Calculator: React.FC = () => {
  // Form state
  const [accountSize, setAccountSize] = useState<string>('10000');
  const [riskPercent, setRiskPercent] = useState<string>('1');
  const [stopLossPips, setStopLossPips] = useState<string>('50');
  const [selectedPair, setSelectedPair] = useState<string>('EURUSD');

  /**
   * Calculate position size based on inputs
   * Formula: Lot Size = (Account Size * Risk%) / (Stop Loss Pips * Pip Value)
   */
  const calculations = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const stopLoss = parseFloat(stopLossPips) || 0;
    const pipValue = PIP_VALUES[selectedPair] || 10;

    // Calculate risk amount in dollars
    const riskAmount = (account * risk) / 100;

    // Calculate lot size (standard lot = 100,000 units)
    // Position Size = Risk Amount / (Stop Loss Pips * Pip Value per Standard Lot)
    const lotSize = stopLoss > 0 ? riskAmount / (stopLoss * pipValue) : 0;

    // Calculate units
    const units = lotSize * 100000;

    // Calculate potential loss
    const potentialLoss = stopLoss * pipValue * lotSize;

    return {
      riskAmount: riskAmount.toFixed(2),
      lotSize: lotSize.toFixed(2),
      microLots: (lotSize * 100).toFixed(2),
      miniLots: (lotSize * 10).toFixed(2),
      units: units.toFixed(0),
      potentialLoss: potentialLoss.toFixed(2),
      pipValue: (pipValue * lotSize).toFixed(2),
    };
  }, [accountSize, riskPercent, stopLossPips, selectedPair]);

  /**
   * Reset calculator to default values
   */
  const handleReset = () => {
    setAccountSize('10000');
    setRiskPercent('1');
    setStopLossPips('50');
    setSelectedPair('EURUSD');
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalcIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Forex Calculator</h1>
        </div>
        <p className="text-muted-foreground">
          Calculate position size and risk for your trades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <TradingCard>
            <h2 className="text-lg font-semibold text-foreground mb-6">Trade Parameters</h2>

            {/* Account Size Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="accountSize" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Account Size (USD)
              </Label>
              <Input
                id="accountSize"
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                placeholder="Enter account size"
                className="font-mono"
              />
            </div>

            {/* Risk Percentage Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="riskPercent" className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-warning" />
                Risk Percentage (%)
              </Label>
              <Input
                id="riskPercent"
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                placeholder="Enter risk percentage"
                step="0.1"
                min="0"
                max="100"
                className="font-mono"
              />
              {parseFloat(riskPercent) > 2 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  High risk! Consider reducing to 1-2%
                </p>
              )}
            </div>

            {/* Stop Loss Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="stopLoss" className="flex items-center gap-2">
                <Target className="w-4 h-4 text-destructive" />
                Stop Loss (Pips)
              </Label>
              <Input
                id="stopLoss"
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(e.target.value)}
                placeholder="Enter stop loss in pips"
                className="font-mono"
              />
            </div>

            {/* Currency Pair Select */}
            <div className="space-y-2 mb-6">
              <Label>Currency Pair</Label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pair" />
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

            {/* Reset Button */}
            <Button variant="outline" onClick={handleReset} className="w-full">
              Reset Calculator
            </Button>
          </TradingCard>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Main Result */}
          <TradingCard className="bg-gradient-to-br from-primary/10 to-transparent">
            <h2 className="text-lg font-semibold text-foreground mb-4">Position Size</h2>
            <div className="text-center py-6">
              <p className="text-5xl font-bold font-mono text-primary mb-2">
                {calculations.lotSize}
              </p>
              <p className="text-muted-foreground">Standard Lots</p>
            </div>
          </TradingCard>

          {/* Detailed Results */}
          <TradingCard>
            <h2 className="text-lg font-semibold text-foreground mb-4">Calculation Details</h2>
            
            <div className="space-y-4">
              {/* Risk Amount */}
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Risk Amount</span>
                <span className="font-mono text-foreground font-semibold">
                  ${calculations.riskAmount}
                </span>
              </div>

              {/* Lot Sizes */}
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Mini Lots (0.1)</span>
                <span className="font-mono text-foreground">
                  {calculations.miniLots}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Micro Lots (0.01)</span>
                <span className="font-mono text-foreground">
                  {calculations.microLots}
                </span>
              </div>

              {/* Units */}
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Units</span>
                <span className="font-mono text-foreground">
                  {parseInt(calculations.units).toLocaleString()}
                </span>
              </div>

              {/* Pip Value */}
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Pip Value</span>
                <span className="font-mono text-foreground">
                  ${calculations.pipValue}
                </span>
              </div>

              {/* Potential Loss */}
              <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <span className="text-muted-foreground">Potential Loss</span>
                <span className="font-mono text-destructive font-semibold">
                  -${calculations.potentialLoss}
                </span>
              </div>
            </div>
          </TradingCard>

          {/* Risk Warning */}
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This calculator provides estimates only. Actual results may vary based on broker 
                spreads, slippage, and market conditions. Always verify with your broker.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
