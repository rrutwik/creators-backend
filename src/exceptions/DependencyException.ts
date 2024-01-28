import { HttpException } from "./HttpException";

export class DatabaseException extends Error {
    constructor(error: Error) {
        super();
    }

    public static getHttpException(error: Error): HttpException {
        return new HttpException(500, error.message);
    }
}