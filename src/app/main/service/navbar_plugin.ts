import {Type} from '@angular/core';

export class NavbarPluginFactory<CT extends NavbarPlugin<any>> {
	constructor(public readonly component: Type<CT>, public readonly data: any) {
	}
}

export interface NavbarPlugin<C> {
	setData(data: C): void;
}
