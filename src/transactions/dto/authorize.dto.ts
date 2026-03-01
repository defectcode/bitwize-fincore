import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator'

export class AuthorizeDto {

    @IsUUID()
    cardId!: string

    @IsUUID()
    merchantId!: string

    @IsInt()
    @Min(1)
    amount!: number

    @IsString()
    @IsNotEmpty()
    currency!: string

    @IsString()
    @IsNotEmpty()
    idempotencyKey!: string
}