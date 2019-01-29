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
  ISsmGetResult
} from "./types";
import { coerceValueToString, findPriorDescription } from "./utils";

export default class SSM {
  private _credentials?: CredentialsOptions;
  private _ssm: AwsSSM;
  private _cli: boolean = false;
  private _region: string;
  private _defaultType: SsmValueType;

  constructor(config: ISsmConfig) {
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
    return new Promise(async (resolve, reject) => {
      const request: AwsSSM.GetParameterRequest = {
        Name
      };
      if (options.decrypt) {
        request.WithDecryption = true;
      }

      this._ssm.getParameter(request, (err, data) => {
        if (err) {
          reject(err);
        }

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

        resolve(result);
      });
    });
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

    const varName = `${result.parts.app.toUpperCase()}_${result.parts.name.toUpperCase()}`;
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
    return new Promise(async (resolve, reject) => {
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

      this._ssm.putParameter(request, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data.Version);
      });
    });
  }

  /** an alias for the PUT operation */
  public set = this.put.bind(this);

  public async list(options: ISsmListOptions): Promise<AWS.SSM.Parameter[]> {
    return new Promise((resolve, reject) => {
      if (options.path) {
        const request: AWS.SSM.GetParametersByPathRequest = {
          Path: options.path
        };
        if (options.decrypted) {
          request.WithDecryption = true;
        }
        this._ssm.getParametersByPath(request, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Parameters);
          }
        });
      } else {
        this._ssm.describeParameters((err, data) => {
          if (err) {
            reject(err);
          } else {
            if (options.contains) {
              resolve(
                data.Parameters.filter(p => p.Name.includes(options.contains))
              );
            }
            resolve(data.Parameters);
          }
        });
      }
    });
  }

  public async delete(Name: string, options: ISsmRemoveOptions = {}) {
    const request: AwsSSM.DeleteParameterRequest = {
      Name
    };

    return new Promise((resolve, reject) => {
      try {
        this._ssm.deleteParameter(request, (err, data) => {
          if (err) {
            if (err.name === "ParameterNotFound") {
              const e = new Error(
                `The parameter "${Name}" could not be found (and therefore could not be deleted)!`
              );
              e.name = "ParameterNotFound";
              e.stack = err.stack;
              reject(e);
              return;
            } else {
            }
            reject(err);
          }

          resolve(data);
        });
      } catch (e) {
        console.log("Error", Object.keys(e));

        if (e.name === "ParameterNotFound") {
          const err = new Error(`The parameter "${Name}" could not be found!`);
          err.name = "ParameterNotFound";
          err.stack = e.stack;
          throw err;
        } else {
          throw e;
        }
      }
    });
  }

  public label(name: string, label: string, version?: number) {
    // TODO
  }
}
