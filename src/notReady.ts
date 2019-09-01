import { SsmError } from "./SsmError";
import chalk from "chalk";
// import { inverted } from "./bin/ssm";

/**
 * Produces an error to indicate that the `stage` could not be determined for the
 * given path and associated ENV variables.
 */
export function notReady(name: string) {
  throw new SsmError(
    "aws-ssm/not-ready",
    `You must set an environment ${chalk.italic(
      "stage"
    )} before using the SSM api. To do this, set either AWS_STAGE or NODE_ENV.\n  Alternatively you can pass in ${chalk.bgWhite.black(
      "{ nonStandardPath: true }"
    )} to the options property of get(), set(), list(), or delete().`
  );
}
