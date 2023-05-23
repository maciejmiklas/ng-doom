/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {NgModule} from '@angular/core'
import {BrowserModule} from '@angular/platform-browser'

import {AppRoutingModule} from './app-routing.module'
import {MainComponent} from './main/main.component'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {NgbModule} from '@ng-bootstrap/ng-bootstrap'
import {WadDirsComponent} from './wad/wad-dirs/wad-dirs.component'
import {WadTitleImgComponent} from './wad/wad-title-img/wad-title-img.component'
import {WadPlaypalComponent} from './wad/wad-playpal/wad-playpal.component'
import {WadPaletteComponent} from './wad/wad-palette/wad-palette.component'
import {PbmpComponent} from './wad/pbmp/pbmp.component'
import {WadUploadComponent} from './wad/wad-upload/wad-upload.component'
import {BrowserAnimationsModule} from '@angular/platform-browser/animations'
import {MenuComponent} from './menu/menu.component'
import {EmptyComponent} from './common/empty/empty.component'
import {NgRxEventBusModule} from '@maciejmiklas/ngrx-event-bus'
import {NgxFileDropModule} from 'ngx-file-drop'
import {NgxBootstrapSliderModule} from '@maciejmiklas/ngx-bootstrap-slider'
import {CarouselComponent} from './common/carousel/carousel.component'
import {NavbarCarouselPluginComponent} from './common/carousel/navbar-plugin/navbar-plugin.component'
import {WadSpritesComponent} from './wad/wad-sprites/wad-sprites.component'
import {PbmpAnimationComponent} from './wad/pbmp-animation/pbmp-animation.component'
import {MainOverflowDirective} from './main/main-overflow.directive'
import {WadDirComponent} from './wad/wad-dir/wad-dir.component'
import {WadDirElementComponent} from './wad/wad-dir-element/wad-dir-element.component'
import {WadDirsNavbarComponent} from './wad/wad-dirs/wad-dirs-navbar/wad-dirs-navbar.component'
import {PaperComponent} from './common/paper/paper.component'
import {WadMapComponent} from './wad/wad-map/wad-map.component'
import {WadMapNavbarComponent} from './wad/wad-map/wad-map-navbar/wad-map-navbar.component'
import {PlayComponent} from './game/play/play.component'
import {WadSpritesNavbarComponent} from './wad/wad-sprites/wad-sprites-navbar/wad-sprites-navbar.component'
import {WadPatchesComponent} from './wad/wad-patches/wad-patches.component'
import {WadPatchesNavbarComponent} from './wad/wad-patches/wad-patches-navbar/wad-patches-navbar.component'
import {WadTexturesComponent} from './wad/wad-textures/wad-textures.component'
import {WadTexturesNavbarComponent} from './wad/wad-textures/wad-textures-navbar/wad-textures-navbar.component'
import {WadTextureComponent} from './wad/wad-texture/wad-texture.component'
import {WadFlatsComponent} from './wad/wad-flats/wad-flats.component'
import {WadFlatsNavbarComponent} from './wad/wad-flats/wad-flats-navbar/wad-flats-navbar.component'

@NgModule({
    declarations: [MainComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        NgxBootstrapSliderModule,
        NgbModule,
        BrowserAnimationsModule,
        NgRxEventBusModule,
        NgxFileDropModule,
        FormsModule,
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
        WadDirsNavbarComponent,
        PaperComponent,
        WadMapComponent,
        WadMapNavbarComponent,
        PlayComponent,
        WadSpritesNavbarComponent,
        WadPatchesComponent,
        WadPatchesNavbarComponent,
        WadTexturesComponent,
        WadTexturesNavbarComponent,
        WadTextureComponent,
        WadFlatsComponent,
        WadFlatsNavbarComponent
    ],
    providers: [],
    bootstrap: [MainComponent]
})
export class AppModule {

}
