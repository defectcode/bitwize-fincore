import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, Min } from 'class-validator'


export class GetWalletLedgerQueryDto {
    @IsOptional()
    @IsIn(["DEBIT", "CREDIT"])
    type?: "DEBIT" | "CREDIT"

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0
}