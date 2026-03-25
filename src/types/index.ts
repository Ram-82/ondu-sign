export interface ApiUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface CreateDocumentRequest {
  title: string;
}

export interface FieldInput {
  id?: string;
  type: "SIGNATURE" | "TEXT" | "DATE";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  recipientId?: string;
}

export interface RecipientInput {
  id?: string;
  email: string;
  name: string;
  order: number;
}

export interface SignatureInput {
  fieldId: string;
  value: string;
  type: "DRAWN" | "TYPED";
}
