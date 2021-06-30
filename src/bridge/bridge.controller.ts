import { Controller, Post, Req, Request } from '@nestjs/common';
import { BridgeService } from './bridge.service';

@Controller('bridge')
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  @Post('/createBridge')
  async createBridge(@Req() req: Request) {
    const response = await this.bridgeService.createBridge(req.body);
    return response;
  }
}
