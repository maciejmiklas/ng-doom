import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PbmpComponent} from './pbmp.component';

describe('PbmpComponent', () => {
	let component: PbmpComponent;
	let fixture: ComponentFixture<PbmpComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PbmpComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PbmpComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
