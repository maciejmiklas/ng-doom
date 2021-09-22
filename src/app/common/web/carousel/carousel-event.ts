import {IEvent} from 'ngrx-event-bus';

export class CarouselEvent implements IEvent {

	/** Event Data: number (zoom level) */
	public static ZOOM_CHANGED = 'CNP_ZOOM_CHANGED';

	/** Event Data: sting (image name) */
	public static IMG_CHANGED = 'CNP_IMG_CHANGED';

	/** Event Data: none */
	public static CAROUSEL_PAUSE = 'CNP_CAROUSEL_PAUSE';

}
