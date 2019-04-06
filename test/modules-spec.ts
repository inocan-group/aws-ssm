import { SSM } from "../src";
import * as chai from "chai";
const expect = chai.expect;

describe("modules →", () => {
  const ssm = new SSM({ profile: "ssm" });
  const PATH1 = "/test/2/firebase/KEY";
  const PATH2 = "/test/2/firebase/SECRET";
  const PATH3 = "/stage/1/firebase";
  const PATH4 = "/stage/1/mySql";
  const PATH5 = "/test/1/mySql";
  const VALUE1 = "this is a test";
  const VALUE2 = "this is a test too";
  const VALUE3 = "this is a test three";
  const VALUE4 = "this is mysql";
  const VALUE5 = "this is mysql too";

  beforeEach(async () => {
    try {
      await ssm.put(PATH1, VALUE1, { override: true });
      await ssm.put(PATH2, VALUE2, { override: true });
      await ssm.put(PATH3, VALUE3, { override: true });
    } catch (e) {
      throw new Error(`  - Problem putting parameter to setup tests: ${e.message}`);
      process.exit();
    }
  });

  afterEach(async () => {
    try {
      await ssm.delete(PATH1);
      await ssm.delete(PATH2);
      await ssm.delete(PATH3);
    } catch (e) {
      console.log(`  - Problem cleaning up parameters after test [modules]:`, e.message);
      process.exit();
    }

    try {
      await ssm.delete(PATH4);
      await ssm.delete(PATH5);
    } catch (e) {
      // ignore
    }
  });

  it("real modules bring back environment specific modules", async () => {
    await ssm.put(PATH4, VALUE4, { override: true });
    await ssm.put(PATH5, VALUE5, { override: true });
    process.env.AWS_STAGE = "test";
    process.env.AWS_VERSION = "1";
    const results = await ssm.modules(["firebase", "mySql"]);

    expect(results.firebase).to.be.an("object");
    const keys = Object.keys(results.firebase);
    expect(keys)
      .to.include("KEY")
      .and.include("SECRET");
    expect(results.firebase.KEY).to.equal("this is a test");
    expect(results.mySql).to.be.an("object");
  });

  it("invalid modules for given environment returns empty object", async () => {
    process.env.AWS_STAGE = "test";
    const results = await ssm.modules(["firebase", "nonExistant"]);
    expect(results).to.be.an("object");
    expect(results.firebase).to.be.an("object");
    const keys = Object.keys(results.firebase);
    expect(keys)
      .to.include("KEY")
      .and.include("SECRET");
    expect(results.nonExistant).to.be.an("object");
    expect(Object.keys(results.nonExistant)).to.have.lengthOf(0);
  });

  it("using verbose parameter returns all meta info", async () => {
    await ssm.put(PATH4, VALUE4, { override: true });
    await ssm.put(PATH5, VALUE5, { override: true });
    process.env.AWS_STAGE = "test";
    process.env.AWS_VERSION = "1";
    const results = await ssm.modules(["firebase", "mySql"], { verbose: true });
    expect(results).to.be.an("object");

    expect(results.firebase).to.be.an("object");
    const keys = Object.keys(results.firebase);
    expect(keys)
      .to.include("KEY")
      .and.include("SECRET");
    expect(results.firebase.KEY).to.be.an("object");
    expect(results.firebase.KEY.Value).to.equal("this is a test");
    expect(results.mySql).to.be.an("object");
  });
});
