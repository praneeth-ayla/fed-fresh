import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between px-16 py-5 border-b-2">
      <div>Logo</div>
      <div className="flex gap-8">
        <div className="flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/menu">Menu</Link>
          <Link href="/orders">Track your order</Link>
          <Link href="/cart">Cart</Link>
        </div>
      </div>
    </nav>
  );
}
