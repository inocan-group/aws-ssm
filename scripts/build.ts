// tslint:disable:no-implicit-dependencies
import chalk from "chalk";
import { exec, rm } from "shelljs";
import "../test/testing/test-console";
import { stdout, stderr } from "test-console";
import { transpileJavascript, clearTranspiledJS } from "./lib/js";
import { asyncExec } from "async-shelljs";
import rimraf = require("rimraf");

function prepOutput(output: string) {
  return output
    .replace(/\t\r\n/, "")
    .replace("undefined", "")
    .trim();
}

async function getScope(): Promise<string> {
  let scope: string;

  return new Promise<string>(resolve => {
    const inspect = stdout.inspect();
    exec(`npm get files`, (code, output) => {
      inspect.restore();
      const result = prepOutput(output);

      if (!result) {
        console.log(
          chalk.grey(
            'no files specified with "--files=*" option so all files under src directory will be built\n'
          )
        );
        scope = "";
      } else {
        scope = result;
      }

      resolve(scope);
    });
  });
}

(async () => {
  // const scope: string = await getScope();
  // await clearTranspiledJS();
  // await transpileJavascript({ scope });
  // await transpileJavascript({ scope, configFile: "tsconfig-esm.json" });
  console.log("- clearing dist folder");
  rm("-rf", "./dist");
  console.log(`- using ${chalk.bold.yellow("bili")} to transpile to CJS and ES formats`);
  try {
    await asyncExec("bili src/index.ts --format cjs,es");
    console.log(chalk.green.bold("- build is complete 🚀\n"));
  } catch (e) {
    console.log(chalk.red.bold("- problems in build: ") + chalk.grey(e.message));
  }
})();
