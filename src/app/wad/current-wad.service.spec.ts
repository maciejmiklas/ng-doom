import {TestBed} from '@angular/core/testing';

import {CurrentWadService} from './current-wad.service';

describe('CurrentWadService', () => {
	let service: CurrentWadService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(CurrentWadService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
