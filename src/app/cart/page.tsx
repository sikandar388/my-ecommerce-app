"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/lib/hooks/useUser";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: number;
    image_url?: string;
  };
};

export default function CartPage() {
  const user = useUser();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) return; // still loading auth state

    if (!user) {
      router.push("/login");
    } else {
      const fetchCart = async () => {
        const { data, error } = await supabase
          .from("cart_items")
          .select("id, quantity, product:products(id, title, price, image_url)")
          .eq("user_id", user.id)
          .returns<CartItem[]>();

        if (error) console.error("Error loading cart:", error.message);
        else setItems(data || []);

        setLoading(false);
      };

      fetchCart();
    }
  }, [user, router]);

  const handleRemove = async (cartItemId: number) => {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) {
    console.error("Failed to remove item:", error.message);
  } else {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  }
};


  if (loading) return <p className="text-center mt-10">Loading your cart...</p>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold mb-6">Your Cart</h2>

      {items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="bg-white p-6 rounded shadow-md flex gap-4 items-center">
              {item.product.image_url && (
                <img
                  src={item.product.image_url}
                  alt={item.product.title}
                  className="w-24 h-24 object-contain rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{item.product.title}</h3>
                <p className="text-gray-600">Price: ${item.product.price}</p>
                <p className="text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <div>
                <button className="text-red-600 hover:underline" onClick={() => handleRemove(item.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
