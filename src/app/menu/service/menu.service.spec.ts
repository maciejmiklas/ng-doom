import {TestBed} from '@angular/core/testing';

import {MenuService} from './menu.service';
import {MenuL1, MenuRoot} from './menu-model';
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
			id: 'm1_manage_wads',
			title: 'Manage WADs',
			l2: [
				{id: 'm2_wad_upload', title: 'Upload new', path: 'path_wad_upload', decorator: 'dec_wad_upload'},
				{id: 'm2_wad_list', title: 'My WADs', path: 'path_wad_list', decorator: 'dec_wad_list'},
				{id: 'm2_wad_select', title: 'Select WAD', path: 'path_wad_select', decorator: 'dec_wad_select'}]
		};

		const wad_viewer: MenuL1 = {
			id: 'm1_wad_viewer',
			title: 'WAD Viewer',
			l2: [
				{id: 'm2_wad_maps', title: 'Maps', path: 'path_wad_maps', decorator: 'dec_wad_maps'},
				{id: 'm2_wad_dirs', title: 'Directories', path: 'path_wad_dirs', decorator: 'dec_wad_dirs'},
				{id: 'm2_wad_playpal', title: 'Playpal', path: 'path_wad_playpal', decorator: 'dec_wad_playpal'},
				{id: 'm2_wad_title_img', title: 'Title Images', path: 'path_wad_title_img', decorator: 'dec_wad_title_img'},
				{id: 'm2_wad_sprites', title: 'Sprites', path: 'path_wad_sprites', decorator: 'dec_wad_sprites'}]
		};

		const saves: MenuL1 = {
			id: 'm1_game',
			title: 'Game',
			l2: [
				{id: 'm2_game_new', title: 'New', path: 'path_game_new', decorator: 'dec_game_new'},
				{id: 'm2_game_load', title: 'Load', path: 'path_game_load', decorator: 'dec_game_load'},
				{id: 'm2_game_save', title: 'Save', path: 'path_game_save', decorator: 'dec_game_save'},
				{id: 'm2_game_manage', title: 'Manage Saves', path: 'path_game_manage', decorator: 'dec_game_manage'}]
		};

		const root: MenuRoot = {l1: [manage_wads, wad_viewer, saves], initialState: {idL1: 'm1_manage_wads', idL2: 'm2_wad_upload'}};
		const json = JSON.stringify(root);
		expect(json).toContain('save_load');
		expect(json).toContain('m2_wad_playpal');
		expect(json).toContain('Manage WADs');
	});
});
