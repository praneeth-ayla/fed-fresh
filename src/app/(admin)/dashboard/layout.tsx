import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import NavbarAdmin from "@/components/NavbarAdmin";
import { authOptions } from "@/lib/auth";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/");
  }
  return (
    <main className="flex flex-col h-screen">
      <NavbarAdmin />
      <div className="flex-1 overflow-auto">{children}</div>
    </main>
  );
}
