import { DocumentRequest } from "@/types/document-request";
import { Clock, FileClock, CheckCircle, XCircle, MessageCircle, FileText, Download, EllipsisVertical } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/shared/button";
import TextArea from "@/components/ui/forms/inputs/text-area";
import User from "@/types/user";

interface Props {
  userId: number;
  userFirstName: string;
  userLastName: string;
  requests: DocumentRequest[];
  loadingRequests: boolean;
  onRequestUpdate: (updatedRequest: DocumentRequest) => void;
  onDocumentCreated?: () => void;
  currentAdmin: User;
}

export default function UserDocumentRequestsGrid({ 
  userId, 
  userFirstName, 
  userLastName, 
  requests: serverRequests, 
  loadingRequests,
  onRequestUpdate,
  onDocumentCreated,
  currentAdmin
}: Props) {
  const [requests, setRequests] = useState<DocumentRequest[]>(serverRequests || []);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [selectedAction, setSelectedAction] = useState<'completed' | 'rejected' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showManageActions, setShowManageActions] = useState(false);

  useEffect(() => {
    setRequests(serverRequests || []);
  }, [serverRequests]);

  const getStatusPriority = (status: string): number => {
    switch (status) {
      case 'pending':
        return 1;
      case 'rejected':
        return 2;
      case 'in_progress':
        return 3;
      case 'completed':
        return 4;
      default:
        return 5;
    }
  };

  const sortedRequests = requests?.slice().sort((a, b) => {
    const priorityA = getStatusPriority(a.status);
    const priorityB = getStatusPriority(b.status);
    return priorityA - priorityB;
  }) || [];

  const downloadFile = async (requestId: number) => {
    try {
      const response = await fetch(`/api/document-requests/download?requestId=${requestId}&userId=${userId}`, {
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
    } catch {
      alert('Erro de conexão ao fazer download do arquivo');
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
        setAdminMessage(data.data.request.admin_message || "");
        setSelectedAction(null);
        setShowManageActions(false);
      } else {
        alert('Erro ao buscar detalhes da solicitação');
      }
    } catch {
      alert('Erro de conexão ao buscar detalhes da solicitação');
    }
  };

  const handleConfirm = async () => {
    if (!selectedRequest || !selectedAction) return;

    setUpdatingStatus(true);
    try {
      if (selectedAction === 'completed') {
        const response = await fetch('/api/document-requests/approve', {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requestId: selectedRequest.id,
            adminMessage: adminMessage.trim(),
            respondedBy: {
              id: currentAdmin.id,
              name: currentAdmin.first_name
            }
          })
        });

        if (response.ok) {
          const updatedRequest = { 
            ...selectedRequest, 
            status: selectedAction, 
            admin_message: adminMessage.trim() 
          };
          
          setRequests(prev => prev.map(req => 
            req.id === selectedRequest.id 
              ? { 
                  ...req, 
                  status: selectedAction, 
                  admin_message: adminMessage.trim(),
                  responded_by: currentAdmin.id,
                  responded_by_name: currentAdmin.first_name
                }
              : req
          ));
          
          onRequestUpdate(updatedRequest);
          
          if (onDocumentCreated) {
            onDocumentCreated();
          }
          
          handleCloseModal();
        } else {
          const errorData = await response.json();
          alert(errorData.errors?.global?.message || 'Erro ao aprovar solicitação');
        }
      } else {
        const response = await fetch('/api/document-requests', {
          method: 'PUT',
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requestId: selectedRequest.id,
            status: selectedAction,
            adminMessage: adminMessage.trim(),
            respondedBy: {
              id: currentAdmin.id,
              name: currentAdmin.first_name
            }
          })
        });

        if (response.ok) {
          const updatedRequest = { 
            ...selectedRequest, 
            status: selectedAction, 
            admin_message: adminMessage.trim() 
          };
          setSelectedRequest(updatedRequest);
          
          setRequests(prev => prev.map(req => 
            req.id === selectedRequest.id 
              ? { 
                  ...req, 
                  status: selectedAction, 
                  admin_message: adminMessage.trim(),
                  responded_by: currentAdmin.id,
                  responded_by_name: currentAdmin.first_name
                }
              : req
          ));
          
          onRequestUpdate(updatedRequest);
          
          handleCloseModal();
        } else {
          const errorData = await response.json();
          alert(errorData.errors?.adminMessage?.message || 'Erro ao atualizar status');
        }
      }
    } catch {
      alert('Erro de conexão ao atualizar status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setAdminMessage("");
    setSelectedAction(null);
    setShowManageActions(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FileClock className="w-4 h-4 text-yellow-600 mr-1" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600 mr-1" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600 mr-1" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600 mr-1" />;
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

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium flex items-center space-x-2">
        <FileText className="w-5 h-5" />
        <span>Solicitações de Documentos</span>
      </h3>
      
      {loadingRequests ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          Carregando solicitações...
        </div>
      ) : !sortedRequests || sortedRequests.filter(req => req.status !== 'completed').length === 0 ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          Este cliente ainda não fez nenhuma solicitação pendente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {sortedRequests.filter(req => req.status !== 'completed').map((request) => (
            <div key={request.id} className="border rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between space-x-2">
                <h2 className="md:text-xl font-medium leading-none flex-1">{request.title}</h2>
                <div className={`inline-flex items-center px-2 py-1 rounded-md border ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span className="font-medium text-xs">
                    {getStatusText(request.status)}
                  </span>
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                {request.status === 'pending' && (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => {
                        setSelectedRequest(request);
                        setSelectedAction('completed');
                        setAdminMessage("");
                        setShowManageActions(true);
                      }}
                      className={`flex items-center text-sm justify-center space-x-2 border transition-colors !py-0 h-8 ${
                        selectedRequest?.status === 'completed'
                          ? 'border-green-500 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:!border-green-500 hover:text-green-700'
                      }`}
                    >
                      <CheckCircle className="w-4 h-auto shrink-0" />
                      <span>Aprovar</span>
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedRequest(request);
                        setSelectedAction('rejected');
                        setAdminMessage("");
                        setShowManageActions(true);
                      }}
                      className={`flex items-center justify-center space-x-2 border transition-colors !py-0 h-8 ${
                        selectedRequest?.status === 'completed'
                          ? 'border-red-500 text-red-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:!border-red-500 hover:text-red-700'
                      }`}
                    >
                      <XCircle className="w-4 h-auto shrink-0"/>
                      <span>Rejeitar</span>
                    </Button>
                  </div>
                )}
                {/* Botão de download se há arquivo anexado */}
                {request.has_attachment === 1 && request.file_name && (
                  <button 
                    type="button"
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                    onClick={() => downloadFile(request.id)}
                    title="Baixar"
                  >
                    <Download className="w-4" />
                  </button>
                )}
                <button
                  type="button"
                  title="Ver Detalhes"
                  onClick={() => fetchRequestDetails(request.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                >
                  <EllipsisVertical className="w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes da Solicitação - Simplificado para gerenciamento */}
      {selectedRequest && showManageActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{selectedRequest.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliente: {userFirstName} {userLastName}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Mensagem da Solicitação:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedRequest.message || 'Sem mensagem adicional'}</p>
                </div>

                {selectedRequest.has_attachment === 1 && selectedRequest.file_name && (
                  <div>
                    <h4 className="font-medium mb-2">Arquivo enviado:</h4>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-gray-600 font-medium">{selectedRequest.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {((selectedRequest.file_size || 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFile(selectedRequest.id)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-4 border-t">
                  <span>Criada em: {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}</span>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-center">
                      {selectedAction === 'completed' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                    </h4>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      {`Escreva o motivo da 
                        ${selectedAction === 'completed' 
                          ? 'aprovação'
                          : 'rejeição'
                        }`
                      }
                    </p>
                  </div>

                  <div>
                    <TextArea
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      placeholder="Escreva sua mensagem aqui..."
                      rows={4}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={updatingStatus}
                      className={`flex-1 ${
                        selectedAction === 'completed'
                          ? 'bg-green-600 hover:bg-green-700 hover:!border-green-700'
                          : 'bg-red-600 hover:bg-red-700 hover:!border-red-700'
                      } text-black hover:text-white`}
                      loading={updatingStatus}
                    >
                      {selectedAction === 'completed' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Detalhes (somente leitura) */}
      {selectedRequest && !showManageActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{selectedRequest.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliente: {userFirstName} {userLastName}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                {getStatusIcon(selectedRequest.status)}
                <span
                  className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full
                    text-center text-xs font-medium border 
                    ${getStatusColor(selectedRequest.status)}`
                  }
                >
                  {getStatusText(selectedRequest.status)}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Mensagem da solicitação:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedRequest.message || 'Sem mensagem adicional'}</p>
                </div>

                {selectedRequest.admin_message && (
                  <div>
                    <h4 className="font-medium mb-2">Resposta:</h4>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <p className="text-blue-700">{selectedRequest.admin_message}</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <span>Criada em: {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}</span>
                    {selectedRequest.responded_at && (
                      <span>Respondida em: {new Date(selectedRequest.responded_at).toLocaleString('pt-BR')}
                        {selectedRequest.responded_by_name && ` por ${selectedRequest.responded_by_name}`}
                      </span>
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
