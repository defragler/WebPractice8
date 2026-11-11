import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateWarrantyDto {
  @IsInt()
  @Min(1)
  durationMonths: number;

  @IsString()
  @IsNotEmpty()
  conditions: string;
}
