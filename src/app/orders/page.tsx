"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/lib/hooks/useUser";
import { useRouter } from "next/navigation";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

type RawOrder = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      title: string;
      image_url?: string;
    } | null;
  }[];
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      title: string;
      image_url?: string;
    };
  }[];
};

export default function OrdersPage() {
  const { user, loading: userLoading } = useUser(); // ✅ fixed
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);
  

  useEffect(() => {
    if (userLoading || !user) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              title,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch orders:", error.message);
      } else {
        const safeData = (data as RawOrder[])?.map((order) => ({
          ...order,
          order_items: order.order_items.map((item) => ({
            ...item,
            product: item.product ?? {
              id: 0,
              title: "Unknown Product",
              image_url: ""
            }
          }))
        }));

        setOrders(safeData || []);
      }

      setLoading(false);
    };

    fetchOrders();
  }, [user, userLoading]);
  

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;

  return (
    // <div className="max-w-4xl mx-auto py-10 px-4">
    //   <h2 className="text-3xl font-bold mb-6">Your Orders</h2>

    //   {orders.length === 0 ? (
    //     <p className="text-gray-600">You haven’t placed any orders yet.</p>
    //   ) : (
    //     orders.map((order) => (
    //       <div
    //         key={order.id}
    //         className="mb-8 p-6 bg-white rounded shadow-md border"
    //       >
    //         <div className="mb-4">
    //           <p className="text-sm text-gray-500">
    //             Order #{order.id} • {new Date(order.created_at).toLocaleString()}
    //           </p>
    //           <p className="text-gray-700">Status: {order.status}</p>
    //           <p className="text-gray-700 font-semibold">
    //             Total: ${order.total_amount.toFixed(2)}
    //           </p>
    //         </div>
    //         <ul className="space-y-4">
    //           {order.order_items.map((item) => (
    //             <li key={item.id} className="flex items-center gap-4">
    //               {item.product.image_url && (
    //                 <img
    //                   src={item.product.image_url}
    //                   alt={item.product.title}
    //                   className="w-16 h-16 object-cover rounded"
    //                 />
    //               )}
    //               <div>
    //                 <h4 className="text-lg font-medium">{item.product.title}</h4>
    //                 <p className="text-sm text-gray-600">
    //                   Quantity: {item.quantity} • Price: ${item.price}
    //                 </p>
    //               </div>
    //             </li>
    //           ))}
    //         </ul>
    //         <StripeCheckoutButton />
    //       </div>
    //     ))
    //   )}
    // </div>
    <div className="max-w-4xl mx-auto py-10 px-4">
  <h2 className="text-3xl font-bold mb-6">Your Orders</h2>

  {orders.length === 0 ? (
    <p className="text-gray-600">You haven’t placed any orders yet.</p>
  ) : (
    orders.map((order) => (
      <div
        key={order.id}
        className="mb-8 p-6 bg-white rounded shadow-md border"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Order #{order.id} •{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
          <p className="text-gray-700">Status: {order.status}</p>
          <p className="text-gray-700 font-semibold">
            Total: ${order.total_amount.toFixed(2)}
          </p>
        </div>
        <ul className="space-y-4">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              {item.product.image_url && (
                <img
                  src={item.product.image_url}
                  alt={item.product.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <h4 className="text-lg font-medium">{item.product.title}</h4>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity} • Price: ${item.price}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Stripe checkout button at the end of order card */}
        <div className="mt-6">
          <StripeCheckoutButton  />
        </div>
      </div>
    ))
  )}
</div>

  );
}


