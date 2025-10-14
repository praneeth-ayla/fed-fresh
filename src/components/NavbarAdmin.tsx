import Link from "next/link";

export default function NavbarAdmin() {
  return (
    <nav className="flex justify-between px-16 py-5 border-b-2">
      <div>Logo</div>
      <div className="flex gap-8">
        <div className="flex gap-4">
          <Link href="/admin/menu">Menu management</Link>
          <Link href="/admin/orders">Order management</Link>
          <Link href="/admin/pricing">Pricing</Link>
        </div>
        <div>ON/OFF</div>
      </div>
    </nav>
  );
}
