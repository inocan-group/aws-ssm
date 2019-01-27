// tslint:disable:no-implicit-dependencies
import SSM from "../src/index";
import * as chai from "chai";
const expect = chai.expect;

describe("basics →", () => {
  it("Invalid profile results in error", () => {
    try {
      const ssm = new SSM({
        profile: "test"
      });
      throw new Error("should not reach this point");
    } catch (e) {
      expect(e.name).to.equal("EmptyArray");
    }
  });

  it("Valid profile results in instantiation of SSM object", () => {
    const ssm = new SSM({
      profile: "test",
      credentialsDirectory: "../test/data"
    });
    expect(ssm).to.be.an("object");
    expect(ssm.get).to.be.a("function");
    expect(ssm.put).to.be.a("function");

    const config = ssm.configuration;
    expect(config.cli).to.equal(false);
    expect(config.region)
      .to.be.a("string")
      .and.is.equal("us-west-1");
    expect(config.credentials)
      .is.an("object")
      .and.has.property("secretAccessKey");
  });
});

describe.only("simple lifecycle test (put, get, remove) → ", () => {
  const ssm = new SSM({ profile: "ssm" });
  const PATH = "/test/1/firebase/FOO";
  const VALUE = "this is a test";

  it("PUT path based value works and parts are identified", async () => {
    try {
      const response = await ssm.put(PATH, VALUE);
      expect(response).to.be.an("number");
      expect(response).to.equal(1);
    } catch (e) {
      console.log(`  - Problem putting parameter ${PATH}`, e.message);
      throw e;
    }
  });

  it("GET parameter works", async () => {
    try {
      const response = await ssm.get(PATH);

      expect(response.version).to.equal(1);
      expect(response.path).to.equal(PATH);
      expect(response.type).to.equal("SecureString");
      expect(response.lastUpdated).to.be.a("date");
      expect(response.arn).to.be.a("string");
      expect(response.value).to.be.a("string");
      expect(response.encrypted).to.equal(true);
    } catch (e) {
      console.log(`Problem GETing parameter "${PATH}"`, e.message);
      throw e;
    }
  });

  it("DELETE parameter works", async () => {
    try {
      const noExist = await ssm.delete(PATH);
      expect(noExist).to.equal(null);
    } catch (e) {
      console.log(`Problem deleting parameter ${PATH}`, e.message);
      throw e;
    }
  });
});
