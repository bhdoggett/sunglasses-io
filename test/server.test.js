const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../app/server");

chai.should();
chai.use(chaiHttp);

describe("Login", () => {
  describe("POST /api/login", function () {
    it("Should return an access token for authentication if login credentials are valid", function (done) {
      const login = { username: "yellowleopard753", password: "jonjon" };

      chai
        .request(server)
        .post("/api/login")
        .send(login)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.should.be.an("object");
          res.body.should.have.property("token");
          res.body.token.should.be.a("string");
          done();
        });
    });

    it("Should return an error message for invalid login credentials", function (done) {
      const login = { username: "wrongUsername", password: "wrongPassword" };

      chai
        .request(server)
        .post("/api/login")
        .send(login)
        .end((err, res) => {
          res.status.should.equal(401);
          res.body.should.be.an("object");
          res.body.should.have
            .property("message")
            .equal("Invalid login credentials");
          done();
        });
    });
  });
});

describe("Brands", () => {
  describe("GET /api/sunglasses/brands", () => {
    it("should return a 'Brand name required in query' error message if no brand parameter is present in query", function (done) {
      chai
        .request(server)
        .get("/api/sunglasses/brands?")
        .end((err, res) => {
          res.status.should.equal(400);
          res.body.should.be.an("object");
          res.body.message.should.equal("Brand name required in query");
          done();
        });
    });

    it("should return an array of sunglasses for a given valid brand", function (done) {
      const brand = "Oakley";

      chai
        .request(server)
        .get(`/api/sunglasses/brands?brand=${brand}`)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.should.be.an("array");
          res.body[0].name.should.equal("Superglasses");
          done();
        });
    });

    it("should return a 'Brand not found' error message if the specified brand does not exist", function (done) {
      const brand = "CoolSunglasses";

      chai
        .request(server)
        .get(`/api/sunglasses/brands?brand=${brand}`)
        .end((err, res) => {
          res.status.should.equal(404);
          res.body.message.should.equal("Brand not found");
          done();
        });
    });
  });

  describe("GET /api/sunglasses/search", () => {
    it("should return a 'Search query required' error message if no search terms are provided", function (done) {
      chai
        .request(server)
        .get("/api/sunglasses/search?")
        .end((err, res) => {
          res.status.should.equal(400);
          res.body.should.be.an("object");
          res.body.message.should.equal("Search query required");
          done();
        });
    });

    it("Should return an array of sunglasses based on a valid query string", function (done) {
      const search = "black";

      chai
        .request(server)
        .get(`/api/sunglasses/search?search=${search}`)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body[0].name.should.equal("Black Sunglasses");
          done();
        });
    });

    it("Should return a 'No sunglasses match your search' message if the query string cannot be found in the products.name or products.description fields", function (done) {
      const search = "98jslfj";

      chai
        .request(server)
        .get(`/api/sunglasses/search?search=${search}`)
        .end((err, res) => {
          res.status.should.equal(404);
          res.body.message.should.equal("No sunglasses match your search");
          done();
        });
    });
  });
});

describe("Cart", () => {
  describe("POST /api/me/cart/:itemId", function () {
    describe("If the user is authenticated", function (done) {
      it('should send an "Invalid product id" message for unrecognized product id', function (done) {
        const login = { username: "yellowleopard753", password: "jonjon" };
        let validatedUser;

        // log in to receive valid access token
        chai
          .request(server)
          .post("/api/login")
          .send(login)
          .end((err, res) => {
            validatedUser = res.body;

            // send post request to add item to cart
            chai
              .request(server)
              .post("/api/me/cart/0")
              .set("X-Authentication", validatedUser.token)
              .end((err, res) => {
                res.status.should.equal(404);
                res.body.should.be.an("object");
                res.body.message.should.equal("Invalid product id");
              });
            done();
          });
      });

      it("should add a given item to the user's cart", function (done) {
        const login = { username: "yellowleopard753", password: "jonjon" };
        let validatedUser;

        // log in to receive valid access token
        chai
          .request(server)
          .post("/api/login")
          .send(login)
          .end((err, res) => {
            validatedUser = res.body;

            // send post request to add item to cart
            chai
              .request(server)
              .post("/api/me/cart/1")
              .set("X-Authentication", validatedUser.token)
              .end((err, res) => {
                res.status.should.equal(200);
                res.body.should.be.an("object");
                res.body.message.should.equal("Item 1 added to cart");
              });
            done();
          });
      });
    });

    describe("If the user is not authenticated", function () {
      it("should send a 'Login required to add items to the cart' errormessage", function (done) {
        // send post request to add item to cart WITHOUT authentication
        chai
          .request(server)
          .post("/api/me/cart/1")
          .set("X-Authentication", "_NONE_")
          .end((err, res) => {
            res.status.should.equal(401);
            res.body.should.be.an("object");
            res.body.message.should.equal(
              "Login requried to add items to cart"
            );
            done();
          });
      });
    });
  });

  describe("DELETE /api/me/cart/:itemId", function () {
    describe("If the user is authenticated", function () {
      it("should should send an error message if the item is not in the cart", function (done) {
        const login = { username: "yellowleopard753", password: "jonjon" };
        let validatedUser;

        // log in to receive valid access token
        chai
          .request(server)
          .post("/api/login")
          .send(login)
          .end((err, res) => {
            validatedUser = res.body;

            // send post request to add item to cart
            chai
              .request(server)
              .post("/api/me/cart/1")
              .set("X-Authentication", validatedUser.token)
              .end((err, res) => {
                // send delete request to remove item from cart
                chai
                  .request(server)
                  .delete("/api/me/cart/2")
                  .set("X-Authentication", validatedUser.token)
                  .end((err, res) => {
                    res.status.should.equal(404);
                    res.body.should.be.an("object");
                    res.body.message.should.equal("Product not found in cart");
                    done();
                  });
              });
          });
      });

      it("should should delete a valid item from the user's cart", function (done) {
        const login = { username: "yellowleopard753", password: "jonjon" };
        let validatedUser;

        // log in to receive valid access token
        chai
          .request(server)
          .post("/api/login")
          .send(login)
          .end((err, res) => {
            validatedUser = res.body;

            // send post request to add item to cart
            chai
              .request(server)
              .post("/api/me/cart/1")
              .set("X-Authentication", validatedUser.token)
              .end((err, res) => {
                // send delete request to remove item from cart
                chai
                  .request(server)
                  .delete("/api/me/cart/1")
                  .set("X-Authentication", validatedUser.token)
                  .end((err, res) => {
                    res.status.should.equal(200);
                    res.body.should.be.an("object");
                    res.body.message.should.equal(
                      "Item with product id 1 deleted from cart"
                    );
                    done();
                  });
              });
          });
      });
    });

    describe("If the user is not authenticated", function () {
      it("should send a 'Login required to delete items from the cart' error message", function (done) {
        // send post request to add item to cart WITHOUT authentication
        chai
          .request(server)
          .delete("/api/me/cart/1")
          .set("X-Authentication", "_NONE_")
          .end((err, res) => {
            res.status.should.equal(401);
            res.body.should.be.an("object");
            res.body.message.should.equal(
              "Login requried to delete items from cart"
            );
            done();
          });
      });
    });
  });

  describe("GET /api/me/cart", function () {
    describe("If the user is authenticated", function () {
      it("should return the user's cart", function (done) {
        const login = { username: "yellowleopard753", password: "jonjon" };
        let validatedUser;

        // log in to receive valid access token
        chai
          .request(server)
          .post("/api/login")
          .send(login)
          .end((err, res) => {
            validatedUser = res.body;

            // send post request to add item to cart
            chai
              .request(server)
              .post("/api/me/cart/1")
              .set("X-Authentication", validatedUser.token)
              .end((err, res) => {
                // send delete request to remove item from cart
                chai
                  .request(server)
                  .get("/api/me/cart")
                  .set("X-Authentication", validatedUser.token)
                  .end((err, res) => {
                    res.status.should.equal(200);
                    res.body.should.be.an("array");
                    res.body.length.should.be.above(0);
                    res.body[0].should.be.an("object");
                    res.body[0].name.should.equal("Superglasses");
                    done();
                  });
              });
          });
      });
    });
    describe("If the user is not authenticated", function () {
      it("should send a 'Login required to access the cart' error message", function (done) {
        // attempt to retrieve cart WITHOUT authentication
        chai
          .request(server)
          .get("/api/me/cart")
          .set("X-Authentication", "_NONE_")
          .end((err, res) => {
            res.status.should.equal(401);
            res.body.should.be.an("object");
            res.body.message.should.equal("Login requried to view cart");
            done();
          });
      });
    });
  });
});
