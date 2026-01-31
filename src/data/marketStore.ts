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

    // ✅ NEW: connection guards
    private isConnecting: Record<Pair, boolean> = {
        EURUSD: false,
        GBPJPY: false,
    };

    private isConnected: Record<Pair, boolean> = {
        EURUSD: false,
        GBPJPY: false,
    };

    constructor() {
        loadAllCandlesOnce().then(() => {
            this.PAIRS.forEach(pair => this.initMarketWS(pair));
        });
    }

    private initMarketWS(pair: Pair) {
        if (this.isConnecting[pair] || this.isConnected[pair]) return;

        console.log(`[WS] Attempting connection for ${pair}...`);
        this.isConnecting[pair] = true;

        const ws = new WebSocket(
            `${API_BASE_URL.replace('http', 'ws')}/ws/market/${pair}`
        );

        this.marketWS[pair] = ws;

        ws.onopen = () => {
            console.log(`[WS] Connected for ${pair}`);
            this.isConnected[pair] = true;
            this.isConnecting[pair] = false;
        };

        ws.onmessage = (event) => {
            console.log(`[WS RAW ${pair}]`, event.data);

            try {
                const parsed = JSON.parse(event.data);
                console.log(`[WS PARSED ${pair}]`, parsed);
            } catch {
                console.warn(`[WS ${pair}] Non-JSON message`);
            }

            this.handleMessage(event);
        };

        ws.onclose = () => {
            console.log(`[WS] Disconnected for ${pair}`);
            this.isConnected[pair] = false;
            this.isConnecting[pair] = false;

            setTimeout(() => {
                this.initMarketWS(pair);
            }, 3000);
        };

        ws.onerror = (err) => {
            console.error(`[WS ERROR ${pair}]`, err);
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

            storeEvents[symbol].push(obj);
            renderQueue[symbol].push(obj);
            added = true;

    const tf = (packet.timeframe || "").toLowerCase().trim();
    console.log("🔥 STORED EVENT:", symbol, tf);
    if (symbol === "EURUSD" && tf === "5m") {
        console.log("🔥 EURUSD 5m STORED EVENT:", obj);
    }

        });

        if (added) {
            this.emit();
        }
    }

    subscribeUI(fn: () => void) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private emit() {
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