// import { useEffect, useState } from "react";
// import { Elements } from "@stripe/react-stripe-js";
// import CheckoutForm from "./CheckoutForm";
// import { loadStripe } from "@stripe/stripe-js";

// function Payment() {
//   const [stripePromise, setStripePromise] = useState(null);
//   const [clientSecret, setClientSecret] = useState("");
//   const [amount, setAmount] = useState(1999); // Default amount, you can set it dynamically

//   useEffect(() => {
//     fetch("/config").then(async (r) => {
//       const { publishableKey } = await r.json();
//       setStripePromise(loadStripe(publishableKey));
//     });
//   }, []);

//   useEffect(() => {
//     fetch("/create-payment-intent", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ amount }), // Pass amount dynamically
//     }).then(async (result) => {
//       const { clientSecret } = await result.json();
//       setClientSecret(clientSecret);
//     });
//   }, [amount]); // Re-fetch the clientSecret if the amount changes

//   return (
//     <>
//       <h1>React Stripe and the Payment Element</h1>
//       {clientSecret && stripePromise && (
//         <Elements stripe={stripePromise} options={{ clientSecret }}>
//           <CheckoutForm />
//         </Elements>
//       )}
//     </>
//   );
// }

// export default Payment;


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
