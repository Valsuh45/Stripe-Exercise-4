import React from "react";

const Payment = () => {
  const handleGoToCheckout = async () => {
    try {


      // After successful setup, create the checkout session
      const checkoutResponse = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!checkoutResponse.ok) {
        const checkoutError = await checkoutResponse.json();
        throw new Error(`Checkout session creation failed: ${checkoutError.error}`);
      }

      const { url } = await checkoutResponse.json();
      if (url) {
        window.location.href = url; // Redirect to checkout page
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (error) {
      console.error("Error during checkout process:", error); // Log error for diagnostics
      alert("There was an issue with the checkout process. Please check the console for details.");
    }
    
          // First, set up products and prices
          const setupResponse = await fetch("/setup-products-prices ", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
    
          if (!setupResponse.ok) {
            const setupError = await setupResponse.json();
            throw new Error(`Setup failed: ${setupError.error}`);
          }
          console.log("Products and prices setup completed successfully");
  };

  return (
    <div>
      <button onClick={handleGoToCheckout}>Go to Checkout</button>
    </div>
  );
};

export default Payment;