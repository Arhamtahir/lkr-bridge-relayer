import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bridge } from './bridge.model';

@Injectable()
export class BridgeService {
  constructor(
    @InjectModel('Bridge') private readonly bridgeModel: Model<Bridge>,
  ) {}

  async createBridge(req: any) {
    try {
      const response = await this.bridgeModel.create(req);

      if (!response) {
        throw {
          msg: 'Unable to create bridge',
          status: HttpStatus.BAD_REQUEST,
        };
      }

      return response;
    } catch (error) {
      throw {
        msg: 'Unable to create Bridge',
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }
}
