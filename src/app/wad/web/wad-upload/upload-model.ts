export type UploadInfo = {
	filePath: string;
	status: UploadStatus;
	file: File;
};

export enum UploadStatus {
	UPLOADED,
	FILE_ALREADY_EXISTS,
	UNSUPPORTED_TYPE
}
