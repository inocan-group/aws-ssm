import { SsmValue, SsmValueType } from "./types";

export function coerceValueToString(value: SsmValue): string {
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    return `NUMBER(${value})`;
  }

  if (typeof value === "boolean") {
    return value === true ? "__TRUE__" : "__FALSE__";
  }

  return value;
}

export function findPriorDescription(Name: string) {
  return "";
}
