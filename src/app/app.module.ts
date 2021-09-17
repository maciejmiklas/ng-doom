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
import {NavbarComponent} from './navbar/web/navbar/navbar.component';
import {NgxFileDropModule} from 'ngx-file-drop';
import {NavbarPluginComponent} from './wad/web/wad-title-img/navbar-plugin/navbar-plugin.component';
import {NgxBootstrapSliderModule} from 'ngx-bootstrap-slider';
import {CarouselComponent} from './common/web/carousel/carousel.component';
import {NavbarCarouselPluginComponent} from './common/web/carousel/navbar-plugin/navbar-plugin.component';

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
		EmptyComponent,
		NavbarComponent,
		NavbarCarouselPluginComponent,
		NavbarPluginComponent,
		CarouselComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		ReactiveFormsModule,
		NgxBootstrapSliderModule,
		NgbModule,
		BrowserAnimationsModule,
		NgRxEventBusModule,
		NgxFileDropModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}
