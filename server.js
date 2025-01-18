// import express from "express";
// import bodyParser from "body-parser";
// import crypto from "crypto";
// import fetch from "node-fetch";
// import cors from "cors"; // Import CORS

// const app = express();
// const PORT = 3000;

// // Replace this with your private key
// const privateKey = ``;

// // Enable CORS for all routes
// app.use(cors()); // <-- Add this line

// app.use(bodyParser.json());

// // Endpoint to validate promocode
// app.post("/validate-promocode", async (req, res) => {
//   const { code } = req.body;

//   if (!code) {
//     return res.status(400).json({ error: "Promocode is required" });
//   }

//   // Create the message for signing
//   const message = JSON.stringify({ code });

//   // Sign the message using the private key
//   try {
//     const sign = crypto.createSign("RSA-SHA256");
//     sign.update(message); // message is the JSON body
//     sign.end();
//     const signature = sign.sign(privateKey, "base64");

//     // Forward the signed request to the API
//     const response = await fetch(
//       "https://gbetlink.com/api/promocode/check-available",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Sign": signature,
//         },
//         body: message,
//       },
//     );

//     const result = await response.json();
//     res.json(result);
//   } catch (error) {
//     console.error("Error signing or forwarding the request:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
