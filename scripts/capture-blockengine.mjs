// Throwaway spike: subscribe to pond0x's blockengine channel and print payloads.
// Run during active mining to capture a populated mpool row shape.
//
// Usage (inline env vars, no dotenv):
//   NEXT_PUBLIC_POND0X_SUPABASE_URL=https://vkqjvwxzsxilnsmpngmc.supabase.co \
//   NEXT_PUBLIC_POND0X_SUPABASE_ANON_KEY=eyJ... \
//   node scripts/capture-blockengine.mjs
import { RealtimeClient } from "@supabase/realtime-js";

const URL = process.env.NEXT_PUBLIC_POND0X_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_POND0X_SUPABASE_ANON_KEY;
if (!URL || !KEY) { console.error("Set NEXT_PUBLIC_POND0X_SUPABASE_URL/ANON_KEY"); process.exit(1); }

const client = new RealtimeClient(`${URL.replace("https", "wss")}/realtime/v1`, {
  params: { apikey: KEY, eventsPerSecond: 5 },
});
const ch = client.channel("blockengine", { config: { broadcast: { ack: true } } });
ch.on("broadcast", { event: "mpool" }, (m) => {
  const pool = m?.payload?.pool ?? [];
  console.log(`mpool: ${pool.length} rows`, pool[0] ? JSON.stringify(pool[0]) : "(empty)");
})
  .on("broadcast", { event: "cycle" }, (m) => console.log("cycle:", JSON.stringify(m?.payload)?.slice(0, 400)))
  .subscribe((status) => console.log("SUB_STATUS:", status));

setTimeout(() => { console.log("done"); process.exit(0); }, 120000);
