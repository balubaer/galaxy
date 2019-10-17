import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorldController } from './create-world.controller';

describe('CreateWorld Controller', () => {
  let controller: CreateWorldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateWorldController],
    }).compile();

    controller = module.get<CreateWorldController>(CreateWorldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
