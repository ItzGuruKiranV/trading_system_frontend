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

/* ================= SOCKET MANAGER ================= */
/**
 * PURE LISTENER WebSocket manager
 * - Backend broadcasts everything
 * - Frontend filters locally
 * - ZERO commands sent to backend
 * 
 */
type HeartbeatMessage = { type: 'heartbeat'; time: string; };
type MarketEventPacket = MarketEvent | HeartbeatMessage;
class MarketSocketManager {
    candleWS: Record<Pair, WebSocket> = {} as Record<Pair, WebSocket>;
    marketWS: Record<Pair, WebSocket> = {} as Record<Pair, WebSocket>;
    listeners = new Set<() => void>();
    PAIRS: Pair[] = ['EURUSD', 'GBPJPY'];
    constructor() {
        this.PAIRS.forEach(pair => {
            // ---------- CANDLES WS ----------
            this.candleWS[pair] = new WebSocket(
                `${API_BASE_URL.replace('http', 'ws')}/ws/candles/${pair}`
            );
            this.candleWS[pair].onmessage = e => {
                const msg: CandleMessage = JSON.parse(e.data);
                if (!candlesCache[msg.symbol]?.[msg.tf]) return;
                candlesCache[msg.symbol][msg.tf].push(msg);
                this.emit();
            };
            this.candleWS[pair].onclose = () => {
                console.log(`Candle WS ${pair} disconnected, reconnecting in 3s...`);
                setTimeout(() => this.reconnectCandleWS(pair), 3000);
            };

            // ---------- MARKET EVENTS WS ----------
            this.marketWS[pair] = new WebSocket(
                `${API_BASE_URL.replace('http', 'ws')}/ws/market/${pair}`
            );
            this.marketWS[pair].onmessage = e => {
                
                const packet: MarketEventPacket = JSON.parse(e.data);
                // console.log('WS message received', packet);
                if ('type' in packet && packet.type === 'heartbeat') {
                    console.log(`Heartbeat received: ${packet.time}`);
                    return;
                }
                if (!('symbol' in packet) || !Array.isArray(packet.events)) return;

                packet.events.forEach(ev => {
                    marketEvents[packet.symbol].push({
                        ...ev,
                        symbol: packet.symbol,
                        timeframe: packet.timeframe,
                    });
                });
                this.emit();
            };
            this.marketWS[pair].onclose = () => {
                console.log(`Market WS ${pair} disconnected, reconnecting in 3s...`);
                setTimeout(() => this.reconnectMarketWS(pair), 3000);
            };
        });
    }

    private reconnectCandleWS(pair: Pair) {
        this.candleWS[pair] = new WebSocket(
            `${API_BASE_URL.replace('http', 'ws')}/ws/candles/${pair}`
        );
        this.candleWS[pair].onmessage = e => {
            const msg: CandleMessage = JSON.parse(e.data);
            if (!candlesCache[msg.symbol]?.[msg.tf]) return;
            candlesCache[msg.symbol][msg.tf].push(msg);
            this.emit();
        };
        this.candleWS[pair].onclose = () => {
            console.log(`Candle WS ${pair} disconnected, reconnecting in 3s...`);
            setTimeout(() => this.reconnectCandleWS(pair), 3000);
        };
    }

    private reconnectMarketWS(pair: Pair) {
        this.marketWS[pair] = new WebSocket(
            `${API_BASE_URL.replace('http', 'ws')}/ws/market/${pair}`
        );
        this.marketWS[pair].onmessage = e => {
            const packet: MarketEventPacket = JSON.parse(e.data);
            if ('type' in packet && packet.type === 'heartbeat') return;
            if (!('symbol' in packet) || !Array.isArray(packet.events)) return;

            packet.events.forEach(ev => {
                marketEvents[packet.symbol].push({
                    ...ev,
                    symbol: packet.symbol,
                    timeframe: packet.timeframe,
                });
            });
            this.emit();
        };
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
