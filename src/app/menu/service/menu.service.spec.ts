import {TestBed} from '@angular/core/testing';

import {MenuService} from './menu.service';
import {MenuL1, MenuRoot} from './menu_model';
import {WadListMenuDecorator, WadUploadMenuDecorator} from '../../wad/service/wad-menu.service';

describe('MenuParserService - on Mock', () => {
	let menuService: MenuService;
	let wadUploadMenuDecoratorSpy: jasmine.SpyObj<WadUploadMenuDecorator>;
	let wadListMenuDecoratorSpy: jasmine.SpyObj<WadListMenuDecorator>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [WadUploadMenuDecorator, WadListMenuDecorator, {
				provide: WadUploadMenuDecorator,
				useValue: jasmine.createSpyObj('WadUploadMenuDecorator', ['visible'])
			}, {
				provide: WadListMenuDecorator,
				useValue: jasmine.createSpyObj('WadListMenuDecorator', ['visible'])
			}],
		});
		menuService = TestBed.inject(MenuService);
		wadUploadMenuDecoratorSpy = TestBed.inject(WadUploadMenuDecorator) as jasmine.SpyObj<WadUploadMenuDecorator>;
		wadListMenuDecoratorSpy = TestBed.inject(WadListMenuDecorator) as jasmine.SpyObj<WadListMenuDecorator>;

		menuService.replaceMenu({
			l1: [{
				title: 'Manage WADs',
				id: 'mw',
				l2: [
					{id: 'mid_wad_upload', title: 'Upload new', path: 'wad_upload', decorator: 'dec_wad_upload'},
					{id: 'mid_wad_list', title: 'My WADs', path: 'wad_list', decorator: 'dec_wad_list'}
				]
			}, {
				title: 'WAD Viewer',
				id: 'wv',
				l2: [
					{id: 'mid_wad_maps', title: 'Maps', path: 'wad_maps', decorator: 'dec_wad_upload'}
				]
			}], initialState: {idL1: 'm1_manage_wads', idL2: 'm2_wad_upload'}
		});
	});

	it('Menu Visibility - all Visible', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(true);
		wadListMenuDecoratorSpy.visible.and.returnValue(true);
		const root = menuService.visibleMenu;
		expect(root.l1[0].l2.length).toEqual(2);
		expect(root.l1[1].l2.length).toEqual(1);
		expect(root.l1[0].l2[0].id).toEqual('mid_wad_upload');
		expect(root.l1[0].l2[1].id).toEqual('mid_wad_list');
		expect(root.l1[1].l2[0].id).toEqual('mid_wad_maps');
	});

	it('Menu Visibility - all Hidden', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(false);
		wadListMenuDecoratorSpy.visible.and.returnValue(false);
		const root = menuService.visibleMenu;
		expect(root.l1.length).toEqual(0);
	});

	it('Menu Visibility - partial Hidden', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(false);
		wadListMenuDecoratorSpy.visible.and.returnValue(true);
		const root = menuService.visibleMenu;
		expect(root.l1.length).toEqual(1);
		expect(root.l1[0].l2.length).toEqual(1);
	});

	it('Menu Visibility - hide and show', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(false);
		wadListMenuDecoratorSpy.visible.and.returnValue(true);
		expect(menuService.visibleMenu.l1[0].l2.length).toEqual(1);

		wadUploadMenuDecoratorSpy.visible.and.returnValue(true);
		expect(menuService.visibleMenu.l1[0].l2.length).toEqual(2);
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
		const root = menuService.initialMenu;
		expect(root.initialState.idL1).toEqual('m1_manage_wads');
		expect(root.initialState.idL2).toEqual('m2_wad_upload');
		expect(root.l1.length).toEqual(3);
		expect(root.l1[0].title).toEqual('Manage WADs');
	});

	it('Initial Menu Structure to Json', () => {
		const manage_wads: MenuL1 = {
			title: 'Manage WADs',
			id: 'm1_manage_wads',
			l2: [
				{id: 'm2_wad_upload', title: 'Upload new', path: 'wad_upload', decorator: 'dec_wad_upload'},
				{id: 'm2_wad_list', title: 'My WADs', path: 'wad_list', decorator: 'dec_wad_list'},
				{id: 'm2_wad_select', title: 'Select WAD', path: 'wad_select', decorator: 'dec_wad_select'}]
		};

		const wad_viewer: MenuL1 = {
			title: 'WAD Viewer',
			id: 'm1_wad_viewer',
			l2: [
				{id: 'm2_wad_maps', title: 'Maps', path: 'wad_maps', decorator: 'dec_wad_maps'},
				{id: 'm2_wad_palette', title: 'Palette', path: 'wad_palette', decorator: 'dec_wad_palette'},
				{id: 'm2_wad_title_img', title: 'Title Images', path: 'wad_title_img', decorator: 'dec_wad_title_img'}]
		};

		const saves: MenuL1 = {
			title: 'Save/Load',
			id: 'm1_saves',
			l2: [
				{id: 'm2_save_load', title: 'Load', path: 'save_load', decorator: 'dec_mid_save_load'},
				{id: 'm2_save_new', title: 'Save', path: 'save_new', decorator: 'dec_mid_save_new'},
				{id: 'm2_save_manage', title: 'Manage', path: 'save_manage', decorator: 'dec_mid_save_manage'}]
		};

		const root: MenuRoot = {l1: [manage_wads, wad_viewer, saves], initialState: {idL1: 'm1_manage_wads', idL2: 'm2_wad_upload'}};
		const json = JSON.stringify(root);
		expect(json).toContain('save_load');
		expect(json).toContain('wad_palette');
		expect(json).toContain('Manage WADs');
	});
});
