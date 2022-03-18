import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WadTitleImgComponent} from './wad/web/wad-title-img/wad-title-img.component';
import {WadPlaypalComponent} from './wad/web/wad-playpal/wad-playpal.component';
import {WadUploadComponent} from './wad/web/wad-upload/wad-upload.component';
import {EmptyComponent} from './common/web/empty/empty.component';
import {WadSpritesComponent} from './wad/web/wad-sprites/wad-sprites.component';
import {AppSetupService} from './app-setup.service';
import {WadDirsComponent} from './wad/web/wad-dirs/wad-dirs.component';
import {WadMapComponent} from './wad/web/wad-map/wad-map.component';
import {PlayComponent} from './game/web/play/play.component';


const routes: Routes = [

	{path: 'path_wad_title_img', component: WadTitleImgComponent},
	{path: 'path_wad_sprites', component: WadSpritesComponent},
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
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {

	constructor(private appSetupService: AppSetupService) {
		appSetupService.setup();
	}

}
