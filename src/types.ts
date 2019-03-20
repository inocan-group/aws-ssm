import { CredentialsOptions } from "aws-sdk/lib/credentials";
import { datetime, Omit } from "common-types";

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

export interface ISsmGetOptions {
  cli?: boolean;
  decrypt?: boolean;
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

export interface ISsmSetOptions {
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
  /** you can state the key to use; without the key it will use the  */
  encryptionKey?: string;
}

export interface ISsmListOptions {
  /** restrict list to only those parameters at a particular path */
  path?: string;
  /** restrict list to only those parameters which have the given text in them */
  contains?: string;
  /** whether the values return should be decrypted; default is false */
  decrypt?: boolean;
}

export interface ISsmRemoveOptions {}

export interface IValueOptions {
  /** whether the values return should be decrypted; default is true */
  decrypt?: boolean;
}

export interface ISsmParameter<T = string> extends Omit<AWS.SSM.Parameter, "Value"> {
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
