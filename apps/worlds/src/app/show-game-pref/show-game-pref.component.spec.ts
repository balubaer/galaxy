import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGamePrefComponent } from './show-game-pref.component';

describe('ShowGamePrefComponent', () => {
  let component: ShowGamePrefComponent;
  let fixture: ComponentFixture<ShowGamePrefComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGamePrefComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGamePrefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
