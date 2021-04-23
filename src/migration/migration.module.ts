import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockSchema } from 'src/blocks/blocks.model';
import { MigrationController } from './migration.controller';
import { MigrationSchema } from './migration.model';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'MigrationV3', schema: MigrationSchema },
      { name: 'Blocks', schema: BlockSchema },
    ]),
  ],
  controllers: [MigrationController],
  providers: [MigrationService],
})
export class MigrationModule {}
