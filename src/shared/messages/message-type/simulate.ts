export interface SimulateRequest {
    monsterId: string;
    dungeonId: string;
}

export interface SimulateResponse {
    isSuccess: boolean;
    error?: string;
}
