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
    [key: string]: any;   // 👈 allow event payload
};


/* ================= CACHES ================= */


const candlesCache: Record<Pair, Record<Timeframe, CandleMessage[]>> = {
    EURUSD: { '5m': [], '4h': [] },
    GBPJPY: { '5m': [], '4h': [] },
};

const renderQueue: Record<Pair, MarketEvent[]> = {
    EURUSD: [],
    GBPJPY: [],
};

const storeEvents: Record<Pair, MarketEvent[]> = {
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
        let packet: any;
        try {
            packet = JSON.parse(e.data);
        } catch {
            return;
        }

        if (!packet || !packet.symbol || !Array.isArray(packet.events)) return;

        const symbol = packet.symbol as Pair;
        let added = false;

        packet.events.forEach(ev => {
            const obj = {
                ...ev,
                symbol,
                timeframe: packet.timeframe,
            };

            // ✅ permanent
            storeEvents[symbol].push(obj);

            // ✅ one-time draw
            renderQueue[symbol].push(obj);

            added = true;
        });

        if (added) {
            this.emit();
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

export function getrenderQueue(pair: Pair) {
    return renderQueue[pair];
}

export function subscribeToCandlesLoaded(cb: () => void) {
    candlesLoadedListeners.add(cb);
    return () => candlesLoadedListeners.delete(cb);
}
export function getStoreEvents(pair: Pair) {
    return storeEvents[pair];
}

