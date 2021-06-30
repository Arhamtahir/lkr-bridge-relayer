import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BridgeSchema } from 'src/bridge/bridge.model';
import { MigrationController } from './migration.controller';
import { MigrationSchema } from './migration.model';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'MigrationV3', schema: MigrationSchema },
      { name: 'Bridge', schema: BridgeSchema },
    ]),
  ],
  controllers: [MigrationController],
  providers: [MigrationService],
})
export class MigrationModule {}
