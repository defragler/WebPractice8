import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateGadgetDto } from './create-gadget.dto';

export class UpdateGadgetDto extends PartialType(
  OmitType(CreateGadgetDto, ['features', 'warranty'] as const),
) {}
