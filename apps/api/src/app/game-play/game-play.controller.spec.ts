import { Test, TestingModule } from '@nestjs/testing';
import { GamePlayController } from './game-play.controller';

describe('GamePlay Controller', () => {
  let controller: GamePlayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamePlayController],
    }).compile();

    controller = module.get<GamePlayController>(GamePlayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
