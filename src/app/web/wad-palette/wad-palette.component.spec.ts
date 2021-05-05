import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WadPaletteComponent} from './wad-palette.component';

describe('PaletteComponent', () => {
	let component: WadPaletteComponent;
	let fixture: ComponentFixture<WadPaletteComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [WadPaletteComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(WadPaletteComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
