import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fetchPrice(productName) {
  try {
    const query = encodeURIComponent(productName);
    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?query=${query}&country=US&page=1`,
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
        },
      }
    );
    const data = await response.json();
    const product = data?.data?.products?.[0];
    if (!product) return null;
    const priceStr = product.product_price || product.product_original_price;
    if (!priceStr) return null;
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
    return isNaN(price) ? null : price;
  } catch (err) {
    console.error("Price fetch error:", err.message);
    return null;
  }
}

async function sendRefundEmail(userEmail, item, refundAmount, myEarning) {
  try {
    const userEarning = (refundAmount * 0.75).toFixed(2);
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PriceDrop <notifications@pricedrop-goq6.vercel.app>",
        to: userEmail,
        subject: `💸 $${userEarning} refund available on your ${item.name}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#030712;font-family:'Helvetica Neue',Arial,sans-serif;">
            <div style="max-width:560px;margin:40px auto;background:#0d1117;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
              
              <!-- Header -->
              <div style="background:#0d1117;padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:32px;height:32px;background:#34D399;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;color:#030712;font-weight:bold;">↓</div>
                  <span style="color:#f0f6fc;font-size:1.1rem;font-weight:800;letter-spacing:-0.02em;">PriceDrop</span>
                </div>
              </div>

              <!-- Body -->
              <div style="padding:40px;">
                <div style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.25);border-radius:12px;padding:20px;margin-bottom:28px;display:flex;align-items:center;gap:12px;">
                  <div style="width:10px;height:10px;background:#34D399;border-radius:50%;flex-shrink:0;"></div>
                  <span style="color:#34D399;font-size:0.95rem;font-weight:600;">Price drop detected on your item!</span>
                </div>

                <h1 style="color:#f0f6fc;font-size:1.6rem;font-weight:800;letter-spacing:-0.03em;margin:0 0 8px 0;">You have a refund waiting</h1>
                <p style="color:#7d8590;font-size:0.95rem;margin:0 0 32px 0;line-height:1.6;">
                  The price dropped on <strong style="color:#f0f6fc;">${item.name}</strong>. 
                  Claim your refund before the window closes!
                </p>

                <!-- Price breakdown -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:24px;margin-bottom:28px;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
                    <div>
                      <div style="color:#7d8590;font-size:0.7rem;letter-spacing:0.08em;margin-bottom:4px;">YOU PAID</div>
                      <div style="color:#f0f6fc;font-size:1.2rem;font-weight:700;">$${item.bought_price}</div>
                    </div>
                    <div>
                      <div style="color:#7d8590;font-size:0.7rem;letter-spacing:0.08em;margin-bottom:4px;">NOW</div>
                      <div style="color:#34D399;font-size:1.2rem;font-weight:700;">$${item.current_price}</div>
                    </div>
                    <div>
                      <div style="color:#7d8590;font-size:0.7rem;letter-spacing:0.08em;margin-bottom:4px;">YOUR REFUND</div>
                      <div style="color:#f0f6fc;font-size:1.2rem;font-weight:700;">$${userEarning}</div>
                    </div>
                  </div>
                  <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:16px;color:#7d8590;font-size:0.8rem;">
                    Total refund: $${refundAmount.toFixed(2)} · Your 75%: <strong style="color:#A78BFA;">$${userEarning}</strong> · PriceDrop fee: $${myEarning.toFixed(2)}
                  </div>
                </div>

                <!-- CTA Button -->
                <a href="https://pricedrop-goq6.vercel.app" 
                   style="display:block;background:#34D399;color:#030712;text-align:center;padding:16px;border-radius:10px;font-weight:700;font-size:1rem;text-decoration:none;margin-bottom:24px;">
                  Claim Your $${userEarning} Refund →
                </a>

                <p style="color:#7d8590;font-size:0.8rem;text-align:center;margin:0;">
                  You have ${item.refund_window || 30} days from purchase to claim this refund. Don't wait!
                </p>
              </div>

              <!-- Footer -->
              <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);">
                <p style="color:#7d8590;font-size:0.75rem;margin:0;text-align:center;">
                  PriceDrop — We watch prices so you don't have to.<br>
                  <a href="https://pricedrop-goq6.vercel.app" style="color:#34D399;text-decoration:none;">Open Dashboard</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    console.log(`Email sent to ${userEmail} for ${item.name}`);
  } catch (err) {
    console.error("Email send error:", err.message);
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .in("status", ["tracking", "refund_ready"]);

  if (error) return res.status(500).json({ error: error.message });
  if (!items?.length) return res.status(200).json({ message: "No items to check" });

  let updated = 0;
  let refundsFound = 0;

  for (const item of items) {
    const currentPrice = await fetchPrice(item.name);
    if (!currentPrice) continue;

    const history = [...(item.price_history || [item.bought_price]), currentPrice];
    const dropped = item.bought_price - currentPrice;
    const refundAmount = dropped > 0 ? parseFloat(dropped.toFixed(2)) : 0;
    const myEarning = parseFloat((refundAmount * 0.25).toFixed(2));

    let status = item.status;
    const wasTracking = item.status === "tracking";
    
    if (currentPrice < item.bought_price && wasTracking) {
      status = "refund_ready";
      refundsFound++;

      // Get user email and send notification
      const { data: userData } = await supabase
        .from("auth.users")
        .select("email")
        .eq("id", item.user_id)
        .single();

      // Use profiles table instead (more reliable)
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", item.user_id)
        .single();

      const email = profile?.email || userData?.email;
      if (email) {
        await sendRefundEmail(email, item, refundAmount, myEarning);
      }
    } else if (currentPrice >= item.bought_price && item.status === "refund_ready") {
      status = "tracking";
    }

    const { error: updateError } = await supabase
      .from("items")
      .update({
        current_price: currentPrice,
        lowest_price: Math.min(item.lowest_price || item.bought_price, currentPrice),
        price_history: history.slice(-30),
        status,
        refund_amount: refundAmount,
        my_earning: myEarning,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (!updateError) updated++;
    await new Promise((r) => setTimeout(r, 500));
  }

  return res.status(200).json({
    message: `Checked ${items.length} items. Updated ${updated}. Found ${refundsFound} new refunds.`,
  });
}
