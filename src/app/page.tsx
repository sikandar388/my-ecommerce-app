"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
// import img1 from '/product-images/img1.PNG';

type Product = {
  id: number;
  title: string;
  price: number;
  image_url?: string;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (error) console.error("Error fetching products:", error);
      else setProducts(data || []);
    };

    fetchProducts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded-lg shadow">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-48 object-cover rounded mb-4"
              />
            )}
            <h2 className="text-lg font-semibold">{product.title}</h2>
            <p className="text-blue-600 font-bold mt-2">${product.price}</p>
            <a
              href={`/products/${product.id}`}
              className="inline-block mt-4 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              View Details
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

