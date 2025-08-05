"use client";
import { supabase } from "../lib/supabaseClient";
import useUser from "../lib/hooks/useUser";
import { useState } from "react";

export default function StripeCheckoutButton() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      alert("Please login first.");
      return;
    }

    setLoading(true);

    // Fetch cart items from Supabase
    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(price, title)")
      .eq("user_id", user.id);

    if (error || !cartItems || cartItems.length === 0) {
      alert("Your cart is empty or there's an error.");
      setLoading(false);
      return;
    }

    // Send to /api/checkout
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartItems,
        user,
      }),
    });

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url; // Redirect to Stripe
    } else {
      alert("Something went wrong with Stripe.");
    }

    setLoading(false);
  };

  return (
    <button
      className="px-6 py-3 bg-blue-600 text-white rounded-md"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? "Processing..." : "Proceed to Checkout"}
    </button>
  );
}
