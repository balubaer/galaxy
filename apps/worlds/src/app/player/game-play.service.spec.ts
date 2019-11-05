import { TestBed } from '@angular/core/testing';

import { GamePlayService } from './game-play.service';

describe('GamePlayService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GamePlayService = TestBed.get(GamePlayService);
    expect(service).toBeTruthy();
  });
});
