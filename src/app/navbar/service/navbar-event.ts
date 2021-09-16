import {IEvent} from 'ngrx-event-bus';

export class NavbarEvent implements IEvent {
	/** Event Data: NavbarPluginFactory */
	public static SET_NAVBAR_PLUGIN = 'SET_NAVBAR_PLUGIN';
}
