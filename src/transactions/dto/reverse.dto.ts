import { IsNotEmpty, IsString } from 'class-validator'


export class ReverseDto {
    @IsString()
    @IsNotEmpty()
    idempotencyKey!: string
}