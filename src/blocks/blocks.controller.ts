import { Controller, Post, Req, Request } from '@nestjs/common';
import { BlocksService } from './blocks.service';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  //add blocls BNB/ETH
  @Post('/')
  async addBlocks(@Req() req: Request) {
    const response = await this.blocksService.addBlocks(req.body);
    return response;
  }
}
