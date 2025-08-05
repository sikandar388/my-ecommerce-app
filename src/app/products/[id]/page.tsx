"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { X, ArrowLeft } from "lucide-react";
import useUser from "@/lib/hooks/useUser";

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  stock: number;
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ✅ unwrap the promise
  const [product, setProduct] = useState<Product | null>(null);
  const [firstLoading, setFirstLoading] = useState(true);
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (data) {
        setProduct(data);
      }
      setFirstLoading(false);
    };

    fetchProduct();
  }, [id]);

    const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Check if product is out of stock (based on current local state)
    if (product.stock <= 0) {
      alert("This product is out of stock!");
      return;
    }

    // Check if the item already exists in the cart
    const { data: existingItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching cart item:", fetchError.message);
      return;
    }

    // Update or insert item in cart
    if (existingItem) {
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id);

      if (updateError) {
        console.error("Update failed:", updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      });

      if (insertError) {
        console.error("Add to cart failed:", insertError.message);
        return;
      }
    }

    // Reduce stock in database
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: product.stock - 1 })
      .eq("id", product.id);

    if (stockError) {
      console.error("Stock update failed:", stockError.message);
      return;
    }

    // Refresh local product state
    const { data: updatedProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", product.id)
      .single();

    if (updatedProduct) {
      setProduct(updatedProduct);
    }

    alert("Item added to cart!");
  };

  if (firstLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Product Details
            </h1>
            <p className="text-gray-600 mt-1">View product information</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-10 text-center">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
                <X className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Product Not Found
              </h2>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                The product you are looking for does not exist or may have been
                removed or out of stock.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2 mx-auto"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Products</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (loading) return <p>Loading...</p>;

    return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-auto max-h-[400px] object-contain rounded mb-6"
        />
      )}

      <p className="text-gray-700 mb-4">{product.description}</p>
      <p className="text-2xl font-bold text-blue-600 mb-6">${product.price}</p>

      <button
        onClick={handleAddToCart}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
      >
        Add to Cart
      </button>
    </div>
  );
}
