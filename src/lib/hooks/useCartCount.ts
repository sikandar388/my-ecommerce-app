"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "./useUser";

export default function useCartCount() {
  const { user, loading } = useUser();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user) return;

      const { count, error } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!error && count !== null) {
        setCount(count);
      }
    };

    fetchCartCount();
  }, [user, loading]);

  return count;
}

