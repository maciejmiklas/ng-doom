import {IEvent} from 'ngrx-event-bus';

export class Event implements IEvent {
	/** Event Type: UploadResult */
	public static WAD_UPLOAD = 'WAD_UPLOAD';
}
