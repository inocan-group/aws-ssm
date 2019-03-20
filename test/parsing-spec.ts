import SSM, { parseForNameComponents, buildPathFromNameComponents } from "../src";
import * as chai from "chai";
const expect = chai.expect;

describe("Parsing names: ", () => {
  it("non-structured names work when environment set", async () => {
    process.env.AWS_STAGE = "test";
    const result = parseForNameComponents("foo");

    expect(result).to.be.an("object");
    expect(result.name).to.equal("foo");
    expect(result.stage).to.equal("test");
    expect(result.version).to.equal(1);
  });

  it("non-structured names fail when no environment set", async () => {
    process.env.AWS_STAGE = "";
    process.env.NODE_ENV = "";
    try {
      const result = parseForNameComponents("foo");
      throw Error(
        `A non-structured name without stage set should fail: ${JSON.stringify(
          result,
          null,
          2
        )}`
      );
    } catch (e) {
      expect(e.code).to.equal("aws-ssm/not-ready");
    }
  });

  it("app/name pairings work when environment set", async () => {
    process.env.AWS_STAGE = "test";
    const result = parseForNameComponents("firebase/FOO");

    expect(result).to.be.an("object");
    expect(result.name).to.equal("FOO");
    expect(result.module).to.equal("firebase");
    expect(result.stage).to.equal("test");
    expect(result.version).to.equal(1);
  });

  it("app/name pairings fail when environment not set", async () => {
    process.env.AWS_STAGE = "";
    process.env.NODE_ENV = "";
    try {
      const result = parseForNameComponents("firebase/FOO");
      throw Error(
        `A non-structured name without stage set should fail: ${JSON.stringify(
          result,
          null,
          2
        )}`
      );
    } catch (e) {
      expect(e.code).to.equal("aws-ssm/not-ready");
    }
  });

  it("fully qualified names work regardless of environment being set", async () => {
    process.env.AWS_STAGE = "test";
    const result = parseForNameComponents("test/1/firebase/FOO");

    expect(result).to.be.an("object");
    expect(result.name).to.equal("FOO");
    expect(result.module).to.equal("firebase");
    expect(result.stage).to.equal("test");
    expect(result.version).to.equal(1);

    const result2 = parseForNameComponents("/test/1/firebase/FOO");
    expect(result2).to.be.an("object");
    expect(result2.name).to.equal("FOO");
    expect(result2.module).to.equal("firebase");
    expect(result2.stage).to.equal("test");
    expect(result2.version).to.equal(1);

    const result3 = parseForNameComponents("/test/1/FOOBAR");
    expect(result3).to.be.an("object");
    expect(result3.name).to.equal("FOOBAR");
    expect(result3.stage).to.equal("test");
    expect(result3.version).to.equal(1);
  });

  it("badly formatted name throws error", async () => {
    try {
      const result = parseForNameComponents("test/1/2/3/4/5");
      throw new Error("An invalid format should result in an error!");
    } catch (e) {}

    try {
      const result = parseForNameComponents("test/not-number/firebase/FOO");
      throw new Error("An invalid format should result in an error!");
    } catch (e) {
      expect(e.code).to.equal("aws-ssm/invalid-format");
      expect(e.message).to.include("is not a valid number");
    }
  });

  it("buildPathFromNameComponent reverses parsing", async () => {
    const t1 = "test/1/firebase/KEY";
    const t2 = "test/1/KEY";
    const t3 = "/test/1/KEY";

    expect(buildPathFromNameComponents(parseForNameComponents(t1))).to.equal("/" + t1);
    expect(buildPathFromNameComponents(parseForNameComponents(t2))).to.equal("/" + t2);
    expect(buildPathFromNameComponents(parseForNameComponents(t3))).to.equal(t3);
  });
});
