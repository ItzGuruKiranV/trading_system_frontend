/**
 * ============================================================
 * NEWS PAGE
 * ============================================================
 * Purpose: Display forex and macro economic news
 * 
 * Features:
 * - High/Medium/Low impact indicators
 * - Currency-specific filtering
 * - Time-based sorting
 * - News event details
 * 
 * Note: Uses mock data - integrate with a news API in production
 * (e.g., ForexFactory, Investing.com API)
 * ============================================================
 */

import React, { useState, useMemo , useEffect} from 'react';
import { Newspaper, Clock, AlertTriangle, Filter, TrendingUp, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TradingCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/config/api';


/**
 * News impact levels
 */
type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * News event interface
 */
interface NewsEvent {
  id: string;
  time: string;
  date: string;
  currency: string;
  impact: ImpactLevel;
  title: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}


/**
 * Currency options for filtering
 */
const CURRENCIES = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

/**
 * Impact level options
 */
const IMPACT_LEVELS = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Get impact badge styling
 */
const getImpactStyle = (impact: ImpactLevel) => {
  switch (impact) {
    case 'HIGH':
      return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'MEDIUM':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'LOW':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

/**
 * News Page Component
 */
const News: React.FC = () => {
  const [news, setNews] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);


  // Filter state
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news`)
      .then(res => res.json())
      .then(data => {
        console.log("NEWS FROM API 👉", data);
        setNews(data);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Filter news based on selected criteria
   */
  const filteredNews = useMemo(() => {
    return news.filter((news) => {
      // Currency filter
      if (selectedCurrency !== 'ALL' && news.currency !== selectedCurrency) {
        return false;
      }

      // Impact filter
      if (selectedImpact !== 'ALL' && news.impact !== selectedImpact) {
        return false;
      }

      // Search filter
      if (searchQuery && !news.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [selectedCurrency, selectedImpact, searchQuery]);

  /**
   * Group news by date
   */
  const groupedNews = useMemo(() => {
    const groups: Record<string, NewsEvent[]> = {};

    filteredNews.forEach((news) => {
      if (!groups[news.date]) {
        groups[news.date] = [];
      }
      groups[news.date].push(news);
    });

    // Sort each group by time
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return groups;
  }, [filteredNews]);

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Economic Calendar</h1>
        </div>
        <p className="text-muted-foreground">
          Stay informed with upcoming economic events and news releases
        </p>
      </div>

      {/* Filters */}
      <TradingCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Currency Filter */}
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-full md:w-[150px]">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency === 'ALL' ? 'All Currencies' : currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Impact Filter */}
          <Select value={selectedImpact} onValueChange={setSelectedImpact}>
            <SelectTrigger className="w-full md:w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Impact" />
            </SelectTrigger>
            <SelectContent>
              {IMPACT_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level === 'ALL' ? 'All Impacts' : level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TradingCard>

      {/* News List */}
<div className="space-y-6">
  {loading ? (
    <TradingCard className="text-center py-12">
      Loading news...
    </TradingCard>
  ) : Object.keys(groupedNews).length === 0 ? (
    <TradingCard className="text-center py-12">
      <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
      <p className="text-muted-foreground">No events found matching your criteria</p>
    </TradingCard>
  ) : (
    Object.entries(groupedNews)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, events]) => (
        <div key={date}>
          {/* Date Header */}
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {formatDate(date)}
          </h2>

    {events.map((event) => (
      <TradingCard
        key={event.id}
        className="hover:border-primary/30 transition-colors"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">

          {/* Time & Currency */}
          <div className="flex items-center gap-4 md:w-32">
            <span className="font-mono text-muted-foreground">
              {event.time}
            </span>
            <Badge variant="outline" className="font-semibold">
              {event.currency}
            </Badge>
          </div>

          {/* Impact */}
          <div className="md:w-24">
            <Badge className={getImpactStyle(event.impact)}>
              {event.impact}
            </Badge>
          </div>

          {/* Title */}
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {event.title}
            </p>
          </div>

          {/* Values */}
          <div className="flex items-center gap-6 text-sm">
            {event.actual && (
              <div>
                <span className="text-muted-foreground">Actual: </span>
                <span className="font-mono text-success font-semibold">
                  {event.actual}
                </span>
              </div>
            )}
            {event.forecast && (
              <div>
                <span className="text-muted-foreground">Forecast: </span>
                <span className="font-mono text-foreground">
                  {event.forecast}
                </span>
              </div>
            )}
            {event.previous && (
              <div>
                <span className="text-muted-foreground">Previous: </span>
                <span className="font-mono text-muted-foreground">
                  {event.previous}
                </span>
              </div>
            )}
          </div>

        </div>
      </TradingCard>
    ))}

        </div>
      ))
  )}

      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-sm text-warning flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Economic calendar data is for informational purposes only. Times shown are in your 
            local timezone. Always verify event times with official sources before trading.
          </span>
        </p>
      </div>
    </div>
  );
};

export default News;
