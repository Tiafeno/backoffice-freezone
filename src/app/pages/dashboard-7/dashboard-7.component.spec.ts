import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard7Component } from './dashboard-7.component';

describe('Dashboard7Component', () => {
  let component: Dashboard7Component;
  let fixture: ComponentFixture<Dashboard7Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Dashboard7Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Dashboard7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
