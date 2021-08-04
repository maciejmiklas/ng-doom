import {TestBed} from '@angular/core/testing';

import {WadStorageService} from './wad-storage.service';

describe('WadStorageService', () => {
	let service: WadStorageService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(WadStorageService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
