"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_args_1 = __importDefault(require("command-line-args"));
const chalk_1 = __importDefault(require("chalk"));
const help_1 = __importDefault(require("./subCommands/help"));
exports.inverted = chalk_1.default.black.bgHex("A9A9A9");
exports.commands = ["get", "put", "list"];
exports.globalOptionDefinition = [
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
        description: "explicitly state the AWS region (note: this overrides profile if set)",
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
        description: `shows help for the ${exports.inverted(" ssm ")} command in general but also the specifics of a particular sub-command if stated`
    }
];
(async () => {
    const command = [
        { name: "command", defaultOption: true },
        ...exports.globalOptionDefinition
    ];
    const mainCommand = command_line_args_1.default(command, { stopAtFirstUnknown: true });
    const cmd = (mainCommand._all || {}).command;
    let argv = mainCommand._unknown || [];
    const opts = mainCommand.global;
    console.log(chalk_1.default.bold.white.underline(`\nSSM ${chalk_1.default.italic.bold(cmd ? cmd + " " : "Help")}\n`));
    if (!cmd) {
        help_1.default(exports.globalOptionDefinition, cmd);
    }
    if (exports.commands.includes(cmd)) {
        let subModule = require(`./subCommands/${cmd}`);
        await subModule.handler(argv, opts);
    }
    else {
        console.log(`${chalk_1.default.bold.red("SSM:")} "${cmd}" is an unknown command!\n\n` +
            `- Valid command syntax is: ${chalk_1.default.bold("ssm [command] <options>")}\n  where valid commands are: ${chalk_1.default.italic(exports.commands.join(", "))}\n` +
            `- If you want more help use the ${exports.inverted(" --help ")} option\n`);
    }
})();
