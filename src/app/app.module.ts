import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './main/app.component';
import {ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {WadDirsComponent} from './wad/web/wad-dirs/wad-dirs.component';
import {WadTitleImgComponent} from './wad/web/wad-title-img/wad-title-img.component';
import {WadPlaypalComponent} from './wad/web/wad-playpal/wad-playpal.component';
import {WadPaletteComponent} from './wad/web/wad-palette/wad-palette.component';
import {PbmpComponent} from './wad/web/pbmp/pbmp.component';
import {WadUploadComponent} from './wad/web/wad-upload/wad-upload.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MenuComponent} from './menu/web/menu/menu.component';
import {EmptyComponent} from './common/web/empty/empty.component';
import {NgRxEventBusModule} from 'ngrx-event-bus';

@NgModule({
	declarations: [
		AppComponent,
		WadDirsComponent,
		WadTitleImgComponent,
		WadPlaypalComponent,
		WadPaletteComponent,
		PbmpComponent,
		WadUploadComponent,
		WadDirsComponent,
		MenuComponent,
		EmptyComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		ReactiveFormsModule,
		NgbModule,
		BrowserAnimationsModule,
		NgRxEventBusModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}
