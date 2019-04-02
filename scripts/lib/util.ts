import { IDictionary, IServerlessConfig } from "common-types";
import chalk from "chalk";

export const parseArgv = (...possibleFlags: string[]) => (
  ...possibleParams: string[]
) => {
  const commandLine = process.argv.slice(2);
  const allOptions = [...possibleFlags, ...possibleParams];
  const unknownKeys = commandLine
    .filter(i => i.slice(0, 1) === "-")
    .filter(key => !allOptions.includes(key));
  if (unknownKeys.length > 0) {
    console.log(
      chalk.red("Unknown options used. ") + `The following key(s): `,
      chalk.yellow(unknownKeys.join(", ")) + " are not recognized and will be ignored."
    );
  }
  const optionKeyIndexes = commandLine
    .map((item, idx) => (item.slice(0, 1) === "-" ? idx : ""))
    .filter(i => i !== "");

  const params = commandLine.filter(
    (item, idx) =>
      !optionKeyIndexes.includes(idx) && !possibleParams.includes(commandLine[idx - 1])
  );

  const options = optionKeyIndexes.reduce(
    (acc, idx: number) => {
      acc[commandLine[idx].replace(/-/g, "")] = possibleParams.includes(commandLine[idx])
        ? commandLine[idx + 1]
        : true;
      return acc;
    },
    {} as any
  );
  return { params, options };
};

import yaml from "js-yaml";
import { readFileSync } from "fs";

/**
 * gets the serverless configuration from the `serverless.yml` file
 * in the root of the repository.
 */
export function getServerlessConfig() {
  let config: IServerlessConfig;
  try {
    config = yaml.safeLoad(
      readFileSync(`${process.env.PWD}/serverless.yml`, { encoding: "utf-8" })
    );
  } catch (e) {
    console.log(
      `${chalk.red("There was a problem reading serverless.yml: ")}${e.message}`
    );
    console.log("- using empty config object");
    config = {
      provider: {}
    } as any;
  }

  return config;
}
