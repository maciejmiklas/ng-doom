import {IEvent} from 'ngrx-event-bus';

export class WadEvent implements IEvent {

	/** Event Data: UploadResult */
	public static WAD_UPLOAD = 'WAD_UPLOAD';
}
