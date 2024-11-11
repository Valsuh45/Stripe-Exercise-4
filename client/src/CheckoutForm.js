// import { PaymentElement } from "@stripe/react-stripe-js";
// import { useState } from "react";
// import { useStripe, useElements } from "@stripe/react-stripe-js";

// export default function CheckoutForm() {
//   const stripe = useStripe();
//   const elements = useElements();

//   const [message, setMessage] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!stripe || !elements) {
//       return;
//     }

//     setIsProcessing(true);
//     setMessage(null);

//     const { error, paymentIntent } = await stripe.confirmPayment({
//       elements,
//       confirmParams: {
//         return_url: `${window.location.origin}/completion`,
//       },
//     });

//     if (error) {
//       if (error.type === "card_error" || error.type === "validation_error") {
//         setMessage(error.message);
//       } else {
//         setMessage("An unexpected error occurred.");
//       }
//     } else if (paymentIntent && paymentIntent.status === "succeeded") {
//       setMessage("Payment successful! Thank you for your purchase.");
//     }

//     setIsProcessing(false);
//   };

//   return (
//     <form id="payment-form" onSubmit={handleSubmit}>
//       <PaymentElement id="payment-element" />
//       <button disabled={isProcessing || !stripe || !elements} id="submit">
//         <span id="button-text">
//           {isProcessing ? "Processing ..." : "Pay now"}
//         </span>
//       </button>
//       {message && <div id="payment-message">{message}</div>}
//     </form>
//   );
// }


import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function CheckoutForm({ email, priceId }) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet.
      return;
    }

    setIsProcessing(true);

    // Step 1: Create PaymentMethod using CardElement
    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        email: email, // Pass user email for customer creation
      },
    });

    if (error) {
      setMessage(error.message);
      setIsProcessing(false);
      return;
    }

    // Step 2: Create subscription with PaymentMethod ID and other details
    const response = await fetch("/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        email: email,
        priceId: "price_1QDouiHcq0BpKt6rkICqBssH",
      }),
    });

    const subscriptionResult = await response.json();

    if (subscriptionResult.error) {
      setMessage(subscriptionResult.error.message);
    } else {
      setMessage("Subscription successful!");
    }

    setIsProcessing(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <CardElement id="card-element" options={{ hidePostalCode: true }} />
      <button disabled={isProcessing || !stripe || !elements} id="submit">
        <span id="button-text">
          {isProcessing ? "Processing..." : "Subscribe"}
        </span>
      </button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
}
