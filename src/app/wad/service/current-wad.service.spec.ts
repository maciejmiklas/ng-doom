import {TestBed} from '@angular/core/testing';

import {CurrentWadService} from './current-wad.service';
import {WadUploadMenuDecorator} from './wad-menu.service';

describe('CurrentWadService', () => {
	let service: CurrentWadService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(CurrentWadService);
		TestBed.inject(WadUploadMenuDecorator);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('eval', () => {
		expect(service).toBeTruthy();
	});
});
