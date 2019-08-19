import { CredentialsOptions } from "aws-sdk/lib/credentials";
import { datetime, Omit } from "common-types";

export const DEFAULT_VERSION = 1;

export type SsmValue = string | string[] | number | boolean | object;
/**
 * the allowed types in SSM, note that "StringList" is available but since
 * this library serializes using JSON we just use String and SecureString
 */
export type SsmValueType = "String" | "SecureString";

export interface ISsmConfig {
  region?: string;
  /**
   * either a string name available in users credentials file or an
   * Amazon Credentials hash
   */
  profile?: string | CredentialsOptions;
  /**
   * typically only used for testing; allows you to point to a directory
   * other than the user's root for the credentials file
   */
  credentialsDirectory?: string;
  cli?: boolean;
  /**
   * The default type you want to set your parameters as; if not specified it will
   * default to SecureString
   */
  defaultType?: SsmValueType;
}

export type ISsmExportsOutput<T = string> = IExportsOutputVerbose<T> &
  IExportsOutputRegular<T>;

export interface IExportsOutputVerbose<T> {
  [module: string]: {
    [variable: string]: ISsmParameter<T>;
  };
}

export interface IExportsOutputRegular<T> {
  [module: string]: {
    [variable: string]: T;
  };
}

export interface ISsmModuleOptions {
  /**
   * by default modules the latest version for the given module
   * name; but with this option you can freeze versions
   * to a specific version
   */
  version?: number;
  /**
   * by default the leaf nodes in the hash will contain just
   * the decrypted value (where the key is the NAME). If you
   * want all the meta properties along with the value you
   * can set verbose to TRUE.
   */
  verbose?: boolean;
}

export interface ISsmPathParts {
  /** the AWS_STAGE this variable is intended for */
  stage: string;
  /** the version number of the variable; by default set to 1 */
  version: number;
  /** the application/module/context in which the variable name is set under */
  module?: string;
  /** the name of the variable (e.g., SECRET_KEY, SERVICE_ACCT, etc.) */
  name: string;
}

export interface ISsmGetResult<T = ISsmPathParts> {
  path: string;
  parts?: T;
  type: SsmValueType;
  arn: string;
  version: number;
  value: SsmValue;
  encrypted: boolean;
  lastUpdated: Date;
}

export interface ISsmOptions {
  /**
   * `aws-ssm` encourage a standard naming convention for
   * SSM path names which looks like this:
   *
   * ```sh
   * / [ `stage` ] / [ `version` ] / [ `system` ] / [ `NAME` ]
   * ```
   *
   * In some instances, however, you may need to deviate from
   * this and in those instances you should set this flag to `true`
   * so that no attempts are made to use environment variables to
   * fit the naming to the convention.
   */
  nonStandardPath?: boolean;
}

/**
 * options for when you are GET'ing a secret from SSM
 */
export interface ISsmGetOptions extends ISsmOptions {
  cli?: boolean;
  decrypt?: boolean;
}

export interface ISsmPutOptions extends ISsmOptions {
  /**
   * optionally provide a description of this variable, if none
   * is provided but the prior version of this variable had a
   * description it will be brough forward; if you want to block
   * this behavior you can pass the boolean value of false to remove
   * the description
   */
  description?: string | false;
  /**
   * By default you can not override a variable once it's set
   * but if you set this to TRUE then you will create a new version
   * of the value
   */
  override?: boolean;
  /** return output to stdout rather than as a structured object */
  cli?: boolean;
  /** should the variable be stored with encryption (aka., as a "SecureString") */
  encrypt?: boolean;
  /**
   * you _can_ explicitly state a key to use in encryption; leaving this
   * undefined will use the default AWS CMK key.
   *
   * > More: https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#data-keys
   */
  encryptionKey?: string;
}

export interface ISsmListOptions extends ISsmOptions {
  /** restrict list to only those parameters at a particular path */
  path?: string;
  /** restrict list to only those parameters which have the given text in them */
  contains?: string;
  /** whether the values return should be decrypted; default is false */
  decrypt?: boolean;
}

export interface ISsmRemoveOptions {}

export interface IValueOptions extends ISsmOptions {
  /** whether the values return should be decrypted; default is true */
  decrypt?: boolean;
}

export type SsmParameter = AWS.SSM.Parameter;
export interface ISsmParameter<T = string> extends Omit<SsmParameter, "Value"> {
  Value?: T;
  encrypted: boolean;
  module?: string;
  variable?: string;
}

export interface IAwsSsmVariable {
  Name: string;
  Type: SsmValueType;
  Value: string;
  Version: number;
  LastModifiedDate: datetime;
  ARN: string;
  encrypted: boolean;
  module: string;
}
// TODO: not used currently
export interface ISsmModule {
  name: string;
  type: SsmValueType;
  value: string;
  version: number;
  lastModifiedDate: datetime;
  arn: string;
  encrypted: boolean;
  module: string;
}
