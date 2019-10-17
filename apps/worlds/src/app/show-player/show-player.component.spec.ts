import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPlayerComponent } from './show-player.component';

describe('ShowPlayerComponent', () => {
  let component: ShowPlayerComponent;
  let fixture: ComponentFixture<ShowPlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPlayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
