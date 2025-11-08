"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();

  const isSelectedPath = (currentPath: string, expectedPath: string) =>
    currentPath === expectedPath || currentPath.startsWith(expectedPath + "/");

  return (
    <nav className="bg-[#FFFDF6] px-16 flex items-center justify-between h-24 text-2xl">
      <div>Logo</div>
      <div className="flex gap-12">
        <Link
          href="/"
          className={`${
            isSelectedPath(path, "/")
              ? "font-semibold border-b-4 border-surface"
              : ""
          }`}
        >
          Home
        </Link>

        <Link
          href="/menu"
          className={`${
            isSelectedPath(path, "/menu")
              ? "font-semibold border-b-4 border-surface"
              : ""
          }`}
        >
          Menu
        </Link>

        <Link
          href="/orders"
          className={`${
            isSelectedPath(path, "/orders")
              ? "font-semibold border-b-4 border-surface"
              : ""
          }`}
        >
          Track your order
        </Link>

        <Link
          href="/cart"
          className={`${
            isSelectedPath(path, "/cart")
              ? "font-semibold border-b-4 border-surface"
              : ""
          }`}
        >
          Cart
        </Link>
      </div>
    </nav>
  );
}
