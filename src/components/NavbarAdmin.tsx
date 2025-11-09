"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function NavbarAdmin() {
  const path = usePathname();

  const isSelectedPath = (currentPath: string, expectedPath: string) =>
    currentPath === "/dashboard" + expectedPath ||
    currentPath.startsWith("/dashboard" + expectedPath + "/");
  return (
    <nav className="flex justify-between items-center border-b px-8 py-5 h-24">
      <div>Logo</div>
      <div className="flex gap-8">
        <div className="flex gap-12">
          <Link
            className={`${
              isSelectedPath(path, "/menu") ? "font-semibold" : ""
            }`}
            href="/dashboard/menu"
          >
            Menu management
          </Link>
          <Link
            className={`${
              isSelectedPath(path, "/orders") ? "font-semibold" : ""
            }`}
            href="/dashboard/orders"
          >
            Order management
          </Link>
          <Link
            className={`${
              isSelectedPath(path, "/pricing") ? "font-semibold" : ""
            }`}
            href="/dashboard/pricing"
          >
            Pricing
          </Link>
        </div>
        <div>ON/OFF</div>
      </div>
    </nav>
  );
}
