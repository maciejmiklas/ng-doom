/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {TestBed} from '@angular/core/testing'

import {MenuService} from './menu.service'
import {MenuL1, MenuRoot} from './menu-model'
import {WadUploadMenuDecorator, WasLoadedMenuDecorator} from '../wad/wad-menu.service'

describe('MenuParserService - on Mock', () => {
	let menuService: MenuService
	let wadUploadMenuDecoratorSpy: jasmine.SpyObj<WadUploadMenuDecorator>
	let wasLoadedMenuDecorator: jasmine.SpyObj<WasLoadedMenuDecorator>

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [WadUploadMenuDecorator, WasLoadedMenuDecorator, {
				provide: WadUploadMenuDecorator,
				useValue: jasmine.createSpyObj('WadUploadMenuDecorator', ['visible'])
			}, {
				provide: WasLoadedMenuDecorator,
				useValue: jasmine.createSpyObj('WasLoadedMenuDecorator', ['visible'])
			}],
		})
		menuService = TestBed.inject(MenuService)
		wadUploadMenuDecoratorSpy = TestBed.inject(WadUploadMenuDecorator) as jasmine.SpyObj<WadUploadMenuDecorator>
		wasLoadedMenuDecorator = TestBed.inject(WasLoadedMenuDecorator) as jasmine.SpyObj<WasLoadedMenuDecorator>

		menuService.replaceMenu({
			l1: [{
				title: 'Manage WADs',
				id: 'mw',
				l2: [
					{id: 'mid_wad_upload', title: 'Upload new', path: 'wad_upload', decorator: 'dec_wad_upload'},
					{id: 'mid_wad_list', title: 'My WADs', path: 'wad_list', decorator: 'dec_wad_loaded'}
				]
			}, {
				title: 'WAD Viewer',
				id: 'wv',
				l2: [
					{id: 'mid_wad_maps', title: 'Maps', path: 'wad_maps', decorator: 'dec_wad_loaded'}
				]
			}], initialState: {idL1: 'm1_manage_wads', idL2: 'dec_wad_loaded'}
		})
	})

	it('Menu Visibility - all Visible', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(true)
		wasLoadedMenuDecorator.visible.and.returnValue(true)
		const root = menuService.visibleMenu
		expect(root.l1[0].l2.length).toEqual(2)
		expect(root.l1[1].l2.length).toEqual(1)
		expect(root.l1[0].l2[0].id).toEqual('mid_wad_upload')
		expect(root.l1[0].l2[1].id).toEqual('mid_wad_list')
		expect(root.l1[1].l2[0].id).toEqual('mid_wad_maps')
	})

	it('Menu Visibility - all Hidden', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(false)
		wasLoadedMenuDecorator.visible.and.returnValue(false)
		const root = menuService.visibleMenu
		expect(root.l1.length).toEqual(0)
	})

	it('Menu Visibility - partial Hidden', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(false)
		wasLoadedMenuDecorator.visible.and.returnValue(true)
		const root = menuService.visibleMenu
		expect(root.l1.length).toEqual(2)
		expect(root.l1[0].l2.length).toEqual(1)
	})

	it('Menu Visibility - hide and show', () => {
		wadUploadMenuDecoratorSpy.visible.and.returnValue(false)
		wasLoadedMenuDecorator.visible.and.returnValue(true)
		expect(menuService.visibleMenu.l1[0].l2.length).toEqual(1)

		wadUploadMenuDecoratorSpy.visible.and.returnValue(true)
		expect(menuService.visibleMenu.l1[0].l2.length).toEqual(2)
	})


})

describe('MenuParserService - on Real Data', () => {
	let menuService: MenuService

	beforeEach(() => {
		menuService = TestBed.inject(MenuService)
	})

	it('Should be Created', () => {
		expect(menuService).toBeTruthy()
	})

	it('Parse Menu Without Visibility', () => {
		const root = menuService.initialMenu
		expect(root.initialState.idL1).toEqual('m1_manage_wads')
		expect(root.initialState.idL2).toEqual('m2_wad_upload')
		expect(root.l1.length).toEqual(3)
		expect(root.l1[0].title).toEqual('Manage WADs')
	})

	it('Initial Menu Structure to Json', () => {
		const manage_wads: MenuL1 = {
			id: 'm1_manage_wads',
			title: 'Manage WADs',
			l2: [
				{id: 'm2_wad_upload', title: 'Upload new', path: 'path_wad_upload', decorator: 'dec_wad_upload'},
				{id: 'm2_wad_list', title: 'My WADs', path: 'path_wad_list', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_select', title: 'Select WAD', path: 'path_wad_select', decorator: 'dec_wad_loaded'}]
		}

		const wad_viewer: MenuL1 = {
			id: 'm1_wad_viewer',
			title: 'WAD Viewer',
			l2: [
				{id: 'm2_wad_maps', title: 'Maps', path: 'path_wad_maps', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_dirs', title: 'Directories', path: 'path_wad_dirs', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_playpal', title: 'Playpal', path: 'path_wad_playpal', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_title_img', title: 'Title Images', path: 'path_wad_title_img', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_sprites', title: 'Sprites', path: 'path_wad_sprites', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_patches', title: 'Patches', path: 'path_wad_patches', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_flats', title: 'Flats', path: 'path_wad_flats', decorator: 'dec_wad_loaded'},
				{id: 'm2_wad_textures', title: 'Textures', path: 'path_wad_textures', decorator: 'dec_wad_loaded'}]
		}

		const saves: MenuL1 = {
			id: 'm1_game',
			title: 'Game',
			l2: [
				{id: 'm2_game_new', title: 'New', path: 'path_game_new', decorator: 'dec_wad_loaded'},
				{id: 'm2_game_load', title: 'Load', path: 'path_game_load', decorator: 'dec_game_load'},
				{id: 'm2_game_save', title: 'Save', path: 'path_game_save', decorator: 'dec_game_save'},
				{id: 'm2_game_manage', title: 'Manage Saves', path: 'path_game_manage', decorator: 'dec_game_manage'}]
		}

		const root: MenuRoot = {l1: [manage_wads, wad_viewer, saves], initialState: {idL1: 'm1_manage_wads', idL2: 'm2_wad_upload'}}
		const json = JSON.stringify(root)
		expect(json).toContain('m2_game_load')
		expect(json).toContain('m2_wad_playpal')
		expect(json).toContain('Manage WADs')
	})
})
