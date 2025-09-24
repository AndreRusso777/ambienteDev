import { Document } from "@/types/document";
import { CheckCircle2, Download, Trash2, XCircleIcon, XIcon, PlusIcon, CheckCircle, FileClock, Circle } from "lucide-react";
import { useState } from "react";
import { FormState } from "@/types/form";
import Field from "@/components/ui/forms/field";
import FieldError from "@/components/ui/forms/field-error";
import FieldsWrapper from "@/components/ui/forms/fields-wrapper";
import Form from "@/components/ui/forms/form";
import TextInput from "@/components/ui/forms/inputs/text-input";
import Label from "@/components/ui/forms/label";
import Button from "@/components/ui/shared/button";
import Select from "../ui/forms/inputs/select";

interface Props {
  userId: number;
  userEmail: string;
  documents: Document[];
  onDocumentsChange?: () => void;
}

export default function UserDocumentsGrid({ userId, userEmail, documents, onDocumentsChange }: Props) {
  const [addDocModalOpen, setAddDocModalOpen] = useState<boolean>(false);
  const [addDocFormState, setAddDocFormState] = useState<FormState>();
  const [addDocFormLoading, setAddDocFormLoading] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("doc");

  const getStatusPriority = (document: Document): number => {
    if (document.path && document.approved !== 1) {
      return 1; // Aguardando
    }
    
    if (document.path && document.approved === 1) {
      return 3; // Aprovado
    }
    
    if ((document.type === "contract" || document.type === "poa" || document.type === "tax" || document.type === "hipo") && document.signed === 1) {
      return 4; // Assinado
    }

    return 2; // Pendente
  };

  const sortedDocuments = documents?.slice().sort((a, b) => {
    const priorityA = getStatusPriority(a);
    const priorityB = getStatusPriority(b);
    return priorityA - priorityB;
  }) || [];

  const handleAddDocument = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddDocFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;

    try {
      let response;
      
      // Para documentos enviados pela equipe (poa, tax, hipo), usar APIs específicas
      if (type === 'poa' || type === 'tax' || type === 'hipo') {
        const createDocResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ type, title, userId, userEmail })
        });

        const createDocData = await createDocResponse.json();
        
        if (!createDocResponse.ok || !createDocData.success) {
          setAddDocFormState(createDocData);
          setAddDocFormLoading(false);
          return;
        }

        const userResponse = await fetch(`/api/users/${userId}`, {
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
          }
        });

        if (!userResponse.ok) {
          setAddDocFormState({ 
            success: false, 
            errors: { global: { message: "Erro ao buscar dados do usuário" } }
          });
          setAddDocFormLoading(false);
          return;
        }

        const userData = await userResponse.json();
        const user = userData.data.user;

        let apiEndpoint = '';
        if (type === 'poa') {
          apiEndpoint = '/api/documents/power-of-attorney';
        } else if (type === 'tax') {
          apiEndpoint = '/api/documents/tax-declaration';
        } else if (type === 'hipo') {
          apiEndpoint = '/api/documents/hipossuficiency-declaration';
        }

        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user,
            documentId: createDocData.data.document.id
          })
        });
      } else {
        response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ type, title, userId, userEmail })
        });
      }

      const responseData = await response.json();
      
      setAddDocFormState(responseData);
      setAddDocFormLoading(false);
      
      if (responseData.success) {
        if (onDocumentsChange) {
          onDocumentsChange();
        }
        setSelectedDocType("doc");
        const form = e.currentTarget;
        if (form) {
          form.reset();
        }
      }
    } catch(err) {
      console.error('Ocorreu um erro inesperado ao tentar requisitar um novo documento para o usuário.', err);
      setAddDocFormLoading(false);
    }
  }
  
  const handleDownload = async (doc: Document) => {
    if(doc.token) {
      try {
        const response = await fetch(`/api/documents/download?token=${doc.token}`, {
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
          }
        });
  
        if (!response.ok) {
          console.error("Failed to fetch file");
          return;
        }

        const data = await response.json();

        const link = document.createElement("a");
        link.href = data.data.url;
        link.target = "_blank";
        link.download = data.data.name;
        link.click();

        return;
      } catch (error) {
        console.error("Error downloading the file:", error);
        return
      }
    }

    try {
      const response = await fetch(`/api/documents/download?filename=${doc.filename}&userId=${userId}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      if (!response.ok) {
        console.error("Failed to fetch file");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filenameSegments = doc.filename?.split('.') || [];
      const fileExtension = filenameSegments[(filenameSegments?.length - 1) || 1] || 'pdf';
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title}.${fileExtension}`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  }

  const handleDocumentApproval = async (doc: Document, approved: boolean) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ approved, userEmail })
      });

      if (!response.ok) {
        console.error("Failed to change document approval");
        return;
      }

      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (error) {
      console.error("Error while trying to change document approval status");
    }
  }

  const handleDelete = async () => {
    if(!documentToDelete) {
      console.error('Não foi possível encontrar o documento');
      return;
    };

    try {
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      if (!response.ok) {
        console.error("Failed to delete document.");
        return;
      }

      if (onDocumentsChange) {
        onDocumentsChange();
      }
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error while trying to delete the document");
    }
  }

  const handleCloseModal = () => {
    setAddDocModalOpen(false);
    setAddDocFormState(undefined);
    setSelectedDocType("doc");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <h3 className="text-xl font-medium">Documentos</h3>
        <button 
          type="button"
          className="group border rounded-md flex items-center justify-center p-1.5 cursor-pointer hover:border-slate-950 transition-colors space-x-2 text-sm leading-none"
          onClick={() => { setAddDocModalOpen(true); }}
        >
          <PlusIcon className="w-4 h-4 shrink-0"/>
          <span className="hidden md:block">Adicionar novo</span>
        </button>
      </div>
      
      {sortedDocuments?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {sortedDocuments.map((document: Document) => (
            <div key={document.id} className="border rounded-md p-2 space-y-2">
              <div className="flex items-center justify-between space-x-2 list-none appearance-none">
                <h2 className="md:text-xl font-medium leading-none flex-1">{document.title}</h2>
                {(document.type === "contract" || document.type === "poa" || document.type === "tax" || document.type === "hipo") ? (
                  <>
                    {document.signed === 1 ? (
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 border border-green-200">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                        <span className="text-green-700 font-medium text-xs">Assinado</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 border border-yellow-200">
                        <FileClock className="w-3 h-3 text-yellow-600 mr-1" />
                        <span className="text-yellow-700 font-medium text-xs">Pendente</span>
                      </div>
                    )}
                  </>
                ) : document.path ? (
                  <>
                    {document.approved === 1 ? (
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 border border-green-200">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                        <span className="text-green-700 font-medium text-xs">Aprovado</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 border border-yellow-200">
                        <FileClock className="w-4 h-4 text-yellow-600 mr-1" />
                        <span className="text-yellow-700 font-medium text-xs">Aguardando</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 border border-yellow-200">
                    <Circle className="w-3 h-3 text-yellow-600 mr-1" />
                    <span className="text-yellow-700 font-medium text-xs">Pendente</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end space-x-2">
                {document.path && document.approved !== 1 && (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Button onClick={() => { handleDocumentApproval(document, true) }} className="flex items-center text-sm justify-center space-x-2 border !bg-white !text-slate-950 hover:!border-green-500 hover:!text-green-700 transition-colors !py-0 h-8">
                      <CheckCircle2 className="w-4 h-auto shrink-0" />
                      <span>Aprovar</span>
                    </Button>
                    <Button onClick={() => {  handleDocumentApproval(document, false) }} className="flex items-center justify-center space-x-2 border !bg-white !text-slate-950 hover:!border-red-500 hover:!text-red-700 transition-colors !py-0 h-8">
                      <XCircleIcon className="w-4 h-auto shrink-0"/>
                      <span>Rejeitar</span>
                    </Button>
                  </div>
                )}
                {(document.path || document.token) && (    
                  <button 
                    type="button"
                    title="Baixar"
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                    onClick={() => { handleDownload(document); }}
                  >
                    <Download className="w-4" />
                  </button>
                )}
                <button 
                  type="button"
                  title="Deletar"
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                  onClick={() => { setDocumentToDelete(document); }}
                >
                  <Trash2 className="w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p className="text-base">Não existem documentos para este usuário.</p>
        </div>
      )}
      
      {/* Modal de Adicionar Documento */}
      {addDocModalOpen && (
        <div className="fixed top-0 left-0 w-full h-screen flex items-center justify-center opacity-100 pointer-events-auto transition-opacity ease-linear z-[60] px-4">
          <div 
            className="fixed top-0 left-0 w-full h-full bg-slate-950 bg-opacity-70 -z-10 cursor-default" 
            role="button" 
            onClick={handleCloseModal}
          ></div>
          <div className="relative w-full max-w-md border border-slate-200 rounded-lg grid gap-6 p-6 bg-white scale-100 transition-all ease-linear">
            <button 
              type="button"
              className="absolute top-2 right-2 w-6 h-6 border rounded-md hover:border-slate-950 flex items-center justify-center"
              onClick={handleCloseModal}
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="flex flex-col space-y-1.5">
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Adicionar documento
              </h1>
              <p className="text-sm font-normal text-slate-500">Faça nova requisição de documento ao usuário.</p>
              <p className="text-sm font-normal text-slate-500"><strong>OBS:</strong> O título do documento usado para renomear o arquivo na hora do download.</p>
            </div>
            <Form className="grid gap-6" onSubmit={handleAddDocument} state={addDocFormState}>
              <FieldsWrapper>
                <Field>
                  <Label htmlFor="type" title="Tipo" required />
                  <Select 
                    id="type"
                    name="type"
                    placeholder="Selecione o tipo"
                    options={[
                      {
                        value: "poa",
                        label: "Procuração"
                      },
                      {
                        value: "tax",
                        label: "Declaração Isento IRPF"
                      },
                      {
                        value: "hipo",
                        label: "Declaração de Hipossuficiência"
                      },
                      {
                        value: "doc",
                        label: "Documento"
                      }
                    ]}
                    selectedValue={selectedDocType}
                    onChange={setSelectedDocType}
                    required
                  />
                  <FieldError error={addDocFormState?.errors?.type} />
                </Field>
              </FieldsWrapper>
              <FieldsWrapper>
                <Field>
                  <Label htmlFor="title" title="Título" required />
                  <TextInput 
                    id="title"
                    name="title"
                    placeholder="Laudo, Comprovante de Residência..."
                    required
                  />
                  <FieldError error={addDocFormState?.errors?.title} />
                </Field>
              </FieldsWrapper>
              <Button 
                type="submit"
                className="w-full"
                loading={addDocFormLoading}
                disabled={addDocFormLoading}
              >
                <span>Adicionar documento</span>
              </Button>
            </Form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {documentToDelete && (
        <div className="fixed top-0 left-0 w-full h-screen flex items-center justify-center opacity-100 pointer-events-auto transition-opacity ease-linear z-[60] px-4">
          <div 
            className="absolute top-0 left-0 w-full h-full bg-slate-950 bg-opacity-70 -z-10 cursor-default" 
            role="button" 
            onClick={() => { setDocumentToDelete(null) }}
          ></div>
          <div className="relative w-full max-w-md border border-slate-200 rounded-lg grid gap-6 p-6 bg-white scale-100 transition-all ease-linear">
            <button 
              type="button"
              className="absolute top-2 right-2 w-6 h-6 border rounded-md hover:border-slate-950 flex items-center justify-center"
              onClick={() => { setDocumentToDelete(null) }}
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="flex flex-col space-y-1.5">
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Eliminar documento?
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-1">
                Tem certeza que deseja eliminar o documento "{documentToDelete?.title}" e todos os arquivos relacionados a ele?
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setDocumentToDelete(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                className="!bg-red-500 hover:!bg-red-600 flex-1" 
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
