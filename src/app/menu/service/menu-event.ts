import {IEvent} from 'ngrx-event-bus';

export class MenuEvent implements IEvent {

	/** Event Data: MenuState */
	public static MENU_SELECTED = 'MENU_SELECTED';

}
