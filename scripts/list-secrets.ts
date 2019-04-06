import chalk from "chalk";
import { parseArgv, getServerlessConfig } from "./lib/util";
import { IServerlessConfig, IDictionary, IServerlessProvider } from "common-types";
import { writeFileSync } from "fs";
import { buildServerlessConfig } from "./lib/serverless";
import { SSM } from "..";
import { DateTime } from "luxon";
import { table, TableUserConfig } from "table";
import { getAwsCredentials } from "../src/getAwsCredentials";

const { params, options } = parseArgv("--values")("--region", "--profile", "--json");
(async () => {
  try {
    await buildServerlessConfig({ quiet: true });
    const config: IServerlessConfig = getServerlessConfig();
    console.log(`- Serverless configuration rebuilt`, process.cwd());

    const profileName =
      options.profile || config.provider.profile || process.env.AWS_PROFILE;
    const profile = getAwsCredentials(profileName);
    const region = options.region || config.provider.region || "us-east-1";

    console.log(
      `- Using the AWS ${chalk.bold.green(profileName)} profile in the ${chalk.bold.green(
        region
      )} region to ${chalk.bold("list")} all parameters in ssm ${
        params[0]
          ? 'which starts with "' + chalk.bold.green(params[0]) + '" in the name'
          : "."
      }.`
    );
    const ssm = new SSM({ profile, region: region || profile.region });
    const result = await ssm.values(params[0]);
    const headers = options.values
      ? ["path/name", "version", "updated", "value"]
      : ["path/name", "version", "type", "last updated"];
    const data = [headers];
    result.map(r => {
      const date = DateTime.fromJSDate(r.LastModifiedDate).toFormat("dd LLL yyyy");
      const time = DateTime.fromJSDate(r.LastModifiedDate).toFormat("h:mm a  ZZZZ");
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
        options.values
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
    console.log(table(data, tblConfig));
    const inverted = chalk.black.bgHex("A9A9A9");
    if (!options.values) {
      console.log(
        `- if you need values displayed you can use the ${inverted(
          " --values "
        )} parameter`
      );
    }
    if (!options.json) {
      console.log(
        `- if you want to export data to a JSON file you can use the ${inverted(
          " --json " + chalk.italic("[filename] ")
        )} parameter`
      );
    } else {
      if (!options.json) {
        console.log(chalk.red.bold("- JSON option specified without filename!"));
        console.log(
          `- always use the JSON configuration option as ${inverted(
            " --json " + chalk.italic("[filename] ")
          )}\n`
        );
        process.exit();
      }
      const filename = "./" + options.json;
      await writeFileSync(filename, convertToJson(data), { encoding: "utf-8" });
      console.log(`- JSON results written to "${filename}".`);
    }
    console.log();
  } catch (e) {
    console.error(e.message);
    process.exit();
  }
})();

function convertToJson(data: string[][]) {
  const headers = data[0];
  const results = data.slice(1);
  const output: IDictionary[] = [];
  results.map(row => {
    const rowData: IDictionary = {};
    row.map((col, idx) => {
      rowData[headers[idx]] = col;
    });

    output.push(rowData);
  });
  return JSON.stringify(output, null, 2);
}
