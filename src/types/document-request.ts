export interface DocumentRequest {
  id: number;
  user_id: number;
  title: string;
  message?: string;
  document_type?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_mime_type?: string;
  
  // Status e controle
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  has_attachment: 0 | 1;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Resposta administrativa
  admin_message?: string;
  responded_by?: number;
  responded_by_name?: string;
  responded_at?: string;
  
  // Dados do usuário (quando JOIN é feito)
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface DocumentRequestResponse {
  id: number;
  request_id: number;
  message: string;
  created_at: string;
  user_type: 'admin' | 'user';
}