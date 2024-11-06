const express = require("express");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

app.use(express.static(process.env.STATIC_DIR));
app.use(express.json()); // Required to parse JSON body

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Endpoint to create a new customer or retrieve existing customer by email
app.post("/create-customer", async (req, res) => {
  const { email, name } = req.body;

  try {
    // Check if customer already exists
    let customer = (await stripe.customers.list({ email, limit: 1 })).data[0];
    if (!customer) {
      // Create a new customer if none found
      customer = await stripe.customers.create({
        email,
        name,
      });
      console.log("Customer created successfully:", customer.id);
    } else {
      console.log("Reusing existing customer:", customer.id);
    }

    res.json({ customerId: customer.id });
  } catch (error) {
    console.error("Error creating/retrieving customer:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create a subscription
app.post("/create-subscription", async (req, res) => {
  const { customerId, priceId } = req.body;

  try {
    // Create the subscription with payment_behavior 'default_incomplete' 
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'], // Expanding payment intent to get client secret
    });

    res.send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error("Error creating subscription:", error.message);
    res.status(400).json({ error: error.message });
  }
});

app.listen(5252, () => console.log(`Node server listening at http://localhost:5252`));
