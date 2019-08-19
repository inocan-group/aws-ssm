# aws-ssm

![ ](https://img.shields.io/npm/l/aws-ssm?label=license&logo=MIT)

Helps to provide a simple interaction with **AWS's**
[SSM Parameter Store](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#getParameter-property).

## Getting Started

First install:

```sh
# npm
npm install aws-ssm
# yarn
yarn add aws-ssm
```

Then you can use in your Typescript/Javascript file like so:

```typescript
import SSM from "aws-ssm";
const ssm = new SSM({
  // Config
});

function doSomething(name: string) {
  const param = await ssm.get(name);
  // ...
}
```

## API Surface

The following basic functions are available from **aws-ssm**:

```typescript
// get a value from SSM
function get(name: string, options?: ISsmGetOptions);
// add a value to SSM; use { overwrite: true } in options if you updating
function put(name: string, value: SsmType, options?: ISsmSetOptions);
// list all or a subset of SSM Parameters
function list(options);
// the same as list but values are decrypted
function values(path, options);
// remove a SSM module
function remove(name, options);
// get a hash of SSM values (decrypted) by module name
function modules(moduleNames[], options)

/**
 * very similar to **list** but uses a differnt API endpoint which
 * loses the ability to bring back _values_ but adds the user
 * who last updated the parameter.
 */
function describeParameters();
```

## Opinionated Naming

With SSM you're able to use any naming you choose for your variables and that includes
full "paths" (aka, strings with the "/" character deliminiting the name). With `aws-ssm`
we have established a naming convention which follows the following structure:

> / [ `stage` ] / [ `version` ] / [ `system` ] / [ `NAME` ]

So, for example, if you were using the Firebase Admin SDK you'd likely want to set the
_production_ service account as:

```typescript
const ssm = new SSM(/** config */);
await ssm.put("/prod/1/firebase/SERVICE_ACCOUNT", "...");
```

Because of convention, we are afforded a lot of convenience assuming we follow some basic
environment variable conventions:

```typescript
const ssm = new SSM(/** config */);
const serviceAccount = await ssm.get("firebase/SERVICE_ACCOUNT");
```

The above will resolve the _stage_ for you so long as the `AWS_STAGE` environment variable
is set (or as a fallback the `NODE_ENV` variable) and the version will be set to "1"
unless the `AWS_VERSION` is set.

## Config

This library is intended to work both as an aid to CLI tools as well as programatically
embedded into your serverless functions (or other code I guess). Because of this there are
two main modalities for configuration.

### CLI Config

When you're using a CLI you'll want to simply provide a "profile name" which can be looked
up in the user's AWS credentials file ( `~/.aws/credentials` ). So assuming you have a
profile in your credentials file named "myProject" you could use the following to
configure **aws-ssm**:

```typescript
const ssm = new SSM({ profile: "myProject" });
```

### Deploy Time Serverless Config

When your using this library with serverless functions you will need to ensure they have
permission to execute SSM actions. Assuming you are using the
[Serverless Framework](https://serverless.com), you would provide permissions something
like the following:

```typescript
const ssmPermissions: IServerlessIAMRole = {
  Effect: "Allow",
  Action: ["ssm:GetParameter", "ssm:GetParametersByPath"],
  Resource: [`arn:aws:ssm:${REGION}:${ACCOUNT}:parameter*`]
};
```

> **Note:** we're suckers for TS and typing but you'll probably need to convert the above
> to YAML for your purposes; unless of course you're using the
> [`typescript-microservice`](https://github.com/lifegadget/generator-typescript-microservice)
> yeoman template.

You'll notice that we allowed access to all SSM paths for the given region and account but
actually probably a smarter strategy would be to limit access to the _stage_ you're in:

> Resource: [ `'arn:aws:ssm:${REGION}:${ACCOUNT}:parameter-${STAGE}*'` ]

Final note, if it wasn't clear. When you give permissions at deploy time, your serverless
code executed at run time needs zero config because it by default has permissions:

```typescript
const ssm = new SSM();
```

### Runtime Serverless Config

If you want you can also programatically add in the AWS Credentials at run time:

```typescript
const ssm = new SSM({
  CredentialsOptions: {
    accessKey: "abc",
    secretAccessKey: "123"
  }
});
```

### Other Config Options

You can also add the following config items to your configuration (regardless of which
strategy from above you use):

- `cli` - by default this logger will not output anything to **stdout** but if you turn
  this on with a "TRUE" then it will output useful CLI output
- `defaultType` - by default variables will be presumed to be of type "SecureString" but
  you change this to "String" if you prefer that as a default type

## Serverless Example

Since we build this library in large part to be used within AWS serverless architectures,
we wanted to conclude with what we see as a good example of usage of `aws-ssm` in a AWS
Lambda function. In this example we'll assume that the particular module depends on
getting secrets from "firebase" and "logzio". In this case we might write the handler
function like this:

```typescript
let _secrets: ISsmExportsOutput;
const getSecrets = async () => {
  if(!_secrets) {
    const ssm = new SSM();
    _secrets = await ssm.modules(["firebase", "logzio"]);
  }

  return _secrets;
};

const async handler(event, context, callback) {
  const secrets = await getSecrets();
  // ...
  const db = await DB.connect( secrets.firebase.serviceAccount );
}
```

In the above example we provide a compact way of specifying the modules we want secrets
on. Assuming that the environment variables are set -- which you should always do anyway
-- then `aws-ssm` will have no issues resolving all secrets. At the same time, there is a
time cost in using SSM so we have wrapped the functionality in a way that ensures that if
the AWS Lambda function is _reused_ (aka, a warm start) then the SSM calls will not be
made after the first time.

## License

Copyright (c) 2019 Inocan Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
