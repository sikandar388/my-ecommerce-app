"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/lib/hooks/useUser";

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  image_url?: string;
};

export default function ProductDetailPage() {
  const params = useParams();
  const user = useUser();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!error && data) setProduct(data);
    };

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!user || !product) return;

    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id,
      product_id: product.id,
      quantity: 1,
    });

    if (error) {
      console.error("Add to cart failed:", error.message);
    } else {
      alert("Added to cart!");
    }
  };

  if (!product) return <p>Loading...</p>;

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
        disabled={!user}
      >
        Add to Cart
      </button>
    </div>
  );
}
