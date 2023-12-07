/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {NgModule} from '@angular/core'
import {RouterModule, Routes} from '@angular/router'
import {WadTitleImgComponent} from './wad/wad-title-img/wad-title-img.component'
import {WadPlaypalComponent} from './wad/wad-playpal/wad-playpal.component'
import {WadUploadComponent} from './wad/wad-upload/wad-upload.component'
import {EmptyComponent} from './common/empty/empty.component'
import {WadSpritesComponent} from './wad/wad-sprites/wad-sprites.component'
import {AppSetupService} from './app-setup.service'
import {WadDirsComponent} from './wad/wad-dirs/wad-dirs.component'
import {WadMapComponent} from './wad/wad-map/wad-map.component'
import {PlayComponent} from './game/play/play.component'
import {WadPatchesComponent} from './wad/wad-patches/wad-patches.component'
import {WadTexturesComponent} from './wad/wad-textures/wad-textures.component'
import {WadFlatsComponent} from "./wad/wad-flats/wad-flats.component"


const routes: Routes = [

	{path: 'path_wad_title_img', component: WadTitleImgComponent},
	{path: 'path_wad_sprites', component: WadSpritesComponent},
	{path: 'path_wad_patches', component: WadPatchesComponent},
	{path: 'path_wad_flats', component: WadFlatsComponent},
	{path: 'path_wad_textures', component: WadTexturesComponent},
	{path: 'path_wad_playpal', component: WadPlaypalComponent},
	{path: 'path_wad_upload', component: WadUploadComponent},
	{path: 'path_wad_dirs', component: WadDirsComponent},
	{path: 'path_wad_list', component: EmptyComponent},
	{path: 'path_wad_select', component: EmptyComponent},
	{path: 'path_wad_maps', component: WadMapComponent},
	{path: 'path_game_new', component: PlayComponent},
	{path: 'path_game_load', component: EmptyComponent},
	{path: 'path_game_save', component: EmptyComponent},
	{path: 'path_game_manage', component: EmptyComponent}
]

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {

	constructor(private appSetupService: AppSetupService) {
		appSetupService.setup()
	}

}
