# aws-ssm

![MIT license](https://img.shields.io/apm/l/:aws-ssm.svg)

Helps to provide a simple interaction with **AWS's**
[SSM Parameter Store](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#getParameter-property).
This is intended to be used by CLI scripts (aka, dumps pretty stdout) and programatic
(aka, returns structured data).

## Getting Started

First install:

```sh
# npm
npm install --save-dev aws-ssm
# yarn
yarn add aws-ssm
```

> **Note:** this library requires `aws-sdk` to work and it is listed as a
> "peer-dependency" but will not be automatically included in "dependencies" when you
> install ... this allows you to decide if you want to treat this as a run-time dependency
> or as a devDep.

Then you can use in your Typescript/Javascript file like so:

```typescript
import SSM from "aws-ssm";
const ssm = new SSM({
  // AWS Credentials
});

function doSomething(name: string) {
  const param: ISsmParameter = ssm.get(name);
  // ...
}
```

## API Surface

The following functions are available from **aws-ssm**:

```typescript
interface ISsmGetOptions {
  cli?: boolean; // default is false
  decrypt?: boolean;
}
interface ISsmSetOptions {
  cli?: boolean; // default is false
  secure?: boolean; // default is true
  force?: boolean; // default if false
}

type SsmType = string | number | object | boolean;

function get(name: string, options?: ISsmGetOptions) {...}
function set(name: string, value: SsmType, options?: ISsmSetOptions ) {...};
function list(options) {...};
function remove(name, options);
```

Since SSM doesn't natively support objects, **asm-ssm** will serialize and deserialize for
you where needed. Also bear in mind that this library is fully typed so that latest and
greatest API will be best found in the typings. The above API surface is to give you a
quick overview of how you might use/interact with this API.

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
