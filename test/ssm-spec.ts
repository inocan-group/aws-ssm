// tslint:disable:no-implicit-dependencies
import { SSM } from "../src/index";
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

describe("simple lifecycle test (put, get, remove) and fully qualified path ", () => {
  const ssm = new SSM({ profile: "ssm" });
  const PATH = "/test/1/firebase/FOO";
  const VALUE = "this is a test";

  after(async () => {
    try {
      ssm.delete(PATH);
    } catch {
      // just to double check that delete has happened
    }
  });

  it("PUT path based value works and parts are identified", async () => {
    try {
      const response = await ssm.put(PATH, VALUE, { override: true });
      expect(response).to.be.an("number");
      expect(response).to.equal(1);
    } catch (e) {
      console.log(`  - Problem putting parameter ${PATH}: `, e.message);
      throw e;
    }
  });

  it("GET parameter works (without decryption)", async () => {
    try {
      const response = await ssm.get(PATH);

      // expect(response.version).to.equal(1);
      expect(response.path).to.equal(PATH);
      expect(response.type).to.equal("SecureString");
      expect(response.lastUpdated).to.be.a("date");
      expect(response.arn).to.be.a("string");
      expect(response.value).to.be.a("string");
      expect(response.encrypted).to.equal(true);
      expect(response.value).to.not.equal(VALUE);
    } catch (e) {
      console.log(`Problem GETing parameter "${PATH}": `, e.message);
      throw e;
    }
  });

  it("GET parameter works (with decryption)", async () => {
    try {
      const response = await ssm.get(PATH, { decrypt: true });

      // expect(response.version).to.equal(1);
      expect(response.path).to.equal(PATH);
      expect(response.type).to.equal("SecureString");
      expect(response.lastUpdated).to.be.a("date");
      expect(response.arn).to.be.a("string");
      expect(response.value).to.be.a("string");
      expect(response.encrypted).to.equal(false);
      expect(response.value).to.equal(VALUE);
    } catch (e) {
      console.log(`Problem GETing parameter "${PATH}"`, e.message);
      throw e;
    }
  });

  it("LIST with 'path' returns results with encrypted value", async () => {
    const params = await ssm.list("/test/1/firebase");

    expect(params).to.have.length(1);
    expect(params[0].Value).to.not.equal(VALUE);
    expect(params[0].encrypted).to.equal(true);

    const params2 = await ssm.list({
      path: "/test/1/firebase",
      decrypt: false
    });

    expect(params2).to.have.length(1);
    expect(params2[0].Value).to.exist.and.to.not.equal(VALUE);
  });

  it("VALUES with 'path' returns results with a decrypted value", async () => {
    const params = await ssm.values("/test/1/firebase");

    expect(params).to.have.length(1);
    expect(params[0].Value).to.equal(VALUE);

    const params2 = await ssm.list({
      path: "/test/1/firebase",
      decrypt: false
    });

    expect(params2).to.have.length(1);
    expect(params2[0].Value).to.exist.and.to.not.equal(VALUE);
  });

  it("DELETE parameter works", async () => {
    try {
      const noExist = await ssm.delete(PATH);
    } catch (e) {
      console.log(`Problem deleting parameter ${PATH}`, e.message);
      throw e;
    }
  });

  it("LIST with 'path' returns empty set", async () => {
    const params = await ssm.list("/test/1/firebase");
    expect(params).to.have.length(0);
  });
});

describe.only("more complex lifecycle tests (lists, toEnv, remove) → ", () => {
  const ssm = new SSM({ profile: "ssm" });
  const PATH1 = "/test/2/firebase/KEY";
  const PATH2 = "/test/2/firebase/SECRET";
  const PATH3 = "/stage/1/firebase";
  const VALUE1 = "this is a test";
  const VALUE2 = "this is a test too";
  const VALUE3 = "this is a test three";

  beforeEach(async () => {
    try {
      await ssm.put(PATH1, VALUE1, { override: true });
      await ssm.put(PATH2, VALUE2, { override: true });
      await ssm.put(PATH3, VALUE3, { override: true });
    } catch (e) {
      console.log(`  - Problem putting parameter to setup tests [ssm]: `, e.message);
      process.exit();
    }
  });

  afterEach(async () => {
    try {
      await ssm.delete(PATH1);
      await ssm.delete(PATH2);
      await ssm.delete(PATH3);
    } catch (e) {
      console.log(`  - Problem cleaning up parameters after test`, e.message);
      process.exit();
    }
  });

  it("LIST with no parameters returns multiple results and results have right structure", async () => {
    const params = await ssm.list();
    console.log(JSON.stringify(params, null, 2));

    expect(params).to.be.an("array");

    const keys = params.map(p => p.Name);

    expect(keys).to.include(PATH1);
    expect(keys).to.include(PATH2);
    expect(keys).to.include(PATH3);
    const path1 = params.filter(p => p.Name === PATH1)[0];
    expect(path1).to.haveOwnProperty("ARN");
    expect(path1).to.haveOwnProperty("LastModifiedDate");
    expect(path1).to.haveOwnProperty("Version");
    expect(path1.Value).to.not.equal(VALUE1); // because it should be encrypted
    expect(path1.encrypted).to.equal(true);
  });

  it("LIST with string 'path' returns all parameters that originate with that path", async () => {
    let params = await ssm.list("/test");

    expect(params).to.have.length(2);
    params = await ssm.list("/stage");
    expect(params).to.have.length(1);
    params = await ssm.list("/test/2/firebase");
    expect(params).to.have.length(2);
    params = await ssm.list("/silly/path");
    expect(params).to.have.length(0);
  });

  it("VALUES with no parameters returns multiple results and values are decrypted", async () => {
    const params = await ssm.values();
    expect(params).to.be.an("array");
    const keys = params.map(p => p.Name);
    expect(keys).to.include(PATH1);
    expect(keys).to.include(PATH2);
    expect(keys).to.include(PATH3);
    const path1 = params.filter(p => p.Name === PATH1)[0];
    expect(path1).to.haveOwnProperty("ARN");
    expect(path1).to.haveOwnProperty("LastModifiedDate");
    expect(path1).to.haveOwnProperty("Version");
    expect(path1.Value).to.equal(VALUE1); // because it should be encrypted
    expect(path1.encrypted).to.equal(false);
  });
});
