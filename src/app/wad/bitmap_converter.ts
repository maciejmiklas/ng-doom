import {PatchBitmap} from './wad_model';

const toImageData = (bitmap: PatchBitmap): ImageData => {
	/*
	const arr = new Uint8ClampedArray(bitmap.header.width * bitmap.header.height * 4);
	for (let i = 0; i < arr.length; i += 4) {
			arr[i + 0] = 0;    // R value
			arr[i + 1] = 190;  // G value
			arr[i + 2] = 0;    // B value
			arr[i + 3] = 255;  // A value
	}*/
	return new ImageData(bitmap.imageData, bitmap.header.width, bitmap.header.height);
};

export const functions = {
	toImageData
};
