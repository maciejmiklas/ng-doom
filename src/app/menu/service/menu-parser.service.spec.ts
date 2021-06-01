import {TestBed} from '@angular/core/testing';

import {MenuParserService} from './menu-parser.service';

describe('MenuParserService', () => {
	let service: MenuParserService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MenuParserService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
