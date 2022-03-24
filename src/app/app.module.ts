import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {MainComponent} from './main/web/main.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {WadDirsComponent} from './wad/wad-dirs/wad-dirs.component';
import {WadTitleImgComponent} from './wad/wad-title-img/wad-title-img.component';
import {WadPlaypalComponent} from './wad/wad-playpal/wad-playpal.component';
import {WadPaletteComponent} from './wad/wad-palette/wad-palette.component';
import {PbmpComponent} from './wad/pbmp/pbmp.component';
import {WadUploadComponent} from './wad/wad-upload/wad-upload.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MenuComponent} from './menu/menu.component';
import {EmptyComponent} from './common/empty/empty.component';
import {NgRxEventBusModule} from 'ngrx-event-bus';
import {NgxFileDropModule} from 'ngx-file-drop';
import {NgxBootstrapSliderModule} from 'ngx-bootstrap-slider';
import {CarouselComponent} from './common/carousel/carousel.component';
import {NavbarCarouselPluginComponent} from './common/carousel/navbar-plugin/navbar-plugin.component';
import {WadSpritesComponent} from './wad/wad-sprites/wad-sprites.component';
import {PbmpAnimationComponent} from './wad/pbmp-animation/pbmp-animation.component';
import {MainOverflowDirective} from './main/web/main-overflow.directive';
import {WadDirComponent} from './wad/wad-dir/wad-dir.component';
import {WadDirElementComponent} from './wad/wad-dir-element/wad-dir-element.component';
import {WadDirsNavbarPluginComponent} from './wad/wad-dirs/wad-dirs-navbar-plugin/wad-dirs-navbar-plugin.component';
import {PaperComponent} from './common/paper/paper.component';
import { WadMapComponent } from './wad/wad-map/wad-map.component';
import { NavbarMapPluginComponent } from './wad/wad-map/navbar-map-plugin/navbar-map-plugin.component';
import { PlayComponent } from './game/play/play.component';

@NgModule({
	declarations: [
		MainComponent,
		WadDirsComponent,
		WadTitleImgComponent,
		WadPlaypalComponent,
		WadPaletteComponent,
		PbmpComponent,
		WadUploadComponent,
		MenuComponent,
		EmptyComponent,
		NavbarCarouselPluginComponent,
		CarouselComponent,
		WadSpritesComponent,
		PbmpAnimationComponent,
		MainOverflowDirective,
		WadDirComponent,
		WadDirElementComponent,
		WadDirsNavbarPluginComponent,
		PaperComponent,
  WadMapComponent,
  NavbarMapPluginComponent,
  PlayComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		ReactiveFormsModule,
		NgxBootstrapSliderModule,
		NgbModule,
		BrowserAnimationsModule,
		NgRxEventBusModule,
		NgxFileDropModule,
		FormsModule
	],
	providers: [],
	bootstrap: [MainComponent]
})
export class AppModule {

}
