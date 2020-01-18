import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetAdminComponent } from './set-admin.component';

describe('SetAdminComponent', () => {
  let component: SetAdminComponent;
  let fixture: ComponentFixture<SetAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetAdminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
