"use client";

import useUser from "@/lib/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { ShoppingCart, Search } from "lucide-react";
import Link from "next/link";
import useCartCount from "@/lib/hooks/useCartCount";

export default function Header() {
  const user = useUser();
  const cartCount = useCartCount();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">ShopEase</span>
          </Link>

          {/* Search Bar (Center) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-3 top-2.5 text-gray-500">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Right Side: Auth + Cart */}
          <div className="flex items-center space-x-4">
            {/* User Auth */}
            <div className="hidden sm:flex items-center space-x-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Hi,{" "}
                    <span className="font-medium">
                      {user?.email?.split("@")[0] || "User"}
                    </span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>

            <Link href="/cart" className="p-2 relative">
              <ShoppingCart className="text-gray-700" size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search (Hidden on Desktop) */}
        <div className="mt-3 md:hidden">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="absolute right-3 top-2.5 text-gray-500">
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
