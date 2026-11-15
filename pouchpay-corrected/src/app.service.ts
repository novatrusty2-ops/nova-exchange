import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'PouchPay Backend Running Successfully!';
  }
}
