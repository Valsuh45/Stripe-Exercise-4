// const express = require("express");
// const app = express();
// const { resolve } = require("path");
// const env = require("dotenv").config({ path: "./.env" });
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: "2022-08-01",
// });

// app.use(express.static(process.env.STATIC_DIR));
// app.use(express.json()); // Enable parsing of JSON bodies for POST requests

// app.get("/", (req, res) => {
//   const path = resolve(process.env.STATIC_DIR + "/index.html");
//   res.sendFile(path);
// });

// app.get("/config", (req, res) => {
//   res.send({
//     publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
//   });
// });

// app.post("/create-payment-intent", async (req, res) => {
//   const { amount = 1999, currency = "EUR" } = req.body; // Retrieve amount from client request, default to 1999 EUR

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency,
//       automatic_payment_methods: { enabled: true },
//     });

//     res.send({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (e) {
//     res.status(400).send({
//       error: {
//         message: e.message,
//       },
//     });
//   }
// });

// app.listen(5252, () => console.log(`Node server listening at http://localhost:5252`));


const express = require("express");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

app.use(express.static(process.env.STATIC_DIR));
app.use(express.json());

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  const { amount = 1999, currency = "EUR" } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

// New endpoint to create a subscription and set default payment method
// app.post("/create-subscription", async (req, res) => {
//   const { paymentMethodId, email, priceId } = req.body;

//   try {
//     // Step 1: Create or retrieve an existing customer based on email
//     const customers = await stripe.customers.list({
//       email,
//       limit: 1,
//     });

//     let customer;
//     if (customers.data.length > 0) {
//       customer = customers.data[0];
//     } else {
//       customer = await stripe.customers.create({
//         email,
//       });
//     }

//     // Step 2: Attach the PaymentMethod to the customer if it’s not already attached
//     const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
//     if (paymentMethod.customer !== customer.id) {
//       await stripe.paymentMethods.attach(paymentMethodId, {
//         customer: customer.id,
//       });
//     }

//     // Step 3: Set the default payment method for future invoices
//     await stripe.customers.update(customer.id, {
//       invoice_settings: {
//         default_payment_method: paymentMethodId,
//       },
//     });

//     // Step 4: Create the subscription with the specified price ID
//     const subscription = await stripe.subscriptions.create({
//       customer: customer.id,
//       items: [{ price: priceId }],  // Ensure priceId is provided in the items array
//       default_payment_method: paymentMethodId,
//       expand: ["latest_invoice.payment_intent"],
//     });

//     res.send({
//       subscriptionId: subscription.id,
//       clientSecret: subscription.latest_invoice.payment_intent.client_secret,
//     });
//   } catch (error) {
//     res.status(400).send({
//       error: {
//         message: error.message,
//       },
//     });
//   }
// });


app.post("/create-subscription", async (req, res) => {
  const { paymentMethodId, email, priceId } = req.body;

  try {
    // Step 1: Create or retrieve an existing customer based on email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
      });
    }

    // Step 2: Attach the PaymentMethod to the customer if it’s not already attached
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== customer.id) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
    }

    // Step 3: Set the default payment method for future invoices
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Step 4: Create the subscription with `allow_incomplete` and specified price ID
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      payment_behavior: "allow_incomplete", // Allows incomplete status if payment fails
      expand: ["latest_invoice.payment_intent"],
    });

    res.send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent?.client_secret,
    });
  } catch (error) {
    res.status(400).send({
      error: {
        message: error.message,
      },
    });
  }
});


app.listen(5252, () => console.log(`Node server listening at http://localhost:5252`));
