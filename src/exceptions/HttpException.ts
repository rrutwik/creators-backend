export class HttpException extends Error {
  public status: number;
  public message: string;

  constructor(status: number, message: string, data: { [key: string]: any } = {}) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

