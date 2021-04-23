import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blocks } from './blocks.model';

@Injectable()
export class BlocksService {
  constructor(
    @InjectModel('Blocks') private readonly blocksModel: Model<Blocks>,
  ) {}

  async addBlocks(req: any) {
    try {
      const response = await this.blocksModel.create(req);

      if (!response) {
        throw {
          msg: 'Unable to add blocks in DB!',
          status: HttpStatus.BAD_REQUEST,
        };
      }

      return response;
    } catch (error) {
      throw {
        msg: 'Unable to add migration in DB!',
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }
}
