import { DocumentRequest } from "@/types/document-request";
import { useState, useEffect, useMemo } from "react";
import { Clock, CheckCircle, XCircle, MessageCircle, Eye, User, Download, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import Button from "../../ui/shared/button";
import TextArea from "../../ui/forms/inputs/text-area";
import Link from "next/link";
import UserType from "@/types/user";

interface Props {
  refreshTrigger?: number;
  currentAdmin: UserType;
  filters: FilterState;
}

interface FilterState {
  status: string;
  sortBy: 'newest' | 'oldest';
  clientName: string;
  dateFrom: string;
  dateTo: string;
}

export default function AdminDocumentRequestsList({ refreshTrigger, currentAdmin, filters }: Props) {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [selectedAction, setSelectedAction] = useState<'completed' | 'rejected' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showManageActions, setShowManageActions] = useState(false);

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [limitDropdownOpen, setLimitDropdownOpen] = useState<boolean>(false);
  const [totalRequests, setTotalRequests] = useState<number>(0);

  const fetchRequests = async () => {
    try {      
      const params = new URLSearchParams({
        admin: 'true',
        page: page.toString(),
        limit: rowsPerPage.toString()
      });

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.clientName.trim()) {
        params.append('clientName', filters.clientName.trim());
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }

      const url = `/api/document-requests?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setRequests(data.data.requests);
        setTotalRequests(data.data.totalRequests || data.data.requests.length);
      }
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedRequests = useMemo(() => {
    return requests;
  }, [requests]);

  const downloadFile = async (requestId: number, userId: number) => {
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
    } catch (err) {
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
      if (response.ok) {
        setSelectedRequest(data.data.request);
        setAdminMessage(data.data.request.admin_message || "");
        setSelectedAction(null);
        setShowManageActions(false);
      }
    } catch {}
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
          setRequests(prev => prev.map(req => 
            req.id === selectedRequest.id 
              ? { 
                  ...req, 
                  status: selectedAction, 
                  admin_message: adminMessage.trim(),
                  responded_by: currentAdmin.id,
                  responded_by_name: currentAdmin.first_name + (currentAdmin.last_name ? ` ${currentAdmin.last_name}` : '')
                }
              : req
          ));
          
          setSelectedRequest(null);
          setAdminMessage("");
          setSelectedAction(null);
          setShowManageActions(false);
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
          setRequests(prev => prev.map(req => 
            req.id === selectedRequest.id 
              ? { 
                  ...req, 
                  status: selectedAction, 
                  admin_message: adminMessage.trim(),
                  responded_by: currentAdmin.id,
                  responded_by_name: currentAdmin.first_name + (currentAdmin.last_name ? ` ${currentAdmin.last_name}` : '')
                }
              : req
          ));
          
          setSelectedRequest(null);
          setAdminMessage("");
          setSelectedAction(null);
          setShowManageActions(false);
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
        return <Clock className="w-4 h-4 text-yellow-600 min-w-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600 min-w-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600 min-w-4" />;
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
  }, [refreshTrigger, page, rowsPerPage]);

  useEffect(() => {
    setPage(1);
    fetchRequests();
  }, [filters.status, filters.clientName, filters.dateFrom, filters.dateTo, filters.sortBy]);

  if (loading) {
    return <div className="text-center py-8">Carregando solicitações...</div>;
  }

  return (
    <div className="space-y-6">
      {filteredAndSortedRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 space-y-2">
            <p className="text-lg">Nenhuma solicitação encontrada</p>
            {(filters.status !== 'all' || filters.clientName || filters.dateFrom || filters.dateTo) && (
              <p className="text-sm">Tente ajustar os filtros para ver mais resultados</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedRequests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(request.status)}
                      <h4 className="font-medium">{request.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border text-center ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    
                    {/* Motivo logo abaixo do status, se existir */}
                    {request.admin_message && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3 rounded-r-md">
                        <p className="text-sm text-blue-700">
                          <strong>Motivo:</strong> {request.admin_message}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-gray-600 text-sm mb-3">{request.message || 'Sem mensagem adicional'}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 min-w-3" />
                        <Link
                          href={`/admin/user/${request.user_id}`}
                          className="text-gray-500 hover:underline font-normal"
                        >
                          {(request as any).first_name} {(request as any).last_name}
                        </Link>
                      </div>
                      <span>•</span>
                      <span>Criada em {new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                      {request.responded_at && (
                        <>
                          <span>•</span>
                          <span>Respondida em {new Date(request.responded_at).toLocaleDateString('pt-BR')}</span>
                          {request.responded_by_name && (
                            <>
                              <span>•</span>
                              <span>por {request.responded_by_name}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    {/* Botão de download se há arquivo anexado */}
                    {request.has_attachment === 1 && request.file_name && (
                      <button 
                        type="button"
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                        onClick={() => downloadFile(request.id, request.user_id)}
                        title="Baixar"
                      >
                        <Download className="w-4" />
                      </button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchRequestDetails(request.id)}
                      className="flex-1 md:w-auto flex items-center justify-center space-x-1"
                    >
                      <span>Ver detalhes</span>
                    </Button>
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {filteredAndSortedRequests.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="text-center md:text-left text-sm text-slate-600 w-full md:w-fit order-2 md:order-1 mt-6 md:mt-0">
            Exibindo {Math.min(rowsPerPage, filteredAndSortedRequests.length)} de {totalRequests} solicitações
          </div>
          <div className="flex items-center justify-between md:justify-end space-x-6 order-1 md:order-2">
            <div className="flex items-center text-sm space-x-2">
              <div className="relative z-20">
                <button 
                  className={`flex items-center justify-center space-x-1 text-sm rounded-md border hover:border-slate-950 px-3 py-1 focus-visible:outline-none h-8 shadow-sm transition-colors`}
                  onClick={() => { setLimitDropdownOpen(!limitDropdownOpen) }}
                >
                  <span>{rowsPerPage}</span>
                  <ChevronDown className={limitDropdownOpen ? 'w-4 rotate-180' : 'w-4'} />
                </button>
                
                <div className={`absolute bottom-full left-0 pb-2 ${!limitDropdownOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} shadow-sm`}>
                  <div className={`w-max min-w-40 ${!limitDropdownOpen ? ' opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-100 ease-linear delay-100 border border-slate-200 bg-white rounded-md overflow-clip p-1`}>
                    <ul className="grid">
                      {Array.from({ length: 5 }, (_, i) => {
                        const num = (i + 1) * 5;
                        return (
                          <li key={i}>
                            <button 
                              type="button" 
                              className={`inline-flex items-center justify-between w-full text-sm rounded-md py-1.5 px-3 text-slate-950 hover:bg-slate-50 transition-colors duration-200 ease-linear text-left`}
                              onClick={() => {
                                setPage(1);
                                setRowsPerPage(num);
                                setLimitDropdownOpen(false);
                              }}
                            >
                              <span>{num}</span>
                              {rowsPerPage === num && <Check className="w-4" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
              <span>por página</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 disabled:hover:border-inherit disabled:opacity-50 border transition-colors focus-visible:outline-none space-x-1"
                onClick={() => { setPage(page - 1) }}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 disabled:hover:border-inherit disabled:opacity-50 border transition-colors focus-visible:outline-none space-x-1"
                onClick={() => { setPage(page + 1) }}
                disabled={page >= Math.ceil(totalRequests / rowsPerPage)}
              >
                <ChevronRight className="w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{selectedRequest.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliente: <Link 
                      href={`/admin/user/${selectedRequest.user_id}`}
                      className="text-gray-500 hover:text-gray-600"
                    >
                      {(selectedRequest as any).first_name} {(selectedRequest as any).last_name}
                    </Link>
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
                  <h4 className="font-medium mb-2">Mensagem da solicitação:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedRequest.message || 'Sem mensagem adicional'}</p>
                </div>

                {selectedRequest.admin_message && (
                  <div>
                    <h4 className="font-medium mb-2">Resposta atual:</h4>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                      <p className="text-blue-700">{selectedRequest.admin_message}</p>
                    </div>
                  </div>
                )}

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
                        onClick={() => downloadFile(selectedRequest.id, selectedRequest.user_id)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
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

                {selectedRequest.status === 'pending' && (
                  <div className="pt-4 border-t space-y-4">
                    <div>
                      <h4 className="font-medium mb-3 text-center">Responder solicitação</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setSelectedAction('completed');
                            setShowManageActions(true);
                          }}
                          className={`flex items-center text-sm justify-center space-x-2 border transition-colors !py-0 h-8 ${
                            selectedAction === 'completed'
                              ? '!text-green-700 !border-green-500'
                              : 'hover:!text-green-700 hover:!border-green-500'
                          }`}
                        >
                          <CheckCircle className="w-4 h-auto shrink-0" />
                          <span className="font-medium">Aprovar</span>
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAction('rejected');
                            setShowManageActions(true);
                          }}
                          className={`flex items-center justify-center space-x-2 border transition-colors !py-0 h-8 ${
                            selectedAction === 'rejected'
                              ? '!text-red-700 !border-red-500'
                              : 'hover:!text-red-700 hover:!border-red-500'
                          }`}
                        >
                          <XCircle className="w-4 h-auto shrink-0"/>
                          <span className="font-medium">Rejeitar</span>
                        </Button>
                      </div>
                    </div>

                    {showManageActions && selectedAction && (
                      <>
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
                            onClick={() => {
                              setShowManageActions(false);
                              setSelectedAction(null);
                              setAdminMessage(selectedRequest.admin_message || "");
                            }}
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}