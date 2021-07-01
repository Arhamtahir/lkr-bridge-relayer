import {
  Controller,
  Get,
  Post,
  Req,
  Request,
  Param,
  Patch,
} from '@nestjs/common';

import { MigrationService } from './migration.service';

@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}
}
