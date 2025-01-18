import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";
import cors from "cors"; // Import CORS

const app = express();
const PORT = 3000;

// Replace this with your private key
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDUxtQLtJIutCHF
+XFPddE+lRcA7mFkwGHc2lqgLTMNvDKR8g7nmKEW7fxKov0vm1ijgWT8Z7I9SAuJ
MOvhAhL4LnKC+otq8QSBgIoJjvwpXZDqe4Rp5ASyA8+jzyI+yI+FDxdlQVimdf9Y
GcdxfHeUtW5KN995b63S7zPk3FqD9W55XWldbvSN9EZAjjDy0KM8lbqMHonQszGY
/d8B49Jq7O8ZPoTZjSyrnTPC/2d0As3jTSHxncbpDB+bWI0+4iF/yW6sg2x/2lUb
A3KPjHk2mCx/m/c4ZNJqw2Z4Dh92aiJECY635q7YMJQZupGeukX1h1GqdNwIoqFX
lsnL+TNlAgMBAAECggEAAKEB6cDxxvo3SVcyQzhz3h+kIPYprw61Nyv4lJAPuh1i
Ri/yWYyYwEH4OCMg5MOLPphOu2RaHouDg/+JhWOixGoIpVt3fimKFl7HDHWIPSZ0
PS7vXsN0MWdLhhxHm5GYwy4IeqYTj2tFkPiZqqVy0lf9d+FYcViwLwqgtFCV0eiY
GaZZUwy/fR2J+gJads4dR0n9NLYUK6ueJv78AxVm+/3T3utvpv/ITHp7xrEov+K+
cSWKoiGrNTHCp3d7k/BpOGfmjIzgoYp60tyvxq0+7Wnvo7Kya1iGcKdCZqmjt00+
f6a9vg5V+O9Pr0wSDxbryRk1KTCGJgyYIhNBFaGkEQKBgQD/RRXi+kmKlw0ZESjq
m82jU9so6eYoFiN0JKqb3EvNFIxu9s9x0A4V06Mt5AeQ+omlqZU/tbmQ0xOgsrds
YFLsm7qbZGTvm3u2QAzaAJ4QfNSO3fpoRH5yDZVfvxniGNY4DCoivsefstiWGzNX
XG+VdaWhQdEmX0v6dYVwv1jv2QKBgQDVYqDY6iHM+J5t4Cg7s7ODIAW6vO9dx5i8
jpp/loYl6YsOngVJcsIBq7TaWFhxYHzyebCXFMt8vN48pdsShbAesiPqCstsgn0b
qPZFDXr0gkTELiD1QYpTbhiNN7VP6mZ4vCqv9E5z05S1vgo/XLhAuEGHjIkep1nq
dV09Gps0bQKBgFsD/+zA/s2qU+I3KxaTXLu6X270DrsGQbfchvQxlNlXVUcPOyHC
Y/NGVW08W7JGkiN+FpfzrGlFyT7H2fyLT6XLVLqpDhAcqPxvU+W6yKDqUUNrRCg/
G7KAw1yzH4BtCJxNQgzHZxe6xdyncCPa8nIg02BuvirnWYjAtEZiA0zpAoGBANIp
cKgTeTTqjQdEpfufEqeLy3jPCqX/pqPXg70z4G3IpgfAhQ6A8yk4F0iRiJIp6QXb
6pvyhDQXxH5REAIfH4YsB4lEFnSJ1HSApgT+sOHOx7G8iQNlCLsBDTdQ7ceG4mP5
V8Wyxe34LlgNkwQy6tn7X7cEKCzDwKBV9X3wDXrFAoGAeeAr+ad7/ygohomHzmAC
iTRpAnCpi+79pUyoSVBQ9FjVT7cA9s/5AcCgglofFEU4B33Db75x6fpJ2xZFqUww
5ZW5HY/+xTOcGw88yTJhe3+zQNEc4KjwWSV8JmWqPWWWaVgJ4NnbBGDPc9a4YNcF
Ry5dxN0kSzKx9pliIbUwRs8=
-----END PRIVATE KEY-----`;

// Enable CORS for all routes
app.use(cors()); // <-- Add this line

app.use(bodyParser.json());

// Endpoint to validate promocode
app.post("/validate-promocode", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Promocode is required" });
  }

  // Create the message for signing
  const message = JSON.stringify({ code });

  // Sign the message using the private key
  try {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(message); // message is the JSON body
    sign.end();
    const signature = sign.sign(privateKey, "base64");

    // Forward the signed request to the API
    const response = await fetch(
      "https://gbetlink.com/api/promocode/check-available",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sign": signature,
        },
        body: message,
      },
    );

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Error signing or forwarding the request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
