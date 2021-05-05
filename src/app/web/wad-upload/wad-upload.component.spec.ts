import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WadUploadComponent } from './wad-upload.component';

describe('WadUploadComponent', () => {
  let component: WadUploadComponent;
  let fixture: ComponentFixture<WadUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WadUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WadUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
