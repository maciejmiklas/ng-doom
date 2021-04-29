import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DirsComponent} from './pages/wad/dirs/dirs.component';
import {TitleImgComponent} from './pages/wad/title-img/title-img.component';
import {CurrentWadService} from './wad/current-wad.service';
import {PlaypalComponent} from './pages/wad/playpal/playpal.component';
import {PaletteComponent} from './pages/wad/playpal/palette/palette.component';

@NgModule({
	declarations: [
		AppComponent,
		DirsComponent,
		TitleImgComponent,
		PlaypalComponent,
		PaletteComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		ReactiveFormsModule,
		NgbModule
	],
	providers: [CurrentWadService],
	bootstrap: [AppComponent]
})
export class AppModule {
}
