import {Wad} from '../parser/wad_model';

export type WadEntry = {
	wad: Wad;
	name: string;
	gameSave: GameSave[];
};

export type GameSave = {
	name: string;
};

export type UploadResult = {
	fileName: string;
	status: UploadStatus;
	message: string | undefined;
};

export enum UploadStatus {
	UPLOADED = 'Upload successful',
	FILE_ALREADY_EXISTS = 'File already exists',
	UNSUPPORTED_TYPE = 'File extension not supported',
	PARSE_ERROR = 'Parse error'
}
