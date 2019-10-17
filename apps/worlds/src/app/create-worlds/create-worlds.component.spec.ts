import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorldsComponent } from './create-worlds.component';

describe('CreateWorldsComponent', () => {
  let component: CreateWorldsComponent;
  let fixture: ComponentFixture<CreateWorldsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateWorldsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWorldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
