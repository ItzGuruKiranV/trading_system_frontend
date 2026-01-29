import Papa from 'papaparse';
import type { CandleMessage } from './marketStore';

type Pair = 'EURUSD' | 'GBPJPY';
type Timeframe = '5m' | '4h';

type CSVRow = {
    date: string;
    time: string;
    open: string;
    high: string;
    low: string;
    close: string;
};

export async function loadCSV(
    filePath: string,
    pair: Pair,
    tf: Timeframe
): Promise<CandleMessage[]> {
    const res = await fetch(filePath);
    const text = await res.text();

    return new Promise((resolve) => {
        Papa.parse<CSVRow>(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const candles: CandleMessage[] = results.data.map(row => {
                    // Try ISO-ish parse first, fallback to a space-separated parse
                    let ts = Date.parse(`${row.date.replace(/\./g, '-')}T${row.time}:00Z`);
                    if (isNaN(ts)) {
                        ts = Date.parse(`${row.date.replace(/\./g, '-')} ${row.time}Z`);
                    }

                    if (isNaN(ts)) return null;

                    const open = parseFloat(row.open as unknown as string);
                    const high = parseFloat(row.high as unknown as string);
                    const low = parseFloat(row.low as unknown as string);
                    const close = parseFloat(row.close as unknown as string);

                    if ([open, high, low, close].some(v => Number.isNaN(v))) return null;

                    return {
                        type: 'candle',
                        symbol: pair,
                        tf,
                        timestamp: ts,
                        open,
                        high,
                        low,
                        close,
                    };
                });

                // filter out any rows that failed parsing
                resolve(candles.filter((c): c is CandleMessage => c !== null));
            },
        });
    });
}
