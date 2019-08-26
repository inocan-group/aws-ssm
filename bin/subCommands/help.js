"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const chalk_1 = __importDefault(require("chalk"));
const ssm_1 = require("../ssm");
function help(optionList, fn) {
    const sections = [
        {
            header: "Description",
            content: `SSM is part AWS's ${chalk_1.default.italic("Parameter Store")} offering and this CLI tool provides a basic API surface to list, get, and put these parameter into an AWS account using the naming convention proscribed by the ${ssm_1.inverted(" aws-ssm ")} repo`
        }
    ];
    if (!fn) {
        sections.push({
            header: "Syntax",
            content: `ssm [command] <options>`
        });
        sections.push({
            header: "Commands",
            content: `valid commands are: ${chalk_1.default.grey.italic(ssm_1.commands.join(", "))}`
        });
    }
    else {
        sections.push({
            header: "Syntax",
            content: `ssm ${fn} <options>`
        });
    }
    sections.push({
        header: "Options",
        optionList
    });
    console.log(command_line_usage_1.default(sections));
    process.exit();
}
exports.default = help;
