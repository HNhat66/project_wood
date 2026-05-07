import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const mockAppService = {
    getVersion: jest.fn().mockReturnValue('48e2527'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  it('should return the version from AppService', () => {
    expect(appController.getVersion()).toBe('48e2527');
    expect(mockAppService.getVersion).toHaveBeenCalled();
  });
});
