import { Injectable } from '@nestjs/common';

import { VERSION } from './config/version';

@Injectable()
export class AppService {
  getVersion(): string {
    return VERSION;
  }
}
