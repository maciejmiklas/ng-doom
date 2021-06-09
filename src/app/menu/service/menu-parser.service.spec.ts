import {TestBed} from '@angular/core/testing';

import {MenuParserService} from './menu-parser.service';
import {MenuL1, MenuRoot} from './menu_model';

describe('MenuParserService', () => {
	let service: MenuParserService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MenuParserService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});


	it('Initial Menu Structure to Json', () => {
		const manage_wads: MenuL1 = {
			title: 'Manage WADs',
			l2: [
				{title: 'Upload new', path: 'wad_upload'},
				{title: 'My WADs', path: 'wad_list'},
				{title: 'Select WAD', path: 'wad_select'}]
		};

		const wad_viewer: MenuL1 = {
			title: 'WAD Viewer',
			l2: [
				{title: 'Maps', path: 'wad_maps'},
				{title: 'Palette', path: 'wad_palette'},
				{title: 'Title Images', path: 'wad_title_img'}]
		};

		const saves: MenuL1 = {
			title: 'Save/Load',
			l2: [
				{title: 'Load', path: 'save_load'},
				{title: 'Save', path: 'save_new'},
				{title: 'Manage', path: 'save_manage'}]
		};

		const root: MenuRoot = {l1: [manage_wads, wad_viewer, saves]};
		const json = JSON.stringify(root);
		expect(json).toContain('save_load');
		expect(json).toContain('wad_palette');
		expect(json).toContain('Manage WADs');
	});
});
