"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailAuth = async () => {
    setErrorMsg("");

    if (!email || !password) {
      return setErrorMsg("Email and password are required");
    }

    if (isLogin) {
      // Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setErrorMsg(error.message);
      router.push("/");
    } else {
      // Sign up with metadata
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) return setErrorMsg(error.message);
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) setErrorMsg(error.message);
    // On success, user will be redirected automatically to redirect URL set in Supabase dashboard
  };

  return (
    <div className="max-w-md mx-auto py-10 px-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? "Login to Your Account" : "Register as New User"}
      </h2>

      {!isLogin && (
        <>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mb-3 w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mb-3 w-full p-2 border rounded"
          />
        </>
      )}

      <input
        type="email"
        placeholder="Email"
        className="mb-3 w-full p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="mb-4 w-full p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {errorMsg && <p className="text-red-500 text-sm mb-3">{errorMsg}</p>}

      <button
        onClick={handleEmailAuth}
        className="w-full bg-blue-600 text-white py-2 rounded mb-3"
      >
        {isLogin ? "Login" : "Sign Up"}
      </button>

      <button
        onClick={handleGoogleLogin}
        className="w-full bg-red-600 text-white py-2 rounded mb-3"
      >
        Continue with Google
      </button>

      <p className="text-center text-sm">
        {isLogin ? "New user?" : "Already have an account?"}{" "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 underline"
        >
          {isLogin ? "Sign up here" : "Login"}
        </button>
      </p>
    </div>
  );
}
