import { Module } from '@nestjs/common';
import { BridgeService } from './bridge.service';
import { BridgeController } from './bridge.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BridgeSchema } from './bridge.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Bridge', schema: BridgeSchema }]),
  ],
  providers: [BridgeService],
  controllers: [BridgeController],
})
export class BridgeModule {}
