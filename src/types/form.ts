export interface FormState {
  success?: boolean;
  status?: number;
  message?: string;
  errors: FormErrors
}

export interface FormErrors {
  [key: string]: {
    message: string;
  }
}