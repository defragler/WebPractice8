import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateGadgetTransactionalDto } from './dto/create-gadget-transactional.dto';
import { CreateGadgetDto } from './dto/create-gadget.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateGadgetDto } from './dto/update-gadget.dto';
import { GadgetsService } from './gadgets.service';

@Controller('gadgets')
export class GadgetsController {
  constructor(private readonly gadgetsService: GadgetsService) {}

  @Post()
  create(@Body() dto: CreateGadgetDto) {
    return this.gadgetsService.create(dto);
  }

  /** Атомарне створення агрегата (гаджет + гарантія + фічі) в одній транзакції. */
  @Post('transactional')
  createTransactional(@Body() dto: CreateGadgetTransactionalDto) {
    return this.gadgetsService.createTransactional(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.gadgetsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.gadgetsService.findOne(id);
  }

  /** Повний агрегат: 1:1 + M:N + M:1 + 1:M одним QueryBuilder-запитом. */
  @Get(':id/full')
  findFull(@Param('id', ParseUUIDPipe) id: string) {
    return this.gadgetsService.findFull(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGadgetDto) {
    return this.gadgetsService.update(id, dto);
  }

  /** Атомарне повне оновлення агрегата. */
  @Put(':id/full')
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGadgetTransactionalDto,
  ) {
    return this.gadgetsService.replaceTransactional(id, dto);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.gadgetsService.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.gadgetsService.remove(id);
  }
}
