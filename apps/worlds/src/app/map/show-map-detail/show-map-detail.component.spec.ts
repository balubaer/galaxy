import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMapDetailComponent } from './show-map-detail.component';

describe('ShowMapDetailComponent', () => {
  let component: ShowMapDetailComponent;
  let fixture: ComponentFixture<ShowMapDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMapDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMapDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
