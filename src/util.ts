export interface Message {
	method: string,
	params: any
}

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function createMessage(method: string, params: any): Message{
	let message = {
		method: method,
		params: params
	};
	return message;
}