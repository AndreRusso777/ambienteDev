import { DocumentRequest } from "@/types/document-request";
import User from "@/types/user";
import { useState, useEffect } from "react";
import { Clock, MessageCircle, RefreshCw, Download, FileCheck2, FileX2 } from "lucide-react";
import Button from "../ui/shared/button";

interface Props {
  user: User;
  refreshTrigger?: number;
}

export default function DocumentRequestsList({ user, refreshTrigger }: Props) {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/document-requests?userId=${user.id}&nocache=true`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setRequests(data.data.requests);
      }
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId: number) => {
    try {
      const response = await fetch(`/api/document-requests/${requestId}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSelectedRequest(data.data.request);
      } else {
        alert('Erro ao buscar detalhes da solicitação');
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
      alert('Erro de conexão ao buscar detalhes da solicitação');
    }
  };

  const downloadFile = async (requestId: number) => {
    try {
      const response = await fetch(`/api/document-requests/download?requestId=${requestId}&userId=${user.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || `documento_${requestId}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao fazer download do arquivo');
      }
    } catch (err) {
      console.error('Erro ao fazer download:', err);
      alert('Erro de conexão ao fazer download do arquivo');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 min-w-4" />;
      case 'completed':
        return <FileCheck2  className="w-4 h-4 text-green-600 min-w-4" />;
      case 'rejected':
        return <FileX2  className="w-4 h-4 text-red-600 min-w-4" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600 min-w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Aguardando resposta';
      case 'completed':
        return 'Aprovada';
      case 'rejected':
        return 'Rejeitada';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  if (loading) {
    return <div className="text-center py-8">Carregando solicitações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium">Suas Solicitações</h3>
          
          {/* Botão de refresh */}
          <button
            onClick={fetchRequests}
            className="flex items-center justify-center w-[38px] h-[38px] md:w-auto md:h-auto md:px-3 md:py-2 md:space-x-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Atualizar</span>
          </button>
        </div>
        
        <p className="text-gray-500">
          Acompanhe o status de suas solicitações.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Você ainda não fez nenhuma solicitação.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(request.status)}
                    <h4 className="font-medium">{request.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-center text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  
                  {/* Mostrar motivo se existir */}
                  {request.message && (
                    <p className="text-gray-600 text-sm mb-2">{request.message}</p>
                  )}
                  
                  {/* Mostrar resposta da equipe se existir */}
                  {request.admin_message && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg mb-2">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Resposta da equipe:</span> {request.admin_message}
                      </p>
                    </div>
                  )}
                  
                    <div className="flex items-center text-xs text-gray-400">
                    <span>Criada em {new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                    {request.responded_at && (request.status === 'completed' || request.status === 'rejected') && (
                      <>
                      <span className="mx-2">•</span>
                      <span>Respondida em {new Date(request.responded_at).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                    </div>
                </div>
                <div className="w-full md:w-auto flex flex-row gap-2">
                  {/* Botão de download se há arquivo anexado */}
                  {request.has_attachment === 1 && request.file_name && (
                    <button
                      title="Baixar"
                      type="button"
                      onClick={() => downloadFile(request.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                    >
                      <Download className="w-4 text-black" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedRequest.title}</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusIcon(selectedRequest.status)}
                <span className="text-sm text-gray-600">
                  {getStatusText(selectedRequest.status)}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Sua Solicitação:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedRequest.message || 'Sem mensagem adicional'}</p>
                </div>

                {selectedRequest.admin_message && (
                  <div>
                    <h4 className="font-medium mb-2">Resposta da equipe:</h4>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <p className="text-blue-700">{selectedRequest.admin_message}</p>
                    </div>
                  </div>
                )}

                {/* Seção de arquivo anexado */}
                {selectedRequest.has_attachment === 1 && selectedRequest.file_name && (
                  <div>
                    <h4 className="font-medium mb-2">Arquivo Enviado:</h4>
                    <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{selectedRequest.file_name}</p>
                        <p className="text-xs text-gray-500">
                          Tamanho: {selectedRequest.file_size ? `${(selectedRequest.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => downloadFile(selectedRequest.id)}
                        className="flex items-center justify-center"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-4 border-t">
                  <div className="flex items-center text-xs text-gray-500">
                    <span>Criada em: {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}</span>
                    {selectedRequest.responded_at && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Respondida em: {new Date(selectedRequest.responded_at).toLocaleString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}