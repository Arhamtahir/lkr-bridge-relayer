import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log("asd")
    return 'Phonix Migration dApp Server v33!';
  }
}
