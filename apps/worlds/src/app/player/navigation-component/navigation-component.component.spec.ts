import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationPlayerComponent } from "./NavigationPlayerComponent";

describe('NavigationPlayerComponent', () => {
  let component: NavigationPlayerComponent;
  let fixture: ComponentFixture<NavigationPlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavigationPlayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
