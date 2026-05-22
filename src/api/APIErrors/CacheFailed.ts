export class ErrorCacheFailed extends Error
{
    constructor(message: string)
    {
        super(message);
        this.name = "ErrorCacheFailed";
        Object.setPrototypeOf(this, ErrorCacheFailed.prototype);
    }
}