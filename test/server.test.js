const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../app/server"); // Adjust the path as needed
// const randToken = require('rand-token')

chai.should();
chai.use(chaiHttp);

// TODO: Write tests for the server

describe("Login", () => {
  describe("POST /api/login", function () {
    it("Should return an access token for authentication if login credentials are valid", function (done) {
      const login = { username: "yellowleopard753", password: "jonjon" };

      //arrange
      chai
        .request(server)
        .post("/api/login")
        .send(login)
        .end((err, res) => {
          res.should.have.status(200);
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
          res.should.have.status(401);
          res.body.should.be.an("object");
          res.body.should.have
            .property("message")
            .eql("Invalid login credentials");
          done();
        });
    });
  });
});

describe("Brands", () => {
  describe("GET /api/sunglasses/brands", () => {
    it("should return an array of sunglasses of a given brand", function (done) {
      const brand = "Oakley";

      chai
        .request(server)
        .get(`/api/sunglasses/brands?brand=${brand}`)
        .end((err, res) => {
          res.status.should.eql(200);
          res.body.should.be.an("array");
          res.body.length.should.be.above(0);
          done();
        });
    });

    it("should return a 'Brand not found' error message if the specified brand does not exist", function (done) {
      const brand = "CoolSunglasses";

      chai
        .request(server)
        .get(`/api/sunglasses/brands?brand=${brand}`)
        .end((err, res) => {
          res.status.should.eql(404);
          res.body.message.should.eql("Brand not found");
          done();
        });
    });
  });

  describe("GET /api/sunglasses/query", () => {
    it("Should return an array of sunglasses based on a query string", function (done) {
      const query = "black";

      chai
        .request(server)
        .get("/api/sunglasses/brands")
        .send(query)
        .end((err, res) => {
          res.status.should.be(200);
          res.body.should.be.an("array");
          res.body.length.should.be.above(0);
          done();
        });
    });
  });
});

// describe("Cart", () => {});
