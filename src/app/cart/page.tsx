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
type CartItemWithPrice = {
  id: number;
  product_id: number;
  quantity: number;
  products: {
    price: number;
  };
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, loading } = useUser();

useEffect(() => {
  if (loading) return; // 👈 Don't redirect yet

  if (!user) {
    router.push("/login");
  }
}, [user, loading, router]);



  useEffect(() => {
    if (!user) return;
      const fetchCart = async () => {
        const { data, error } = await supabase
          .from("cart_items")
          .select("id, quantity, product:products(id, title, price, image_url)")
          .eq("user_id", user.id)
          .returns<CartItem[]>();

        if (error) console.error("Error loading cart:", error.message);
        else setItems(data || []);

        // setLoading(false);
      };

      fetchCart();
  }, [user, router]);
  

  const handleRemove = async (cartItemId: number) => {
  // Step 1: Get the cart item (quantity & product_id)
  const { data: cartItem, error: fetchError } = await supabase
    .from("cart_items")
    .select("quantity, product_id")
    .eq("id", cartItemId)
    .single();

  if (fetchError || !cartItem) {
    console.error("Failed to fetch cart item:", fetchError?.message);
    return;
  }

  // Step 2: Get current stock of the product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", cartItem.product_id)
    .single();

  if (productError || !product) {
    console.error("Failed to fetch product stock:", productError?.message);
    return;
  }

  const newStock = product.stock + cartItem.quantity;

  // Step 3: Update stock
  const { error: stockUpdateError } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", cartItem.product_id);

  if (stockUpdateError) {
    console.error("Failed to restore stock:", stockUpdateError.message);
    return;
  }

  // Step 4: Delete cart item
  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (deleteError) {
    console.error("Failed to remove item:", deleteError.message);
  } else {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  }
};

  const handlePlaceOrder = async () => {
    if (!user) return;

    // 1. Fetch cart items (with product price)
    const { data: cartItems, error: cartError } = await supabase
  .from("cart_items")
  .select("id, product_id, quantity, products(price)")
  .eq("user_id", user.id)
  .returns<CartItemWithPrice[]>();


    if (cartError || !cartItems || cartItems.length === 0) {
      alert("Your cart is empty or there was an error.");
      return;
    }

    // 2. Calculate total amount
    const totalAmount = cartItems.reduce((total, item) => {
      return total + item.quantity * (item.products?.price || 0);
    }, 0);

    // 3. Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        email: user.email,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error(orderError);
      alert("Failed to create order.");
      return;
    }

    // 4. Insert order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products.price,
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error(orderItemsError);
      alert("Failed to add products to the order.");
      return;
    }

    // 5. Clear cart
    const { error: clearError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (clearError) {
      console.error(clearError);
      alert("Order placed but failed to clear cart.");
      return;
    }

    alert("🎉 Order placed successfully!");
    router.push("/orders");
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
            <li
              key={item.id}
              className="bg-white p-6 rounded shadow-md flex gap-4 items-center"
            >
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
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        onClick={handlePlaceOrder}
      >
        Check Out
      </button>
    </div>
  );
}
