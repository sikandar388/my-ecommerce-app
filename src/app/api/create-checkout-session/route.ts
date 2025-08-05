import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",// Updated to latest stable version
  typescript: true, // Recommended for TypeScript projects
});

type CartItem = {
  title: string;
  quantity: number;
  products: {
    price: number;
  };
};

export async function POST(req: NextRequest) {
  const { cartItems, user } = await req.json();

  const line_items = (cartItems as CartItem[]).map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(item.products.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
    metadata: {
      user_id: user.id,
    },
  });

  return NextResponse.json({ url: session.url });
}
