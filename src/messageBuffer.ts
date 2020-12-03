export class MessageBuffer {

    private buffer: string;
    constructor(
        private delimiter: string
    )
    {
        this.buffer = "";
    }

    public isFinished(): boolean
    {
        if(this.buffer.length === 0 || this.buffer.indexOf(this.delimiter) === -1) {
            return true;
        }
        else {
            return false;
        }
    }

    public push(data: string) {
        this.buffer += data;
    }

    public getMessage(): string {
        const delimiterIndex = this.buffer.indexOf(this.delimiter);
        if (delimiterIndex !== -1) {
            const message = this.buffer.slice(0, delimiterIndex);
            this.buffer = this.buffer.replace(message + this.delimiter, "");
            return message;
        }
        return "";
    }
}