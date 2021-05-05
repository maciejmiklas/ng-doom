import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { WadDirsComponent } from './web/wad-dirs/wad-dirs.component';
import {WadTitleImgComponent} from './web/wad-title-img/wad-title-img.component';
import {WadPlaypalComponent} from './web/wad-playpal/wad-playpal.component';
import {WadPaletteComponent} from './web/wad-palette/wad-palette.component';
import {PbmpComponent} from './web/pbmp/pbmp.component';
import {WadUploadComponent} from './web/wad-upload/wad-upload.component';
import {CurrentWadService} from './wad/current-wad.service';

@NgModule({
	declarations: [
		AppComponent,
		WadDirsComponent,
		WadTitleImgComponent,
		WadPlaypalComponent,
		WadPaletteComponent,
		PbmpComponent,
		WadUploadComponent,
		WadDirsComponent
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
