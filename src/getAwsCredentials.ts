import { CredentialsOptions } from "aws-sdk/lib/credentials";
import * as fs from "fs";
import * as path from "path";

function after(position: number, things: any[], onUndefined?: () => void) {
  if (things && things.length > 0) {
    return things.slice(position);
  } else {
    if (onUndefined) {
      onUndefined();
    } else {
      const e = new Error("first() was passed an empty array!");
      e.name = "EmptyArray";
      throw e;
    }
  }
}

/**
 * Uses a users "credentials" file to lookup region, access_key, access_secret
 *
 * @param profile the text name which serves as a lookup to the users ~/.aws/credentials file
 */
export function getAwsCredentials(profile: string, directory?: string) {
  const homedir = directory
    ? path.join(__dirname, directory)
    : path.join(require("os").homedir(), ".aws");
  const credentials = after(
    1,
    fs
      .readFileSync(`${homedir}/credentials`, { encoding: "utf-8" })
      .split("[")
      .map(i => i.split("\n"))
      .filter(i => i[0].slice(0, i[0].length - 1) === profile)
      .pop()
  );

  const credentialsObj: CredentialsOptions & { region?: string } = {
    accessKeyId: "",
    secretAccessKey: ""
  };
  credentials.map(i => {
    if (i.includes("aws_access_key_id")) {
      credentialsObj.accessKeyId = i.replace(/.*aws_access_key_id\s*=\s*/, "");
    }
    if (i.includes("aws_secret_access_key")) {
      credentialsObj.secretAccessKey = i.replace(
        /.*aws_secret_access_key\s*=\s*/,
        ""
      );
    }
    if (i.includes("region")) {
      credentialsObj.region = i.replace(/.*region\s*=\s*/, "");
    }
  });

  return credentialsObj;
}
