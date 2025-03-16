const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml"); // Replace './swagger.yaml' with the path to your Swagger file
const app = express();
const cors = require("cors");
const uid = require("rand-token").uid;

app.use(bodyParser.json());
app.use(cors());

// Importing the data from JSON files
const users = require("../initial-data/users.json");
const brands = require("../initial-data/brands.json");
const products = require("../initial-data/products.json");

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//Login
app.post("/api/login", (request, response) => {
  if (!request.body.username || !request.body.password) {
    return response
      .status(400)
      .json({ message: "Incomplete login information provided" });
  }
  console.log("Request:", request.body);
  const user = users.find((user) => {
    return (
      user.login.username == request.body.username &&
      user.login.password == request.body.password
    );
  });
  console.log("User:", user);

  if (!user) {
    return response.status(401).json({ message: "Invalid login credentials" });
  }

  const accessToken = { token: uid(16) };

  response.writeHead(200, { "Content-Type": "application/json" });
  return response.end(JSON.stringify(accessToken));
});

module.exports = app;
