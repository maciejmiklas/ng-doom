import {Routes} from '@angular/router';

export const routes: Routes = [
	{
		path: 'play',
		loadComponent: () => import('./play/play.component').then(m => m.PlayComponent)
	},
	{
		path: 'load',
		loadComponent: () => import('../common/empty/empty.component').then(m => m.EmptyComponent),
	},
	{
		path: 'save',
		loadComponent: () => import('../common/empty/empty.component').then(m => m.EmptyComponent),
	},
	{
		path: 'manage',
		loadComponent: () => import('../common/empty/empty.component').then(m => m.EmptyComponent),
	},

];
