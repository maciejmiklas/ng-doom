import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WadTitleImgComponent} from './comp/wad-title-img/wad-title-img.component';
import {WadDirsComponent} from './comp/wad-dirs/wad-dirs.component';
import {WadPlaypalComponent} from './comp/wad-playpal/wad-playpal.component';

const routes: Routes = [
	{path: 'wad-title-img', component: WadTitleImgComponent},
	{path: 'wad-dirs', component: WadDirsComponent},
	{path: 'wad-playpal', component: WadPlaypalComponent}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
