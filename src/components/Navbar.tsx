"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, ShoppingBag, User, LogOut, ShieldAlert, Heart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export default function Navbar() {
  const { data: session } = useSession();
  const { items, toggleDrawer } = useCartStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Hamburger menu for mobile */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-black transition-colors hover:bg-neutral-100"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Left: Navigation links for desktop */}
          <nav className="hidden lg:flex lg:gap-8 font-bold uppercase tracking-wider text-xs">
            <Link href="/shop" className="hover:text-neutral-500 transition-colors">
              SHOP
            </Link>
            <Link href="/about" className="hover:text-neutral-500 transition-colors">
              ABOUT
            </Link>
            <Link href="/store" className="hover:text-neutral-500 transition-colors">
              STORE
            </Link>
          </nav>

          {/* Center: Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 transform text-center">
            <Link href="/" className="font-extrabold tracking-widest text-lg md:text-xl uppercase">
              OOs
            </Link>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Admin link if user is Admin */}
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-widest hover:bg-red-200 transition-colors"
                title="Admin panel"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}

            {/* User Profile / Dashboard Link */}
            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/wishlist"
                  className="p-2 text-black hover:bg-neutral-100 transition-colors rounded-none"
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="p-2 text-black hover:bg-neutral-100 transition-colors rounded-none"
                  title="Dashboard"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:block p-2 text-black hover:bg-neutral-100 transition-colors rounded-none"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="p-2 text-black hover:bg-neutral-100 transition-colors rounded-none"
                title="Login / Register"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Cart Icon with Badge */}
            <button
              onClick={() => toggleDrawer(true)}
              className="relative p-2 text-black hover:bg-neutral-100 transition-colors rounded-none"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-black text-[9px] font-bold text-white uppercase rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Menu slide-in from left) */}
      <div
        className={`fixed inset-0 z-50 transform transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Drawer Content */}
        <div
          className={`absolute inset-y-0 left-0 w-80 max-w-full bg-white px-6 py-6 shadow-2xl transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <span className="font-extrabold tracking-widest text-sm uppercase">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-black hover:bg-neutral-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-6 font-bold uppercase tracking-wider text-sm">
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-neutral-500 transition-colors"
            >
              SHOP
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-neutral-500 transition-colors"
            >
              ABOUT
            </Link>
            <Link
              href="/store"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-neutral-500 transition-colors"
            >
              STORE
            </Link>

            <hr className="border-neutral-100" />

            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-neutral-500 transition-colors"
                >
                  My Dashboard
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-neutral-500 transition-colors"
                >
                  My Wishlist
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 text-left hover:text-neutral-500 transition-colors uppercase text-sm font-bold"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-neutral-500 transition-colors"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
