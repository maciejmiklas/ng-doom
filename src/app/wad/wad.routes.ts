import {Routes} from '@angular/router';
import {WadUploadComponent} from "./wad-upload/wad-upload.component";

export const routes: Routes = [
	{
		path: '',
		component: WadUploadComponent
	},
	{
		path: 'title_img',
		loadComponent: ()=>import('../common/empty/empty.component').then(m => m.EmptyComponent),
	},
	{
		path: 'sprites',
		loadComponent: ()=>import('./wad-sprites/wad-sprites.component').then(m => m.WadSpritesComponent)
	},
	{
		path: 'patches',
		loadComponent: ()=>import('./wad-patches/wad-patches.component').then(m => m.WadPatchesComponent)
	},
	{
		path: 'flats',
		loadComponent: ()=>import('./wad-flats/wad-flats.component').then(m => m.WadFlatsComponent)
	},
	{
		path: 'textures',
		loadComponent:() => import('./wad-textures/wad-textures.component').then(m => m.WadTexturesComponent)
	},
	{
		path: 'playpal',
		loadComponent: ()=>import('../common/empty/empty.component').then(m => m.EmptyComponent),
	},
	{
		path: 'upload',
		loadComponent:()=>import('./wad-upload/wad-upload.component').then(m => m.WadUploadComponent)
	},
	{
		path: 'dirs',
		loadComponent:()=>import('./wad-dirs/wad-dirs.component').then(m => m.WadDirsComponent)
	},
	{
		path: 'list',
		loadComponent: ()=>import('../common/empty/empty.component').then(m => m.EmptyComponent),
	},
	{
		path: 'select',
		loadComponent: ()=>import('../common/empty/empty.component').then(m => m.EmptyComponent),
	},
	{
		path: 'maps',
		loadComponent: ()=>import('./wad-map/wad-map.component').then(m => m.WadMapComponent)
	}
];
