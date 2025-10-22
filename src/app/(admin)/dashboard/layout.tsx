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
    <>
      <NavbarAdmin />
      <div className="flex flex-1">{children}</div>
    </>
  );
}
