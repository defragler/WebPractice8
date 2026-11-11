import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateWarrantyDto } from './create-warranty.dto';

export class CreateGadgetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  price: number;

  @IsInt()
  @Min(0)
  warrantyMonths: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cpu: string;

  @IsInt()
  @Min(0)
  ramGb: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  features?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateWarrantyDto)
  warranty?: CreateWarrantyDto;
}
