import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'


export class BlockeMerchantDto {
    @IsUUID()
    merchantId!: string

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    reason?: string
}