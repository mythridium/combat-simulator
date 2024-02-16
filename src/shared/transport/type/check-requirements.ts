export interface CheckRequirementsRequest {
    requirements: AnyRequirementData[];
    notifyOnFailure?: boolean;
    slayerLevelReq?: number;
    checkSlayer?: boolean;
}
