import cron from 'node-cron';
import pool from '../db/index.js';

const CGID_MAP = {
  bitcoin: 'bitcoin', ethereum: 'ethereum', solana: 'solana',
  binancecoin: 'binancecoin', ripple: 'ripple', cardano: 'cardano',
  dogecoin: 'dogecoin', 'avalanche-2': 'avalanche-2',
};

async function fetchPriceForId(coinId) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const headers = { Accept: 'application/json' };
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { signal: controller.signal, headers }
    );
    clearTimeout(timer);
    if (!r.ok) return null;
    const data = await r.json();
    return data[coinId]?.usd ?? null;
  } catch {
    return null;
  }
}

async function checkAlerts() {
  const { rows: alerts } = await pool.query(
    `SELECT pa.*, u.email FROM price_alerts pa
     JOIN users u ON u.id = pa.user_id
     WHERE pa.is_active = TRUE`
  );
  if (!alerts.length) return;

  const coinIds = [...new Set(alerts.map((a) => a.coin_id))];
  const prices = {};
  await Promise.all(
    coinIds.map(async (id) => {
      prices[id] = await fetchPriceForId(id);
    })
  );

  const triggered = alerts.filter((a) => {
    const price = prices[a.coin_id];
    if (price == null) return false;
    return a.is_above ? price >= Number(a.target_price) : price <= Number(a.target_price);
  });

  if (!triggered.length) return;

  await pool.query(
    'UPDATE price_alerts SET is_active = FALSE WHERE id = ANY($1::int[])',
    [triggered.map((a) => a.id)]
  );
  console.log(`[PriceAlert] ${triggered.length} alert(s) triggered`);

  if (!process.env.RESEND_API_KEY) {
    triggered.forEach((a) =>
      console.log(`  → ${a.email}: ${a.coin_id} ${a.is_above ? '≥' : '≤'} $${a.target_price} (current: $${prices[a.coin_id]})`)
    );
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await Promise.all(
    triggered.map((a) => {
      const name = a.coin_id.charAt(0).toUpperCase() + a.coin_id.slice(1);
      const dir = a.is_above ? 'above' : 'below';
      const current = prices[a.coin_id]?.toLocaleString('en-US', { maximumFractionDigits: 2 });
      const target = Number(a.target_price).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return resend.emails.send({
        from: 'CryptoAdvisor <noreply@resend.dev>',
        to: a.email,
        subject: `🚨 Price Alert: ${name} is ${dir} $${target}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#04040a;color:#fff;border-radius:16px;border:1px solid rgba(245,158,11,0.2)">
            <h2 style="color:#F59E0B;margin:0 0 8px">Price Alert Triggered 🚨</h2>
            <p style="color:rgba(255,255,255,0.7);margin:0 0 20px">Your target for <strong style="color:#fff">${name}</strong> has been reached.</p>
            <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:20px">
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#fff">${name}</p>
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.6)">Current price: <strong style="color:#22c55e">$${current}</strong></p>
              <p style="margin:0;color:rgba(255,255,255,0.6)">Your target: ${dir} <strong style="color:#fff">$${target}</strong></p>
            </div>
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0">This alert has been deactivated. Log in to set a new one.</p>
          </div>
        `,
      });
    })
  );
}

export function startPriceAlertCron() {
  cron.schedule('*/10 * * * *', () => {
    checkAlerts().catch((err) => console.error('[PriceAlert cron]', err.message));
  });
  console.log('✓ Price alert cron started (every 10 min)');
}
