export interface EmployeeDocument {
  id: string;
  companyId: string;
  employeeId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentPayload {
  documentType: string;
  fileName: string;
  mimeType: string;
  fileDataBase64: string;
}
