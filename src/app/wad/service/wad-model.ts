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
};

export enum UploadStatus {
	UPLOADED,
	FILE_ALREADY_EXISTS,
	UNSUPPORTED_TYPE,
	PARSE_ERROR
}
