import { SsmError } from "./SsmError";

export function checkVersionNumber(parts: string[]) {
  if (Number.isNaN(Number(parts[1]))) {
    throw new SsmError(
      `aws-ssm/invalid-format`,
      `You appear to be using a fully-qualified naming convension with the name "${parts.join(
        "/"
      )}" but the version specified [ ${parts[1]} ] is not a valid number!`
    );
  }
}
