import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import NavbarAdmin from "@/components/NavbarAdmin";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex flex-col h-screen">
      <NavbarAdmin />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
