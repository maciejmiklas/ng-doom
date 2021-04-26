import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TitleImgComponent} from './title-img.component';

describe('TitleImgComponent', () => {
	let component: TitleImgComponent;
	let fixture: ComponentFixture<TitleImgComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TitleImgComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TitleImgComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
