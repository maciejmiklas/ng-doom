import {IEvent} from 'ngrx-event-bus';

export class Event implements IEvent {
	/** Event Data: UploadResult */
	public static WAD_UPLOAD = 'WAD_UPLOAD';

	/** Event Data: MenuState */
	public static MENU_SELECTED = 'MENU_SELECTED';

	/** Event Data: NavbarPluginFactory */
	public static SET_NAVBAR_PLUGIN = 'SET_NAVBAR_PLUGIN';
}
