import { SSM as AwsSSM } from "aws-sdk";
import { CredentialsOptions } from "aws-sdk/lib/credentials";
import { getAwsCredentials } from "./getAwsCredentials";
import { ClientConfiguration } from "aws-sdk/clients/batch";
import {
  ISsmRemoveOptions,
  ISsmListOptions,
  ISsmGetOptions,
  ISsmSetOptions,
  SsmValue,
  ISsmConfig,
  SsmValueType,
  ISsmGetResult,
  ISsmParameter,
  ISsmPathParts,
  ISsmModuleOptions,
  ISsmExportsOutput
} from "./types";
import { IDictionary, createError } from "common-types";
import {
  coerceValueToString,
  findPriorDescription,
  getLatestVersion,
  addModuleName,
  getSpecificVersion
} from "./utils";
import { SsmError } from "./SsmError";

export type GetParametersByPathRequest = import("aws-sdk").SSM.GetParametersByPathRequest;

const DEFAULT_VERSION = 1;

export * from "./types";

export class SSM {
  private _credentials?: CredentialsOptions;
  private _ssm: AwsSSM;
  private _cli: boolean = false;
  private _region: string;
  private _defaultType: SsmValueType;

  constructor(config: ISsmConfig = {}) {
    if (config.profile && typeof config.profile === "string") {
      const credentials = config.credentialsDirectory
        ? getAwsCredentials(config.profile, config.credentialsDirectory)
        : getAwsCredentials(config.profile);

      config.region = config.region ? config.region : credentials.region;

      delete credentials.region;
      this._credentials = credentials;
    } else if (config.profile) {
      this._credentials = config.profile as CredentialsOptions;
    }
    this._cli = config.cli ? config.cli : false;
    this._region = config.region;
    this._defaultType = config.defaultType || "SecureString";
    const awsSsmConfig: ClientConfiguration = {
      apiVersion: "2014-11-06",
      region: this._region
    };
    if (this._credentials) {
      awsSsmConfig.credentials = this._credentials;
    }
    this._ssm = new AwsSSM(awsSsmConfig);
  }

  /**
   * Instantiates SSM using the default configuration and calls the `module` instance method.
   */
  public static async modules(
    mods: string | string[],
    options: ISsmModuleOptions & { config?: ISsmConfig } = {}
  ): Promise<ISsmExportsOutput> {
    return options.config
      ? new SSM(options.config).modules(mods, options)
      : new SSM().modules(mods, options);
  }

  public get configuration() {
    return {
      credentials: this._credentials,
      cli: this._cli,
      region: this._region,
      defaultType: this._defaultType
    };
  }

  public async get(
    Name: string,
    options: ISsmGetOptions = {}
  ): Promise<ISsmGetResult> {
    const request: AwsSSM.GetParameterRequest = {
      Name: buildPathFromNameComponents(parseForNameComponents(Name))
    };

    if (options.decrypt) {
      request.WithDecryption = true;
    }

    const data = await this._ssm.getParameter(request).promise();

    const result: ISsmGetResult = {
      path: data.Parameter.Name,
      type: data.Parameter.Type as SsmValueType,
      arn: data.Parameter.ARN,
      version: data.Parameter.Version,
      value: data.Parameter.Value,
      encrypted:
        !options.decrypt && data.Parameter.Type === "SecureString"
          ? true
          : false,
      lastUpdated: data.Parameter.LastModifiedDate
    };

    return result;
  }

  public async convertToEnv(Name: string, options: ISsmGetOptions = {}) {
    const result = await this.get(Name, options);
    if (result.encrypted) {
      const e = new Error(
        `Can not convert to ENV an encrypted value at "${Name}"; always use { decrypt: true } config.`
      );
      e.name = "NotAllowed";
      throw e;
    }

    const varName = `${result.parts.module.toUpperCase()}_${result.parts.name.toUpperCase()}`;
    process.env[varName] = String(result.value);
  }

  /**
   * put
   *
   * Puts a value into SSM and then returns the version number
   * on success.
   *
   * @param Name The name/path of the variable
   * @param Value The value to set to
   * @param options Any additional options needed
   */
  public async put(
    Name: string,
    Value: SsmValue,
    options: ISsmSetOptions = {}
  ): Promise<number> {
    const parts = parseForNameComponents(Name);
    Value = coerceValueToString(Value);
    const Description = options.description
      ? options.description
      : Boolean(options.override)
      ? await findPriorDescription(Name)
      : "";
    const request: AwsSSM.PutParameterRequest = {
      Name,
      Value,
      Description,
      Overwrite: options.override || false,
      Type:
        options.encrypt !== undefined
          ? options.encrypt
            ? "SecureString"
            : "String"
          : this._defaultType
    };
    if (options.encryptionKey) {
      request.KeyId = options.encryptionKey;
    }

    const result = await this._ssm.putParameter(request).promise();
    return result.Version;
  }

  /**
   * list
   *
   * Lists the SSM Parameters available. If you wish to have a scoped/subset of parameters
   * you should use optional "options" parameter. When you pass in a "string" this is
   * the same as setting the "path" option but does remove your ability to set other options.
   *
   * @param pathOrOptions the hierarchical path position to start the recursive
   * search for parameters, OR a configuration object
   */
  public async list(
    pathOrOptions: string | ISsmListOptions = { path: "/" }
  ): Promise<ISsmParameter[]> {
    const o: ISsmListOptions =
      typeof pathOrOptions === "string"
        ? { path: pathOrOptions }
        : pathOrOptions;

    const request: GetParametersByPathRequest = {
      Path: o.path || "/",
      Recursive: true
    };

    if (o.decrypt) {
      request.WithDecryption = true;
    }

    const data = await this._ssm.getParametersByPath(request).promise();
    const parameters: ISsmParameter[] = data.Parameters.map(i => ({
      ...i,
      encrypted: o.decrypt ? false : true
    }));

    return parameters;
  }

  /**
   * Produces a list of SSM parameters; this is very similar to the `list()` method
   * but the data that is returned includes the last person/user to touch the value
   * and _does not_ include the value of the secret.
   */
  public async describeParameters(
    options: { MaxResults?: number; NextToken?: string } = { MaxResults: 50 }
  ) {
    const describeParameters = this._ssm.describeParameters(options).promise();
    let results = await describeParameters;
    if (results.NextToken) {
      options.NextToken = results.NextToken;
      const r2 = await this._ssm.describeParameters(options).promise();
      results.Parameters = results.Parameters.concat(r2.Parameters);
    }
    return results.Parameters;
  }

  /**
   * values
   *
   * An "alias" to the list() function except that values are decrypted
   *
   * @param path the hierarchical path position to start the recursive
   * search for parameters
   */
  public async values(path: string = "/") {
    return this.list({ path, decrypt: true });
  }

  /**
   * modules
   *
   * returns the list of parameters in the current STAGE which are related to a given
   * module/app. You can optionally specify a specific version.
   *
   * @param mods an array of modules/apps to look for
   * @param options state the explicit app version to use or
   * @return returns a hash who's keys are the module name; each module will be a hash who's keys are the key's property name
   */
  public async modules(
    mods: string | string[],
    options: ISsmModuleOptions = {}
  ): Promise<ISsmExportsOutput> {
    mods = Array.isArray(mods) ? mods : [mods];
    if (!process.env.AWS_STAGE) {
      const err = new Error(
        `Can not use ssm.modules() without having set AWS_STAGE environment variable first!`
      );
      err.name = "NotAllowed";
      throw err;
    }

    const params = await this.values("/" + process.env.AWS_STAGE);

    const intermediate: IDictionary = {};
    params.forEach(p => {
      const parts = parseForNameComponents(p.Name);
      const { version, module, name } = parts;

      if (mods.indexOf(module) !== -1) {
        if (!intermediate[module]) {
          intermediate[module] = {};
        }
        if (!intermediate[module][version]) {
          intermediate[module][version] = {};
        }

        intermediate[module][version][name] = p;
      }
    });

    return mods.reduce((prev: IDictionary, mod: string) => {
      return {
        ...prev,
        ...{
          [mod]: options.version
            ? addModuleName(
                mod,
                getSpecificVersion(
                  intermediate[mod],
                  options.version,
                  options.verbose
                ),
                options.verbose
              )
            : addModuleName(
                mod,
                getLatestVersion(intermediate[mod], options.verbose),
                options.verbose
              )
        }
      };
    }, {});
  }

  public async delete(Name: string, options: ISsmRemoveOptions = {}) {
    const request: AwsSSM.DeleteParameterRequest = {
      Name: buildPathFromNameComponents(parseForNameComponents(Name))
    };

    try {
      await this._ssm.deleteParameter(request).promise();
    } catch (e) {
      if (e.name === "ParameterNotFound") {
        const err = new Error(`The parameter "${Name}" could not be found!`);
        err.name = "ParameterNotFound";
        err.stack = e.stack;
        throw err;
      } else {
        throw e;
      }
    }
  }
}

export function parseForNameComponents(name: string) {
  let stage = process.env.AWS_STAGE || process.env.NODE_ENV;
  if (name.indexOf("/") === -1) {
    // simple name, no components
    if (!stage) {
      notReady(name);
    }
    return {
      stage,
      version: DEFAULT_VERSION,
      name
    } as ISsmPathParts;
  }

  // there are "parts" defined; let's identify them
  const parts = name.replace(/^\//, "").split("/");
  const numOfParts = parts.length;
  if (numOfParts === 2) {
    // assumed to be app/name format
    if (!stage) {
      notReady(name);
    }
    return {
      stage,
      version: DEFAULT_VERSION,
      module: parts[0],
      name: parts[1]
    };
  } else if (numOfParts === 3) {
    checkVersionNumber(parts);
    return {
      stage: parts[0],
      version: Number(parts[1]),
      name: parts[2]
    };
  } else if (numOfParts === 4) {
    checkVersionNumber(parts);
    return {
      stage: parts[0],
      version: Number(parts[1]),
      module: parts[2],
      name: parts[3]
    };
  } else {
    throw createError(
      `aws-ssm/invalid-format`,
      `The "name" in an SSM parameter can be a simple string (aka, FOO) or a shorthand notation (aka, firebase/FOO) or a fully qualified notation (aka., test/1/firebase/FOO) but the passed in name -- ${name} -- was not recognized as any of these formats.`
    );
  }
}

export function buildPathFromNameComponents(parts: ISsmPathParts) {
  const base = `${parts.stage}/${String(parts.version)}`;
  const remaining = parts.module
    ? `/${parts.module}/${parts.name}`
    : `/${parts.name}`;

  return "/" + base + remaining;
}

function checkVersionNumber(parts: string[]) {
  if (Number.isNaN(Number(parts[1]))) {
    throw createError(
      `aws-ssm/invalid-format`,
      `You appear to be using a fully-qualified naming convension with the name "${parts.join(
        "/"
      )}" but the version specified [ ${parts[1]} ] is not a valid number!`
    );
  }
}

function notReady(name: string) {
  throw new SsmError(
    "aws-ssm/not-ready",
    `You must set an environment stage before using the SSM api. To do this set either AWS_STAGE or NODE_ENV. Failed to meet this requirement when setting "${name}".`
  );
}
