import {Injectable} from '@angular/core';
import {Either} from '@maciejmiklas/functional-ts';

@Injectable({
	providedIn: 'root'
})
export class AppSetupService {

	constructor() {
	}

	setup(): void {
		Either.enableLog(false);
	}
}
