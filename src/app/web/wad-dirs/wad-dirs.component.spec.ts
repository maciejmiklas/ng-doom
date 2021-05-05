import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WadDirsComponent} from './wad-dirs.component';

describe('WadDirsComponent', () => {
	let component: WadDirsComponent;
	let fixture: ComponentFixture<WadDirsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [WadDirsComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(WadDirsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
