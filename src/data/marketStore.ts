import { API_BASE_URL } from '@/config/api';

/* ================= TYPES ================= */

type Pair = 'EURUSD' | 'GBPJPY';
type Timeframe = '5m' | '4h';

export type CandleMessage = {
    type: 'candle';
    symbol: Pair;
    tf: Timeframe;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
};

/* ================= CACHES ================= */
/**
 * We keep ALL candles here.
 * WS never resets this.
 * Charts just read from this cache.
 */
const candlesCache: Record<Pair, Record<Timeframe, CandleMessage[]>> = {
    EURUSD: { '5m': [], '4h': [] },
    GBPJPY: { '5m': [], '4h': [] },
};

/**
 * Market structure / BOS / CHOCH / POI events
 */
const marketEvents: Record<Pair, any[]> = {
    EURUSD: [],
    GBPJPY: [],
};

/* ================= SOCKET MANAGER ================= */
/**
 * SINGLETON socket manager
 * - One candle WS
 * - One market WS
 * - Handles subscribe / unsubscribe
 */
class MarketSocketManager {
    candleWS: WebSocket;
    marketWS: WebSocket;

    listeners = new Set<() => void>();

    // Track active subscriptions (frontend-side)
    activeSubs = new Set<string>(); // key = `${pair}:${tf}`

    constructor() {
        /* ---------- CANDLE SOCKET ---------- */
        this.candleWS = new WebSocket(
            API_BASE_URL.replace('http', 'ws') + `/ws/candles`
        );

        this.candleWS.onmessage = e => {
            const msg: CandleMessage = JSON.parse(e.data);

            // Cache candle
            candlesCache[msg.symbol][msg.tf].push(msg);

            this.emit();
        };

        /* ---------- MARKET EVENT SOCKET ---------- */
        this.marketWS = new WebSocket(
            API_BASE_URL.replace('http', 'ws') + `/ws/market`
        );

        this.marketWS.onmessage = e => {
            const event = JSON.parse(e.data);

            // event.symbol MUST exist
            if (!event.symbol) return;

            marketEvents[event.symbol].push(event);
            this.emit();
        };
    }

    /* ================= SUBSCRIBE ================= */
    /**
     * Called when chart selects a pair / tf
     * DOES NOT reconnect socket
     */
    subscribe(pair: Pair, tf: Timeframe) {
        const key = `${pair}:${tf}`;
        if (this.activeSubs.has(key)) return;

        this.activeSubs.add(key);

        this.candleWS.send(
            JSON.stringify({
                action: 'subscribe',
                symbol: pair,
                tf,
            })
        );
    }

    /* ================= UNSUBSCRIBE ================= */
    /**
     * Called when chart switches away
     * Backend may stop feed if no subscribers remain
     */
    unsubscribe(pair: Pair, tf: Timeframe) {
        const key = `${pair}:${tf}`;
        if (!this.activeSubs.has(key)) return;

        this.activeSubs.delete(key);

        this.candleWS.send(
            JSON.stringify({
                action: 'unsubscribe',
                symbol: pair,
                tf,
            })
        );
    }

    /* ================= LISTENERS ================= */
    subscribeUI(fn: () => void) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    emit() {
        this.listeners.forEach(fn => fn());
    }
}

/* ================= SINGLE INSTANCE ================= */
const socketManager = new MarketSocketManager();

/* ================= PUBLIC API ================= */

/**
 * Charts call this ONCE.
 * Re-renders whenever new data arrives.
 */
export function subscribeToMarket(cb: () => void) {
    return socketManager.subscribeUI(cb);
}

/**
 * Called from Charts.tsx when pair/tf changes
 */
export function subscribePairTF(pair: Pair, tf: Timeframe) {
    socketManager.subscribe(pair, tf);
}

export function unsubscribePairTF(pair: Pair, tf: Timeframe) {
    socketManager.unsubscribe(pair, tf);
}

/**
 * Read-only cache access
 */
export function getCandles(pair: Pair, tf: Timeframe) {
    return candlesCache[pair][tf];
}

export function getMarketEvents(pair: Pair) {
    return marketEvents[pair];
}
