import CheckoutSuccess from "./CheckoutSuccess";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CheckoutSuccess />
    </Suspense>
  );
}
