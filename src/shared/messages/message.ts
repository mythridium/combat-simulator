import { InitRequest } from './message-type/init';
import { SimulateRequest, SimulateResponse } from './message-type/simulate';
import { StateRequest, StateResponse } from './message-type/state';

export enum MessageAction {
    Init = 'init',
    State = 'state',
    Simulate = 'simulate'
}

export interface RequestData {
    [MessageAction.Init]: InitRequest;
    [MessageAction.State]: StateRequest;
    [MessageAction.Simulate]: SimulateRequest;
}

export interface ResponseData {
    [MessageAction.Init]: void;
    [MessageAction.State]: StateResponse;
    [MessageAction.Simulate]: SimulateResponse;
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
    stack: string;
}

export type AcknowledgeResponse<TResult> = {
    isAcknowledge: boolean;
    id: number;
    error?: AcknowledgeError;
    result?: TResult;
};
