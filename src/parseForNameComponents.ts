import { ISsmPathParts, DEFAULT_VERSION } from "./types";
import { notReady } from "./notReady";
import { checkVersionNumber } from "./checkVersionNumber";
import { SsmError } from "./SsmError";

/**
 * Given an `inputPath`, this function attempts to flesh the
 * path out to a fully qualified path (as per the convention
 * laid out in this library).
 *
 * If the appropriate "parts" to
 * the path can not be surmised then an error will be thrown
 * unless the `ignoreNonStandardPaths` flag is set to **true**.
 */
export function parseForNameComponents(
  inputPath: string,
  ignoreNonStandardPaths: boolean = false
) {
  let stage = process.env.AWS_STAGE || process.env.NODE_ENV;
  if (inputPath.indexOf("/") === -1) {
    // simple name, no components
    if (!stage && !ignoreNonStandardPaths) {
      notReady(inputPath);
    }
    return {
      stage,
      version: DEFAULT_VERSION,
      name: inputPath
    } as ISsmPathParts;
  }

  // there are "parts" defined; let's identify them
  const parts = inputPath.replace(/^\//, "").split("/");
  const numOfParts = parts.length;
  if (numOfParts === 2) {
    // assumed to be app/name format
    if (!stage && !ignoreNonStandardPaths) {
      notReady(inputPath);
    }
    return {
      stage,
      version: DEFAULT_VERSION,
      module: parts[0],
      name: parts[1]
    };
  } else if (numOfParts === 3) {
    checkVersionNumber(parts);
    return {
      stage: parts[0],
      version: Number(parts[1]),
      name: parts[2]
    };
  } else if (numOfParts === 4) {
    checkVersionNumber(parts);
    return {
      stage: parts[0],
      version: Number(parts[1]),
      module: parts[2],
      name: parts[3]
    };
  } else {
    throw new SsmError(
      `aws-ssm/invalid-format`,
      `The "name" in an SSM parameter can be a simple string (aka, FOO) or a shorthand notation (aka, firebase/FOO) or a fully qualified notation (aka., test/1/firebase/FOO) but the passed in name -- ${inputPath} -- was not recognized as any of these formats.`
    );
  }
}
