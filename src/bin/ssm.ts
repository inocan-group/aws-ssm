import commandLineArgs, { OptionDefinition } from "command-line-args";
import chalk from "chalk";
import help from "./subCommands/help";
import { IOptionDefinition } from "./subCommands/@types";
export const inverted = chalk.black.bgHex("A9A9A9");
export const commands = ["get", "put", "list"];

export const globalOptionDefinition: IOptionDefinition[] = [
  {
    name: "profile",
    alias: "p",
    type: String,
    group: "global",
    description: "explicitly state the AWS profile to use",
    typeLabel: "<name>"
  },
  {
    name: "region",
    alias: "r",
    type: String,
    group: "global",
    description:
      "explicitly state the AWS region (note: this overrides profile if set)",
    typeLabel: "<region>"
  },
  {
    name: "output",
    alias: "o",
    type: String,
    group: "global",
    description: "sends output to the filename specified",
    typeLabel: "<filename>"
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    group: "global",
    description: `shows help for the ${inverted(
      " ssm "
    )} command in general but also the specifics of a particular sub-command if stated`
  }
];
(async () => {
  const command: OptionDefinition[] = [
    { name: "command", defaultOption: true },
    ...globalOptionDefinition
  ];
  const mainCommand = commandLineArgs(command, { stopAtFirstUnknown: true });
  const cmd = (mainCommand._all || {}).command;
  let argv = mainCommand._unknown || [];
  const opts = mainCommand.global;

  console.log(
    chalk.bold.white.underline(
      `\nSSM ${chalk.italic.bold(cmd ? cmd + " " : "Help")}\n`
    )
  );

  if (!cmd) {
    help(globalOptionDefinition, cmd);
  }

  if (commands.includes(cmd)) {
    let subModule = require(`./subCommands/${cmd}`);
    await subModule.handler(argv, opts);
  } else {
    console.log(
      `${chalk.bold.red("SSM:")} "${cmd}" is an unknown command!\n\n` +
        `- Valid command syntax is: ${chalk.bold(
          "ssm [command] <options>"
        )}\n  where valid commands are: ${chalk.italic(
          commands.join(", ")
        )}\n` +
        `- If you want more help use the ${inverted(" --help ")} option\n`
    );
  }
})();
