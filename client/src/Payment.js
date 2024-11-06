import React, { useState } from "react";

const Payment = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleGoToCheckout = async () => {
    try {
      // First, retrieve or create the customer
      const customerResponse = await fetch("/create-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!customerResponse.ok) {
        const customerError = await customerResponse.json();
        throw new Error(`Customer creation failed: ${customerError.error}`);
      }

      const { customerId } = await customerResponse.json();
      console.log("Customer ID:", customerId);

      // After customer is set up, create the subscription
      const checkoutResponse = await fetch("/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          priceId: "price_123", // Replace with actual price ID
        }),
      });

      if (!checkoutResponse.ok) {
        const checkoutError = await checkoutResponse.json();
        throw new Error(`Checkout session creation failed: ${checkoutError.error}`);
      }

      const { clientSecret } = await checkoutResponse.json();
      if (clientSecret) {
        window.location.href = `/checkout?clientSecret=${clientSecret}`;
      } else {
        throw new Error("No client secret returned from server");
      }
    } catch (error) {
      console.error("Error during checkout process:", error);
      alert("There was an issue with the checkout process. Please check the console for details.");
    }
  };

  return (
    <div>
      <h3>Enter your details:</h3>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleGoToCheckout}>Go to Checkout</button>
    </div>
  );
};

export default Payment;
