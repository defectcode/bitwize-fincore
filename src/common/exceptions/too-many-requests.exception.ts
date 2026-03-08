import { HttpException, HttpStatus } from '@nestjs/common'


export class TooManyRequestsException extends HttpException {
    constructor(message: string = "To many requests") {
        super(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                message,
                error: "Too many Requests"
            },
            HttpStatus.TOO_MANY_REQUESTS
        )
    }
}