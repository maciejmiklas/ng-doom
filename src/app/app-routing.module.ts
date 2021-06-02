import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WadTitleImgComponent} from './wad/web/wad-title-img/wad-title-img.component';
import {WadDirsComponent} from './wad/web/wad-dirs/wad-dirs.component';
import {WadPlaypalComponent} from './wad/web/wad-playpal/wad-playpal.component';
import {WadPaletteComponent} from './wad/web/wad-palette/wad-palette.component';
import {WadUploadComponent} from './wad/web/wad-upload/wad-upload.component';


const routes: Routes = [
	// wad_list
	// wad_select
	// wad_maps
	// save_load
	// save_new
	// save_manage
	{path: 'wad_title_img', component: WadTitleImgComponent},
	{path: 'wad-dirs', component: WadDirsComponent},
	{path: 'wad-playpal', component: WadPlaypalComponent},
	{path: 'wad_palette', component: WadPaletteComponent},
	{path: 'wad_upload', component: WadUploadComponent},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
