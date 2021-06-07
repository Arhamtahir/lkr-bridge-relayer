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

  @Get('claimStatus/:txhash')
  async getClaimStatus(@Param('txhash') txhash: string) {
    console.log('txhash ==>>', txhash);
    return await this.migrationService.getTransactionClaimStatus(txhash);
  }

  // @Get('/:account/:chainId')
  // async getMigration(
  //   @Param('account') account: string,
  //   @Param('chainId') chainId: number,
  // ) {
  //   const response = await this.migrationService.getMigration(account, chainId);
  //   return response;
  // }
}
