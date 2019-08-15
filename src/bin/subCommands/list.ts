import commandLineArgs = require("command-line-args");
import chalk from "chalk";
import { IAwsProfile } from "./@types";
import { globalOptionDefinition, inverted } from "../ssm";
import help from "./help";
import { buildServerlessConfig } from "./serverless";
import { getAwsCredentials } from "../../getAwsCredentials";
import { IDictionary } from "common-types";
import { SSM } from "../../index";
import { ISsmParameter, ISsmExportsOutput, ISsmGetOptions } from "../../types";
import { TableUserConfig } from "table";
import { DateTime } from "luxon";

export async function handler(argv: string[], opts: IDictionary) {
  const localOptions = [
    {
      name: "show-values",
      alias: "v",
      type: Boolean,
      group: "list",
      description: `show each item's ${chalk.bold(
        "value"
      )} along with the other properties`
    }
  ];
  const options = [...localOptions, ...globalOptionDefinition];
  // parse
  const commandDefition: commandLineArgs.OptionDefinition[] = [
    { name: "path", defaultOption: true, defaultValue: "" },
    ...options
  ];
  const list: IDictionary = {
    ...commandLineArgs(commandDefition, {
      argv,
      stopAtFirstUnknown: true
    })._all,
    ...opts
  };

  if (list.help) {
    help(options, "list");
  }

  // get config
  const [profile, profileName] = (await getProfile(list)) as [
    IAwsProfile,
    string
  ];
  const path = list.path.slice(0, 1) === "/" ? list.path : `/${list.path}`;
  if (list.region) {
    profile.region = list.region;
  }
  if (!profile.region) {
    profile.region = "us-east-1";
  }
  // execute
  console.log(
    `- Using the AWS ${chalk.bold.green(
      profileName
    )} profile in the ${chalk.bold.green(
      profile.region
    )} region to ${chalk.bold("list")} all parameters in ssm ${
      path
        ? 'which starts with "' + chalk.bold.green(path) + '" in the name'
        : "."
    }.`
  );
  const ssm = new SSM({ profile });
  try {
    const result = await ssm.values();
    displayResults(list, result);
    if (list.output) {
      // writeToOutput(list.output, result);
    }
  } catch (e) {
    throw e;
  }
}

async function getProfile(list: IDictionary) {
  if (!list.profile) {
    const isServerlessProject = await buildServerlessConfig({ quiet: true });
    if (isServerlessProject) {
      console.log(
        chalk.grey(
          `- this directory is a ${chalk.white(
            "generator-typescript-microservice"
          )} project; aws profile will be sourced from this project's config`
        )
      );
    } else {
      console.log(
        chalk.red.bold("Missing Profile: ") +
          `there was no use of the ${inverted(
            " --profile "
          )} parameter and since this\nisn't a ${chalk.white(
            "generator-typescript-microservice"
          )} project, the ${chalk.bold(
            "ssm"
          )} command requires\nexplicit information on which AWS profile to use!\n`
      );
    }
  } else {
    // explicit reference to PROFILE
    return [getAwsCredentials(list.profile), list.profile];
  }
}

function displayResults(list: IDictionary, results: ISsmParameter<string>[]) {
  const headers = list["show-values"]
    ? ["path/name", "version", "updated", "value"]
    : ["path/name", "version", "type", "last updated"];
  const data = [headers];
  console.log(results);

  results.map(r => {
    const date = DateTime.fromJSDate(r.LastModifiedDate).toFormat(
      "dd LLL yyyy"
    );
    const time = DateTime.fromJSDate(r.LastModifiedDate).toFormat(
      "h:mm a  ZZZZ"
    );
    const parts: string[] = r.Name.split("/").filter((i: string) => i);

    if (parts.length === 4) {
      r.Name = parts.slice(0, 2).join("/") + chalk.bold("/" + parts[3]);
    } else if (parts.length === 5) {
      r.Name =
        parts.slice(0, 2).join("/") +
        chalk.bold("/" + parts[3]) +
        chalk.yellow.bold("/" + parts[4]);
    } else {
      r.Name = chalk.grey(r.Name) + chalk.red("*");
    }
    data.push(
      list["show-values"]
        ? ([r.Name, r.Version, date, r.Value] as string[])
        : ([r.Name, r.Version, r.Type, `${date} @ ${time}`] as string[])
    );
  });
  const tblConfig: TableUserConfig = {
    columns: {
      0: {
        alignment: "left",
        width: 36
      },
      1: {
        alignment: "center",
        width: 8
      },
      2: {
        alignment: "center"
      },
      3: {
        alignment: "left",
        truncate: 100,
        width: 30
      }
    }
  };
  console.log();
}
