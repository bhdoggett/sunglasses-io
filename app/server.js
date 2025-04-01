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

// Initalize variable for storing user acess token upon login
const validatedUsers = [];
const TOKEN_VALIDITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Helper for authentication
const authenticate = (request) => {
  const authToken = request.headers["x-authentication"];
  const currentValidatedUser = validatedUsers.find(
    (user) => user.token === authToken
  );
  const elapsedTime = new Date() - currentValidatedUser?.lastUpdated;
  const isValidToken = elapsedTime < TOKEN_VALIDITY_TIMEOUT;
  return { isValidToken, currentValidatedUser };
};

// Helper function to identify the correct user
const findUser = (email) => users.find((user) => user.email === email);

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

  const user = users.find((user) => {
    return (
      user.login.username == request.body.username &&
      user.login.password == request.body.password
    );
  });

  if (!user) {
    return response.status(401).json({ message: "Invalid login credentials" });
  }

  const validatedUser = {
    name: user.name,
    email: user.email,
    token: uid(16),
    lastUpdated: new Date(),
  };
  validatedUsers.push(validatedUser);

  return response.status(200).json(validatedUser);
});

app.get("/api/sunglasses/brands", (request, response) => {
  const brand = request.query?.brand;

  if (!brand) {
    return response
      .status(400)
      .json({ message: "Brand name required in query" });
  }
  if (brand) {
    const validBrandFromQuery = brands.find(
      (brandForSearch) => brandForSearch.name === brand
    );

    if (!validBrandFromQuery) {
      return response.status(404).json({ message: "Brand not found" });
    }

    const categoryId = brands.find(
      (brandForSearch) => brandForSearch.name === brand
    ).id;

    const sunglasses = products.filter(
      (product) => product.categoryId === categoryId
    );

    return response.status(200).json(sunglasses);
  }
});

app.get("/api/sunglasses/search", (request, response) => {
  const search = request.query?.search?.toLowerCase();

  if (!search) {
    return response.status(400).json({ message: "Search query required" });
  }

  if (search) {
    const sunglasses = products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search)
    );

    if (sunglasses.length === 0) {
      return response
        .status(404)
        .json({ message: "No sunglasses match your search" });
    }

    return response.status(200).json(sunglasses);
  }
});

app.post("/api/me/cart/:itemId", (request, response) => {
  const { currentValidatedUser, isValidToken } = authenticate(request);

  if (!isValidToken) {
    return response.status(401).json({
      message: "Login requried to add items to cart",
    });
  }

  const product = products.find(
    (product) => product.id === request.params.itemId
  );

  if (!product) {
    return response.status(404).json({ message: "Invalid product id" });
  }

  const user = findUser(currentValidatedUser.email);
  user.cart.push(product);

  return response
    .status(200)
    .json({ message: `Item ${product.id} added to cart` });
});

app.delete("/api/me/cart/:itemId", (request, response) => {
  const { currentValidatedUser, isValidToken } = authenticate(request);

  const idToRemove = request.params.itemId;

  const product = products.find((product) => product.id === idToRemove);

  if (!product) {
    return response.status(404).json({ message: "Invalid product id" });
  }

  if (!isValidToken) {
    return response.status(401).json({
      message: "Login requried to delete items from cart",
    });
  }

  const user = findUser(currentValidatedUser.email);
  console.log("user", user);
  const productIndex = user.cart.findIndex((item) => item.id === product.id);

  if (productIndex === -1) {
    return response.status(404).json({ message: "Product not found in cart" });
  }

  user.cart.splice(productIndex, 1);
  return response.status(200).json({
    message: `Item with product id ${product.id} deleted from cart`,
  });
});

app.get("/api/me/cart", (request, response) => {
  const { currentValidatedUser, isValidToken } = authenticate(request);

  if (!isValidToken) {
    return response.status(401).json({
      message: "Login requried to view cart",
    });
  }

  const user = findUser(currentValidatedUser.email);
  return response.status(200).json(user.cart);
});

module.exports = app;
