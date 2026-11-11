import { OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { CreateGadgetDto } from './create-gadget.dto';

export class CreateGadgetTransactionalDto extends OmitType(CreateGadgetDto, ['price'] as const) {
  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}
