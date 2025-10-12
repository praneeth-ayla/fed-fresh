"use client";
import { signIn, useSession } from "next-auth/react";

export default function Home() {
  const session = useSession();
  return (
    <div>
      Fed Fresh
      {JSON.stringify(session)}
      <div className="flex gap-2 flex-col">
        <button
          className="hover:cursor-pointer"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
