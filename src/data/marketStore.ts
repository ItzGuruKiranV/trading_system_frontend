import { API_BASE_URL } from '@/config/api';
import { loadCSV } from './loadCandlesFromCSV';


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

export type MarketEvent = {
    symbol: Pair;
    timeframe?: Timeframe;
    events: any[];
};

/* ================= CACHES ================= */
/**
 * Global in-memory caches.
 * Backend NEVER controls these.
 * Frontend ONLY reads & filters.
 */

const candlesCache: Record<Pair, Record<Timeframe, CandleMessage[]>> = {
    EURUSD: { '5m': [], '4h': [] },
    GBPJPY: { '5m': [], '4h': [] },
};

const marketEvents: Record<Pair, MarketEvent[]> = {
    EURUSD: [],
    GBPJPY: [],
};

// Pending events queue: events here are waiting to be plotted by the UI.
// Each entry: { ev: any, plotted?: boolean }
const pendingEvents: Record<Pair, Array<{ ev: any; plotted?: boolean }>> = {
    EURUSD: [],
    GBPJPY: [],
};

/* ================= SOCKET MANAGER ================= */
/**
 * PURE LISTENER WebSocket manager
 * - Backend broadcasts everything
 * - Frontend filters locally
 * - ZERO commands sent to backend
 * 
 */
// No heartbeat messages for now — treat incoming packets as market events
/* ================= CSV BOOTSTRAP ================= */

let candlesLoaded = false;
const candlesLoadedListeners = new Set<() => void>();
const MAX_MARKET_EVENTS = 2000;

async function loadAllCandlesOnce() {
    if (candlesLoaded) return;
    candlesLoaded = true;

    const mappings = [
        { pair: 'EURUSD', tf: '5m', file: '/data/EURUSD_M5_2022.csv' },
        { pair: 'EURUSD', tf: '4h', file: '/data/EURUSD_H4_2022.csv' },
        { pair: 'GBPJPY', tf: '5m', file: '/data/GBPJPY_M5_2022.csv' },
        { pair: 'GBPJPY', tf: '4h', file: '/data/GBPJPY_H4_2022.csv' },
    ] as const;

    for (const m of mappings) {
        candlesCache[m.pair][m.tf] = await loadCSV(
            m.file,
            m.pair,
            m.tf
        );
    }

    console.log('✅ Candles loaded from CSV');
    // Notify any listeners (Charts) that candles are available
    candlesLoadedListeners.forEach(fn => fn());
    // console.log(
    //     'TEST EURUSD 4h candles:',
    //     candlesCache.EURUSD['4h'].slice(0, 5)
    // );

}

class MarketSocketManager {
    marketWS: Record<Pair, WebSocket> = {} as Record<Pair, WebSocket>;
    listeners = new Set<() => void>();
    PAIRS: Pair[] = ['EURUSD', 'GBPJPY'];

    // 👇 NEW: change trigger for UI updates
    private version = 0;

    constructor() {
        // Wait CSV to load, then init WS
        loadAllCandlesOnce().then(() => {
            this.PAIRS.forEach(pair => this.initMarketWS(pair));
        });
    }

    private initMarketWS(pair: Pair) {
        console.log(`[DEBUG initmarketws] Initializing WS for ${pair}`);
        this.marketWS[pair] = new WebSocket(
            `${API_BASE_URL.replace('http', 'ws')}/ws/market/${pair}`
        );
        this.marketWS[pair].onopen = () => {
            console.log(`[DEBUG initmarketws] WS connected for ${pair}`);
        };

        // ✅ Use same handler everywhere
        this.marketWS[pair].onmessage = this.handleMessage.bind(this);
        

        this.marketWS[pair].onclose = () => {
            console.log(`Market WS ${pair} disconnected, reconnecting in 3s...`);
            setTimeout(() => this.reconnectMarketWS(pair), 3000);
        };
        this.marketWS[pair].onerror = (err) => {
            console.error(`[DEBUG initmarketws] WS error for ${pair}:`, err);
        };

    }

    private handleMessage(e: MessageEvent) {
        // const packet: MarketEventPacket = JSON.parse(e.data);
        console.log('[DEBUG Handle message] Received raw message:', e.data);
        let packet: any;
        try {
            packet = JSON.parse(e.data);
        } catch (err) {
            console.log('[DEBUG handleMessage] Failed to parse message', err, e.data);
            return;
        }

        console.log('[DEBUG handleMessage] Parsed packet:', packet);

        if (!packet || !('symbol' in packet) || !Array.isArray(packet.events)) return;

        const symbol = packet.symbol;
        let added = false;   // 👈 track real additions

        packet.events.forEach(ev => {
            console.log('[DEBUG handleMessage] Processing event:', ev);
            const obj = {
                ...ev,
                symbol,
                timeframe: packet.timeframe,
            };

            marketEvents[symbol] = [...marketEvents[symbol], obj];
            pendingEvents[symbol] = [
                ...pendingEvents[symbol],
                { ev: obj, plotted: false }
            ];

            added = true;   // 👈 only true if event came

            if (marketEvents[symbol].length > MAX_MARKET_EVENTS) {
                marketEvents[symbol] = marketEvents[symbol].slice(-MAX_MARKET_EVENTS);
            }
        });

        if (added) {
            console.log(`[DEBUG handleMessage] Events added for ${symbol}, total now:`, marketEvents[symbol].length);
            this.emit();   // 🚀 only notify when needed
        }
    }

    private reconnectMarketWS(pair: Pair) {
        this.marketWS[pair] = new WebSocket(
            `${API_BASE_URL.replace('http', 'ws')}/ws/market/${pair}`
        );

        // ✅ Reuse same logic (no divergence bugs)
        this.marketWS[pair].onmessage = this.handleMessage.bind(this);

        this.marketWS[pair].onclose = () => {
            console.log(`Market WS ${pair} disconnected, reconnecting in 3s...`);
            setTimeout(() => this.reconnectMarketWS(pair), 3000);
        };
    }

    /* ---------- UI SUBSCRIPTIONS ---------- */

    subscribeUI(fn: () => void) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private emit() {
        // 👇 force change awareness
        this.version++;
        this.listeners.forEach(fn => fn());
    }
}

/* ================= SINGLETON ================= */

const socketManager = new MarketSocketManager();

/* ================= PUBLIC API ================= */

export function subscribeToMarket(cb: () => void) {
    return socketManager.subscribeUI(cb);
}

export function getCandles(pair: Pair, tf: Timeframe) {
    return candlesCache[pair][tf];
}

export function getMarketEvents(pair: Pair) {
    return marketEvents[pair];
}

// Return unplotted pending events for `pair` and `tf` (does NOT remove them)
export function getUnplottedPending(pair: Pair, tf: Timeframe) {
    const arr = pendingEvents[pair] || [];
    const out: any[] = [];
    for (const entry of arr) {
        const ev = entry.ev as any;
        const evTf = (ev.timeframe ?? ev.tf ?? '').toString().toLowerCase();
        if (!entry.plotted && evTf === tf.toLowerCase()) {
            out.push(ev);
        }
    }
    return out;
}

// Mark given event ids as plotted for a pair (ids: array of event.id)
export function markPendingPlotted(pair: Pair, ids: string[]) {
    const arr = pendingEvents[pair] || [];

    for (const entry of arr) {
        const ev = entry.ev as any;
        if (ev && ev.id && ids.includes(ev.id)) {
            entry.plotted = true;
        }
    }

    // 🧹 CLEANUP: remove old plotted entries
    pendingEvents[pair] = arr.filter(e => !e.plotted);
}

// Send ack for plotted event ids to backend if socket is open
export function sendPlottedAck(pair: Pair, ids: string[]) {
    try {
        const ws = (socketManager as any).marketWS[pair] as WebSocket | undefined;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ack', symbol: pair, ids }));
        }
    } catch (e) {
        // ignore
    }
}

export function subscribeToCandlesLoaded(cb: () => void) {
    candlesLoadedListeners.add(cb);
    return () => candlesLoadedListeners.delete(cb);
}
