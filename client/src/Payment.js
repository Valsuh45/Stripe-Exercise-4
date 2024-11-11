import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";

function Payment({ useCardElement, email, priceId }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    fetch("/config").then(async (r) => {
      const { publishableKey } = await r.json();
      setStripePromise(loadStripe(publishableKey));
    });
  }, []);

  return (
    <>
      <h1>Stripe Subscription with {useCardElement ? "Card" : "Payment"} Element</h1>
      {stripePromise && (
        <Elements stripe={stripePromise}>
          <CheckoutForm email={email} priceId={priceId} />
        </Elements>
      )}
    </>
  );
}

export default Payment;
