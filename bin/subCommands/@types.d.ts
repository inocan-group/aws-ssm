import commandLineArgs from "command-line-args";
export interface IOptionDefinition extends commandLineArgs.OptionDefinition {
    description?: string;
    typeLabel?: string;
}
export interface IAwsProfile {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
    region?: string;
}
