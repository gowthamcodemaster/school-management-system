import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<any> {
    let healthResval: any = '';
    await this.appService.getHealth().then((value) => (healthResval = value));
    return healthResval;
  }
}
