import { clsx } from "clsx"; import { twMerge } from "tailwind-merge";
export function cn(...inputs: any[]) { return twMerge(clsx(inputs)); }
export const short = (s: string, n = 4) => (s ? `${s.slice(0, n)}…${s.slice(-n)}` : "");
export const solscanTx = (sig: string) => `https://solscan.io/tx/${sig}?cluster=mainnet`;
export const now = () => new Date().toLocaleTimeString();
