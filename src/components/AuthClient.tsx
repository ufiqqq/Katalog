"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthClient({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Form States
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
      });

      if (res?.error) {
        setLoginError("Email atau Password salah.");
      } else {
        router.push(callbackUrl || "/");
        router.refresh();
      }
    } catch {
      setLoginError("Terjadi kesalahan sistem.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setRegisterLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || "Gagal melakukan registrasi.");
      } else {
        setRegisterSuccess("Registrasi berhasil! Silakan masuk.");
        setLoginEmail(registerEmail);
        setRegisterName("");
        setRegisterEmail("");
        setRegisterPassword("");
        // Automatically switch to login tab after brief pause
        setTimeout(() => {
          setActiveTab("login");
        }, 1500);
      }
    } catch {
      setRegisterError("Terjadi kesalahan koneksi.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-neutral-200 bg-white p-6 md:p-8">
      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-8">
        <button
          onClick={() => {
            setActiveTab("login");
            setRegisterError("");
            setRegisterSuccess("");
          }}
          className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === "login"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setActiveTab("register");
            setLoginError("");
          }}
          className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === "register"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Register
        </button>
      </div>

      {/* Login Tab Content */}
      {activeTab === "login" && (
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-black">
            Sign In to your Account
          </h2>

          {loginError && (
            <div className="bg-red-50 border-l-2 border-red-600 p-3 text-xs text-red-800 font-bold uppercase tracking-wider">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="email@example.com"
                className="input-flat animate-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="input-flat animate-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full btn-black py-4 uppercase tracking-widest font-extrabold text-xs"
          >
            {loginLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      )}

      {/* Register Tab Content */}
      {activeTab === "register" && (
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-black">
            Create an Account
          </h2>

          {registerError && (
            <div className="bg-red-50 border-l-2 border-red-600 p-3 text-xs text-red-800 font-bold uppercase tracking-wider">
              {registerError}
            </div>
          )}

          {registerSuccess && (
            <div className="bg-neutral-50 border-l-2 border-black p-3 text-xs text-black font-bold uppercase tracking-wider">
              {registerSuccess}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Thanks Insomnia"
                className="input-flat animate-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="email@example.com"
                className="input-flat animate-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="••••••••"
                className="input-flat animate-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={registerLoading}
            className="w-full btn-black py-4 uppercase tracking-widest font-extrabold text-xs"
          >
            {registerLoading ? "Creating Account..." : "Register"}
          </button>
        </form>
      )}
    </div>
  );
}
