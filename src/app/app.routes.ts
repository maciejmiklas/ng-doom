import {Routes} from '@angular/router';
import {WadUploadComponent} from "./wad/wad-upload/wad-upload.component";

export const routes: Routes = [
  {
    path: '',
    component: WadUploadComponent
  },
  {
    path: 'wad',
    loadChildren: () => import('./wad/wad.routes').then(m => m.routes)
  },
  {
    path: 'game',
    loadChildren: () => import('./game/game.routes').then(m => m.routes)
  }
];
