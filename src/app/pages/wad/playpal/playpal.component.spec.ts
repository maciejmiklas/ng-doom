import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PlaypalComponent} from './playpal.component';

describe('PlaypalComponent', () => {
	let component: PlaypalComponent;
	let fixture: ComponentFixture<PlaypalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PlaypalComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PlaypalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
