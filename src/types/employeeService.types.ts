export interface EmployeeServiceAssignment {
    id: number;
    employeeId: number;
    employeeName: string;
    serviceId: number;
    serviceName: string;
    isEnabled: boolean;
}

export interface AssignServiceRequest {
    employeeId: number;
    serviceId: number;
}

export interface AssignServiceResponse {
    id: number;
}

export interface ServiceEmployee {
    employeeId: number;
    employeeName: string;
    employeeType: string;
}