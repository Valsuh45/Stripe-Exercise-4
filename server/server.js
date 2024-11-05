const express = require("express");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

app.use(express.static(process.env.STATIC_DIR));

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Endpoint to create a Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  try {
    // Retrieve existing customer by email or create a new one if not found
    const email = "Boris@example.com";
    let customer = (await stripe.customers.list({ email, limit: 1 })).data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        name: "Boris",
        email,
      });
      console.log("Customer created successfully:", customer.id);
    } else {
      console.log("Reusing existing customer:", customer.id);
    }

    const paymentMethod = await stripe.paymentMethods.attach(
      'pm_card_visa',
      {
        customer: customer.id,
      }
    );
  // console.log("Payment method attached successfully:", paymentMethod);

    // Update the Customer's default Payment Method for invoices
    const updateCustomer = await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    console.log("Customer updated successfully:", updateCustomer);
    const requestId = updateCustomer.lastResponse.requestId;
    console.log("Request ID for updating customer:", requestId);


  // Set up a payment method for future use in the subscription
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [
      {
        price: "price_1QGFz1Hcq0BpKt6rnrZ4gL9t", // Replace with a valid price ID
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/cancel.html`,
  });

  console.log("Checkout Session created successfully:", session.id);
  res.json({ url: session.url });
} catch (error) {
  console.error("Error creating checkout session:", error.message);
  res.status(500).json({ error: error.message });
}

const paymentIntent = await stripe.paymentIntents.create({
  amount: 500,
  currency: 'eur',
  payment_method: 'pm_card_visa',
});

console.log("Payment Intent created successfully:", paymentIntent);

});
// Create Products & Prices if they don't already exist
app.post("/setup-products-prices", async (req, res) => {
  try {
    // Fetch existing products and prices to avoid duplicating them
    const existingProducts = await stripe.products.list();
    const existingPrices = await stripe.prices.list();

    const productNames = existingProducts.data.map((p) => p.name);
    const priceIds = existingPrices.data.map((p) => p.id);

    // Check and create Basic Product and Prices if they don't exist
    if (!productNames.includes("Basic Product")) {
      const basicProduct = await stripe.products.create({ name: "Basic Product" });
      console.log("Basic Product created:", basicProduct.id); // Log Basic Product ID

      const basicMonthly = await stripe.prices.create({
        unit_amount: 500,
        currency: "usd",
        recurring: { interval: "month" },
        product: basicProduct.id,
      });
      console.log("Basic Monthly Price created:", basicMonthly.id); // Log Basic Monthly Price ID

      const basicAnnual = await stripe.prices.create({
        unit_amount: 4900,
        currency: "usd",
        recurring: { interval: "year" },
        product: basicProduct.id,
      });
      console.log("Basic Annual Price created:", basicAnnual.id); // Log Basic Annual Price ID
    }

    // Check and create Pro Product and Prices if they don't exist
    if (!productNames.includes("Pro Product")) {
      const proProduct = await stripe.products.create({ name: "Pro Product" });
      console.log("Pro Product created:", proProduct.id); // Log Pro Product ID

      const proMonthly = await stripe.prices.create({
        unit_amount: 1500,
        currency: "usd",
        recurring: { interval: "month" },
        product: proProduct.id,
      });
      console.log("Pro Monthly Price created:", proMonthly.id); // Log Pro Monthly Price ID

      const proAnnual = await stripe.prices.create({
        unit_amount: 13900,
        currency: "usd",
        recurring: { interval: "year" },
        product: proProduct.id,
      });
      console.log("Pro Annual Price created:", proAnnual.id); // Log Pro Annual Price ID
    }

    // Check and create a Free Price if it doesn't exist
    if (!priceIds.includes("Free")) {
      const freePrice = await stripe.prices.create({
        unit_amount: 0,
        currency: "usd",
        product: existingProducts.data[0].id, // Attach to any existing product
      });
      console.log("Free Price created:", freePrice.id); // Log Free Price ID
    }

    res.json({ message: "Products and Prices setup complete" });
  } catch (error) {
    console.error("Error setting up products and prices:", error); // Log error for debugging
    res.status(500).json({ error: error.message });
  }
});

app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);