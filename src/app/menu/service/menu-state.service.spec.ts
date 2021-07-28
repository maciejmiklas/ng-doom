import {TestBed} from '@angular/core/testing';

import {MenuStateService} from './menu-state.service';

describe('StateService', () => {
	let service: MenuStateService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MenuStateService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
