import { SsmValue, SsmValueType, ISsmParameter } from "./types";
import { IDictionary } from "common-types";

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

export function getLatestVersion(
  modules: IDictionary<IDictionary<ISsmParameter>>,
  verbose: boolean = false
) {
  if (!modules) {
    return {};
  }
  const versions = Object.keys(modules).sort((a: string, b: string) => {
    return Number(a) - Number(b);
  });

  const moduleScope = modules[versions[0]];

  return verbose
    ? moduleScope
    : Object.keys(moduleScope).reduce(
        (prev, curr) => {
          const ssmVariable = moduleScope[curr];
          prev[curr] = ssmVariable.Value;

          return prev;
        },
        {} as IDictionary
      );
}

export function getSpecificVersion(
  modules: IDictionary<IDictionary<ISsmParameter>>,
  version: number,
  verbose: boolean = false
) {
  if (!modules) {
    return {};
  }
  const versions = Object.keys(modules).sort((a: string, b: string) => {
    return Number(a) - Number(b);
  });
  if (!modules[String(version)]) {
    const err = new Error(`Version ${version} not found`);
    err.name = "VersionNotFound";
    throw err;
  }
  const moduleScope = modules[versions[version]];

  return verbose
    ? moduleScope
    : Object.keys(moduleScope).reduce(
        (prev, curr) => {
          const ssmVariable = moduleScope[curr];
          prev[curr] = ssmVariable.Value;
          return prev;
        },
        {} as IDictionary
      );
}

export function convertDictionaryToArray(params: IDictionary<ISsmParameter>) {
  return Object.keys(params).reduce((prev, curr) => {
    return prev.concat({ ...params[curr], variable: curr });
  }, []);
}

export function addModuleName(
  module: string,
  params: IDictionary<ISsmParameter>,
  verbose: boolean = false
) {
  return Object.keys(params).reduce(
    (prev, key) => {
      prev[key] = verbose ? { ...params[key], module } : params[key];
      return prev;
    },
    {} as IDictionary
  );
}
