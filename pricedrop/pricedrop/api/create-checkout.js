export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, myEarning, itemId, itemName } = req.body;
  const chargeAmount = amount || myEarning;

  if (!chargeAmount || !itemId) {
    return res.status(400).json({ error: "Missing amount or itemId" });
  }

  try {
    // Get PayPal access token
    const authResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      return res.status(500).json({ error: "Failed to get PayPal access token" });
    }

    const origin = req.headers.origin || "https://pricedrop-goq6.vercel.app";

    // Create PayPal order
    const orderResponse = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: parseFloat(chargeAmount).toFixed(2),
            },
            description: `PriceDrop fee for: ${itemName || "price refund"}`,
            custom_id: itemId,
          },
        ],
        application_context: {
          return_url: `${origin}?payment=success&item=${itemId}`,
          cancel_url: `${origin}?payment=cancelled`,
          brand_name: "PriceDrop",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderData.id) {
      return res.status(500).json({ error: "Failed to create PayPal order", details: orderData });
    }

    // Find the approval URL
    const approvalUrl = orderData.links?.find((l) => l.rel === "approve")?.href;

    if (!approvalUrl) {
      return res.status(500).json({ error: "No approval URL from PayPal" });
    }

    return res.status(200).json({ url: approvalUrl });
  } catch (err) {
    console.error("PayPal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
