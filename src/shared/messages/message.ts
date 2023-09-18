import { InitRequest } from './message-type/init';

export enum MessageAction {
    Init = 'init',
    Simulate = 'simulate'
}

export interface RequestData {
    [MessageAction.Init]: InitRequest;
    [MessageAction.Simulate]: void;
}

export interface ResponseData {
    [MessageAction.Init]: void;
    [MessageAction.Simulate]: void;
}

export type MessageRequest<K extends MessageAction> = { [P in K]: { action: K; data: RequestData[K] } }[K];

export type MessageResponse<K extends MessageAction> = {
    [P in K]: { action: K; data: ResponseData[K] };
}[K];

export type MessageRequestWithId<K extends MessageAction> = {
    [P in K]: { action: K; id: number; data: RequestData[K] };
}[K];

export type MessageResponseWithId<K extends MessageAction> = {
    [P in K]: { action: K; id: number; data: ResponseData[K] };
}[K];

export type MessageReturn<K extends MessageAction> = { [P in K]: ResponseData[K] }[K];

export type MessageCallback<K extends MessageAction> = (data: RequestData[K]) => Promise<MessageReturn<K>>;

export interface AcknowledgeError {
    message: string;
}

export type AcknowledgeResponse<TResult> = {
    isAcknowledge: boolean;
    id: number;
    error?: AcknowledgeError;
    result?: TResult;
};
