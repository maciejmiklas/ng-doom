import {IEvent} from 'ngrx-event-bus';

export class WadTitleImgEvent implements IEvent {

	/** Event Data: number (zoom level) */
	public static ZOOM_CHANGED = 'WTI_ZOOM_CHANGED';

	/** Event Data: sting (image name) */
	public static IMG_CHANGED = 'WTI_IMG_CHANGED';

	/** Event Data: none */
	public static CAROUSEL_PAUSE = 'WTI_CAROUSEL_PAUSE';

}
