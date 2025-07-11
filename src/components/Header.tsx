"use client";

import useUser from "@/lib/hooks/useUser";

export default function Header() {
  const user = useUser();

  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-600">My E-Commerce App</h1>

      <div className="text-sm text-gray-700">
        {user ? (
          <>
            Logged in as <strong>{user.email}</strong>
          </>
        ) : (
          <span>Not logged in</span>
        )}
      </div>
    </header>
  );
}
