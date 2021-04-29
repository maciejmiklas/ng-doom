import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TitleImgComponent} from './pages/wad/title-img/title-img.component';
import {DirsComponent} from './pages/wad/dirs/dirs.component';
import {PlaypalComponent} from './pages/wad/playpal/playpal.component';

const routes: Routes = [
	{path: 'wad-title-img', component: TitleImgComponent},
	{path: 'wad-dirs', component: DirsComponent},
	{path: 'wad-playpal', component: PlaypalComponent}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
