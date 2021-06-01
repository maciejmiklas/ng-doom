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


	it('Initial Menu to Json', () => {
		const manage_wads: MenuL1 = {
			id: 'manage_wads', title: 'Manage WADs',
			l2: [
				{id: 'wad_upload', title: 'Upload new', page: 'wad_upload'},
				{id: 'wad_list', title: 'My WADs', page: 'wad_list'},
				{id: 'wad_select', title: 'Select WAD', page: 'wad_select'}]
		};

		const wad_viewer: MenuL1 = {
			id: 'wad_viewer', title: 'WAD Viewer',
			l2: [
				{id: 'wad_maps', title: 'Maps', page: 'wad_maps'},
				{id: 'wad_palette', title: 'Palette', page: 'wad_palette'},
				{id: 'wad_title', title: 'Title Images', page: 'wad_title'}]
		};

		const saves: MenuL1 = {
			id: 'saves', title: 'Save/Load',
			l2: [
				{id: 'save_load', title: 'Load', page: 'save_load'},
				{id: 'save_new', title: 'Save', page: 'save_new'},
				{id: 'save_manage', title: 'Manage', page: 'save_manage'}]
		};

		const root: MenuRoot = {l1: [manage_wads, wad_viewer, saves]};
		const json = JSON.stringify(root);
		expect(json).toContain('save_load');
		expect(json).toContain('wad_palette');
		expect(json).toContain('Manage WADs');
	});
});
