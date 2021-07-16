import {TestBed} from '@angular/core/testing';

import {MenuService} from './menu.service';
import {MenuL1, MenuRoot} from './menu_model';
import {WadUploadMenuDecorator} from '../../wad/service/wad-menu.service';

describe('MenuParserService - on Mock', () => {
	let menuService: MenuService;
	let wadUploadMenuDecoratorSpy: jasmine.SpyObj<WadUploadMenuDecorator>;

	beforeEach(() => {
		const uploadVisibleSpy = jasmine.createSpyObj('WadUploadMenuDecorator', ['visible']);
		TestBed.configureTestingModule({
			providers: [WadUploadMenuDecorator, {provide: WadUploadMenuDecorator, useValue: uploadVisibleSpy}],
		});
		menuService = TestBed.inject(MenuService);
		wadUploadMenuDecoratorSpy = TestBed.inject(WadUploadMenuDecorator) as jasmine.SpyObj<WadUploadMenuDecorator>;

		menuService.replaceMenu({
			l1: [{
				title: 'Manage WADs',
				l2: [
					{id: 'mid_wad_upload', title: 'Upload new', path: 'wad_upload', decorator: 'dec_wad_upload'},
					{id: 'mid_wad_list', title: 'My WADs', path: 'wad_list', decorator: 'dec_wad_upload'}
				]
			}, {
				title: 'WAD Viewer',
				l2: [
					{id: 'mid_wad_maps', title: 'Maps', path: 'wad_maps', decorator: 'dec_wad_upload'}
				]
			}], welcomeMid: 'mid_wad_upload'
		});
	});

	it('Menu Visibility - Visible', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(true);
		const root = menuService.visibleMenu();
		expect(root.l1[0].l2.length).toEqual(2);
		expect(root.l1[1].l2.length).toEqual(1);
		expect(root.l1[0].l2[0].id).toEqual('mid_wad_upload');
		expect(root.l1[0].l2[1].id).toEqual('mid_wad_list');
		expect(root.l1[1].l2[0].id).toEqual('mid_wad_maps');
	});

	it('Menu Visibility - Hidden', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(false);
		const root = menuService.visibleMenu();
		expect(root.l1.length).toEqual(0);
	});

});

describe('MenuParserService - on Real Data', () => {
	let menuService: MenuService;

	beforeEach(() => {
		menuService = TestBed.inject(MenuService);
	});

	it('Should be Created', () => {
		expect(menuService).toBeTruthy();
	});

	it('Parse Menu Without Visibility', () => {
		const root = menuService.menuFull();
		expect(root.welcomeMid).toEqual('mid_wad_upload');
		expect(root.l1.length).toEqual(3);
		expect(root.l1[0].title).toEqual('Manage WADs');
	});

	it('Initial Menu Structure to Json', () => {
		const manage_wads: MenuL1 = {
			title: 'Manage WADs',
			l2: [
				{id: 'mid_wad_upload', title: 'Upload new', path: 'wad_upload', decorator: 'dec_wad_upload'},
				{id: 'mid_wad_list', title: 'My WADs', path: 'wad_list', decorator: 'dec_wad_list'},
				{id: 'mid_wad_select', title: 'Select WAD', path: 'wad_select', decorator: 'dec_wad_select'}]
		};

		const wad_viewer: MenuL1 = {
			title: 'WAD Viewer',
			l2: [
				{id: 'mid_wad_maps', title: 'Maps', path: 'wad_maps', decorator: 'dec_wad_maps'},
				{id: 'mid_wad_palette', title: 'Palette', path: 'wad_palette', decorator: 'dec_wad_palette'},
				{id: 'mid_wad_title_img', title: 'Title Images', path: 'wad_title_img', decorator: 'dec_wad_title_img'}]
		};

		const saves: MenuL1 = {
			title: 'Save/Load',
			l2: [
				{id: 'mid_save_load', title: 'Load', path: 'save_load', decorator: 'SaveLoadMenuDecorator'},
				{id: 'mid_save_new', title: 'Save', path: 'save_new', decorator: 'SaveNewMenuDecorator'},
				{id: 'mid_save_manage', title: 'Manage', path: 'save_manage', decorator: 'SaveMenageMenuDecorator'}]
		};

		const root: MenuRoot = {l1: [manage_wads, wad_viewer, saves], welcomeMid: 'mid_wad_upload'};
		const json = JSON.stringify(root);
		expect(json).toContain('save_load');
		expect(json).toContain('wad_palette');
		expect(json).toContain('Manage WADs');
	});
});
