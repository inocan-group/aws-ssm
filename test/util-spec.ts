// tslint:disable:no-implicit-dependencies
import { getAwsCredentials } from "../src/getAwsCredentials";
import {
  coerceValueToString,
  convertDictionaryToArray,
  addModuleName,
  getSpecificVersion
} from "../src/utils";
import { firstKey, firstRecord } from "./testing/helpers";
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

const data = {
  FOO: {
    Name: "/test/firebase/FOO",
    Value: "abc",
    encrypted: false
  },
  BAR: {
    Name: "/test/firebase/BAR",
    Value: "cdf",
    encrypted: false
  }
};
describe("convertDictionaryToArray", () => {
  it("dictionary of parameters converted to array", async () => {
    const result = convertDictionaryToArray(data);
    expect(result).to.be.an("array");
    expect(result).to.have.length(2);
    expect(result[0]).to.haveOwnProperty("variable");
    expect(result[0]).to.haveOwnProperty("Name");
    expect(result[0]).to.haveOwnProperty("Value");
  });
});

describe("addModuleName", () => {
  it("adding module name puts module property into each definition for each property", async () => {
    const result = addModuleName("firebase", data, true);

    expect(Object.keys(result)).to.have.length(2);
    expect(firstRecord(result))
      .to.have.property("module")
      .and.equal("firebase")
      .and.be.a("string");
  });
});

describe("getSpecificVersion", () => {
  const testData = {
    1: data,
    2: { ...data, FOO: { ...data.FOO, Value: "version 2" } }
  };

  it("returns correctly when given valid version", async () => {
    let result = getSpecificVersion(testData, 1);
    expect(result)
      .to.be.an("object")
      .and.have.property("FOO");
  });
});
