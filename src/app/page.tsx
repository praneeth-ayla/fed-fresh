"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Fed Fresh</h1>

      <pre>{JSON.stringify(session, null, 2)}</pre>

      <div className="flex gap-2 flex-col">
        {!session && (
          <button
            className="hover:cursor-pointer"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Sign in with Google
          </button>
        )}

        {session?.user?.isAdmin && (
          <div className="mx-auto flex flex-col">
            <a href="/admin">products admin page</a>
            <button onClick={() => signOut()}>Logout</button>
          </div>
        )}

        {session && !session.user.isAdmin && (
          <p>You are signed in but not an admin.</p>
        )}
      </div>
    </div>
  );
}
