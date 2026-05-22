export class ErrorUnreachableAPI extends Error
{
    constructor(message: string)
    {
        super(message);
        this.name = "ErrorUnreachableAPI";
        Object.setPrototypeOf(this, ErrorUnreachableAPI.prototype);
    }
}

export class ErrorUnreachableEndPoint extends Error
{
    constructor(message: string)
    {
        super(message);
        this.name = "ErrorUnreachableEndPoint";
        Object.setPrototypeOf(this, ErrorUnreachableEndPoint.prototype);
    }
}