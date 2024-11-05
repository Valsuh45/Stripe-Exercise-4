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
      'pm_card_visa', // Replace with actual payment method ID
      {
        customer: customer.id,
      }
    );

    // Update the Customer's default Payment Method for invoices
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_123", // Replace with a valid price ID
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create an Invoice that automatically charges the Customer's default payment method
app.post("/create-invoice", async (req, res) => {
  try {
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

    if (!customer.invoice_settings.default_payment_method) {
      const paymentMethod = await stripe.paymentMethods.attach(
        'pm_card_visa', // Replace with actual payment method ID
        { customer: customer.id }
      );
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
      console.log("Default payment method set for customer:", paymentMethod.id);
    }

    // Create an invoice item for the customer
    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: 1000, // Amount in cents (e.g., $10.00)
      currency: "usd",
      description: "One-time setup fee",
    });

    // Create and finalize the invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "charge_automatically",
    });

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log("Invoice created and finalized successfully:", finalizedInvoice.id);

    res.json({ message: "Invoice created and finalized", invoiceId: finalizedInvoice.id });
  } catch (error) {
    console.error("Error creating invoice:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create Products & Prices if they don't already exist
app.post("/setup-products-prices", async (req, res) => {
  try {
    const existingProducts = await stripe.products.list();
    const existingPrices = await stripe.prices.list();

    const productNames = existingProducts.data.map((p) => p.name);
    const priceIds = existingPrices.data.map((p) => p.id);

    if (!productNames.includes("Basic Product")) {
      const basicProduct = await stripe.products.create({ name: "Basic Product" });
      console.log("Basic Product created:", basicProduct.id);

      const basicMonthly = await stripe.prices.create({
        unit_amount: 500,
        currency: "usd",
        recurring: { interval: "month" },
        product: basicProduct.id,
      });
      console.log("Basic Monthly Price created:", basicMonthly.id);

      const basicAnnual = await stripe.prices.create({
        unit_amount: 4900,
        currency: "usd",
        recurring: { interval: "year" },
        product: basicProduct.id,
      });
      console.log("Basic Annual Price created:", basicAnnual.id);
    }

    if (!productNames.includes("Pro Product")) {
      const proProduct = await stripe.products.create({ name: "Pro Product" });
      console.log("Pro Product created:", proProduct.id);

      const proMonthly = await stripe.prices.create({
        unit_amount: 1500,
        currency: "usd",
        recurring: { interval: "month" },
        product: proProduct.id,
      });
      console.log("Pro Monthly Price created:", proMonthly.id);

      const proAnnual = await stripe.prices.create({
        unit_amount: 13900,
        currency: "usd",
        recurring: { interval: "year" },
        product: proProduct.id,
      });
      console.log("Pro Annual Price created:", proAnnual.id);
    }

    if (!priceIds.includes("Free")) {
      const freePrice = await stripe.prices.create({
        unit_amount: 0,
        currency: "usd",
        product: existingProducts.data[0].id, // Attach to any existing product
      });
      console.log("Free Price created:", freePrice.id);
    }

    res.json({ message: "Products and Prices setup complete" });
  } catch (error) {
    console.error("Error setting up products and prices:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);
