export class StorageError extends Error {
	constructor(message: string, cause?: Error) {
		super(message);
		this.name = "StorageError";
		if (cause) {
			this.cause = cause;
		}
	}
}
