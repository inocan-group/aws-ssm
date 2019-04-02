import commandLineUsage from "command-line-usage";
import commandLineArgs from "command-line-args";
import chalk from "chalk";
import { commands, inverted } from "../ssm";
import { IDictionary } from "common-types";

export default function help(
  optionList: commandLineArgs.CommandLineOptions[],
  fn?: string
) {
  const sections: commandLineUsage.Section[] = [
    {
      header: "Description",
      content: `SSM is part AWS's ${chalk.italic(
        "Parameter Store"
      )} offering and this CLI tool provides a basic API surface to list, get, and put these parameter into an AWS account using the naming convention proscribed by the ${inverted(
        " aws-ssm "
      )} repo`
    }
  ];

  if (!fn) {
    sections.push({
      header: "Syntax",
      content: `ssm [command] <options>`
    });
    sections.push({
      header: "Commands",
      content: `valid commands are: ${chalk.grey.italic(commands.join(", "))}`
    });
  } else {
    sections.push({
      header: "Syntax",
      content: `ssm ${fn} <options>`
    });
  }

  sections.push({
    header: "Options",
    optionList
  });

  console.log(commandLineUsage(sections));
  process.exit();
}
