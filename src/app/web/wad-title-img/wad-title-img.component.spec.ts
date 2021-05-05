import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WadTitleImgComponent} from './wad-title-img.component';

describe('TitleImgComponent', () => {
	let component: WadTitleImgComponent;
	let fixture: ComponentFixture<WadTitleImgComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [WadTitleImgComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(WadTitleImgComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
