import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { itemName, refundAmount, myEarning, itemId, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `PriceDrop Fee — ${itemName}`,
              description: `You get $${(refundAmount - myEarning).toFixed(2)} back from the store. PriceDrop keeps $${myEarning.toFixed(2)} (25%).`,
            },
            unit_amount: Math.round(myEarning * 100), // in cents
          },
          quantity: 1,
        },
      ],
      metadata: { itemId, userId },
      success_url: `${req.headers.origin}?payment=success&item=${itemId}`,
      cancel_url: `${req.headers.origin}?payment=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
}
