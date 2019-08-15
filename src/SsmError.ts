export class SsmError extends Error {
  public code: string;
  constructor(code: string, message: string) {
    super();
    this.message = message;
    this.code = code;
    this.name = "SsmError";
  }
}
