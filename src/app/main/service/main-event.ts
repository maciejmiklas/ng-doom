import {IEvent} from 'ngrx-event-bus';

export class MainEvent implements IEvent {
	/** Event Data: NavbarPluginFactory */
	public static SET_NAVBAR_PLUGIN = 'SET_NAVBAR_PLUGIN';

	/** Event Data: value for x-overflow on .app-main */
	public static SET_MAIN_OVERFLOW = 'SET_MAIN_OVERFLOW';
}
