// tslint:disable:no-implicit-dependencies
import { getAwsCredentials } from "../src/getAwsCredentials";
import { coerceValueToString } from "../src/utils";
import * as chai from "chai";
const expect = chai.expect;

describe("getAwsCredentials →", () => {
  it("Sending in string for profile, resolves to correct config", () => {
    const response = getAwsCredentials("test", "../test/data");
    expect(response.accessKeyId).to.equal("AKIBBBBB");
    expect(response.secretAccessKey).to.equal("abcdefg");

    const response2 = getAwsCredentials("test2", "../test/data");
    expect(response2.accessKeyId).to.equal("AKICCCCC");
    expect(response2.secretAccessKey).to.equal("a1b2c3");
    expect(response2.region).to.equal("eu-west-1");
  });
});

describe("coerceValueToString() →", () => {
  it("string comes back string", () => {
    const response = coerceValueToString("foobar");
    expect(response).to.equal("foobar");
  });

  it("number comes back string within Number()", () => {
    const response = coerceValueToString(5);
    expect(response).to.equal("NUMBER(5)");
  });

  it("object comes back as stringified string", () => {
    const response = coerceValueToString({ foo: 1, bar: 2 });
    expect(response).to.a("string");
    expect(JSON.parse(response).foo).to.equal(1);
  });

  it("boolean is converted to string stamp", () => {
    const response = coerceValueToString(true);
    expect(response).to.equal("__TRUE__");
    const response2 = coerceValueToString(false);
    expect(response2).to.equal("__FALSE__");
  });
});
