import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WadTitleImgComponent} from './wad/web/wad-title-img/wad-title-img.component';
import {WadDirsComponent} from './wad/web/wad-dirs/wad-dirs.component';
import {WadPlaypalComponent} from './wad/web/wad-playpal/wad-playpal.component';
import {WadUploadComponent} from './wad/web/wad-upload/wad-upload.component';
import {EmptyComponent} from './common/web/empty/empty.component';


const routes: Routes = [

	{path: 'wad_title_img', component: WadTitleImgComponent},
	{path: 'wad-dirs', component: WadDirsComponent},
	{path: 'wad-playpal', component: WadPlaypalComponent},
	{path: 'wad_playpal', component: WadPlaypalComponent},
	{path: 'wad_upload', component: WadUploadComponent},

	{path: 'wad_list', component: EmptyComponent},
	{path: 'wad_select', component: EmptyComponent},
	{path: 'wad_maps', component: EmptyComponent},
	{path: 'save_load', component: EmptyComponent},
	{path: 'save_new', component: EmptyComponent},
	{path: 'save_manage', component: EmptyComponent},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
