import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Fetch current price from RapidAPI
async function fetchPrice(productName, store) {
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

    // Extract numeric price
    const priceStr = product.product_price || product.product_original_price;
    if (!priceStr) return null;
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
    return isNaN(price) ? null : price;
  } catch (err) {
    console.error("Price fetch error:", err.message);
    return null;
  }
}

export default async function handler(req, res) {
  // Protect with a secret so only Vercel cron can call this
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get all actively tracked items
  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .in("status", ["tracking", "refund_ready"]);

  if (error) return res.status(500).json({ error: error.message });
  if (!items?.length) return res.status(200).json({ message: "No items to check" });

  let updated = 0;
  let refundsFound = 0;

  for (const item of items) {
    const currentPrice = await fetchPrice(item.name, item.store);
    if (!currentPrice) continue;

    // Build updated price history
    const history = [...(item.price_history || [item.bought_price]), currentPrice];

    // Calculate refund if price dropped
    const dropped = item.bought_price - currentPrice;
    const refundAmount = dropped > 0 ? parseFloat(dropped.toFixed(2)) : 0;
    const myEarning = parseFloat((refundAmount * 0.25).toFixed(2));

    // Determine new status
    let status = item.status;
    if (currentPrice < item.bought_price && item.status === "tracking") {
      status = "refund_ready";
      refundsFound++;
    } else if (currentPrice >= item.bought_price && item.status === "refund_ready") {
      status = "tracking"; // Price went back up
    }

    // Update item in database
    const { error: updateError } = await supabase
      .from("items")
      .update({
        current_price: currentPrice,
        lowest_price: Math.min(item.lowest_price || item.bought_price, currentPrice),
        price_history: history.slice(-30), // Keep last 30 data points
        status,
        refund_amount: refundAmount,
        my_earning: myEarning,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (!updateError) updated++;

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  return res.status(200).json({
    message: `Checked ${items.length} items. Updated ${updated}. Found ${refundsFound} new refunds.`,
  });
}
