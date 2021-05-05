import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WadPlaypalComponent} from './wad-playpal.component';

describe('PlaypalComponent', () => {
	let component: WadPlaypalComponent;
	let fixture: ComponentFixture<WadPlaypalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [WadPlaypalComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(WadPlaypalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
