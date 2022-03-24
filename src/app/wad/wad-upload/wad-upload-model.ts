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
