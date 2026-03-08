import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'


export class BlockeCountryDto {
    @IsString()
    @Length(2, 5)
    countryCode!: string

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    reason?: string
}