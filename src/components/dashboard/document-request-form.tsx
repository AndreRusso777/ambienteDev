import { FormState } from "@/types/form";
import { useRef, useState, useEffect } from "react";
import Button from "../ui/shared/button";
import Label from "../ui/forms/label";
import TextArea from "../ui/forms/inputs/text-area";
import DocumentSelect from "../ui/forms/inputs/document-select";
import FieldError from "../ui/forms/field-error";
import User from "@/types/user";
import { DOCUMENT_TEMPLATES } from "@/constants/documents";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Document } from "@/types/document";

interface Props {
  user: User;
  onSuccess?: () => void;
}

export default function DocumentRequestForm({ user, onSuccess }: Props) {
  const [formState, setFormState] = useState<FormState>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [poaDocument, setPoaDocument] = useState<Document | null>(null);
  const [taxDocument, setTaxDocument] = useState<Document | null>(null);
  const [hipoDocument, setHipoDocument] = useState<Document | null>(null);
  const [loadingPoa, setLoadingPoa] = useState<boolean>(false);
  const [loadingTax, setLoadingTax] = useState<boolean>(false);
  const [loadingHipo, setLoadingHipo] = useState<boolean>(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPoaDocument = async () => {
      setLoadingPoa(true);
      try {
        const response = await fetch(`/api/documents?userId=${user.id}&type=poa`, {
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          setPoaDocument(responseData.data.document);
        }
      } catch (error) {
        console.error('Erro ao buscar documento de procuração:', error);
      } finally {
        setLoadingPoa(false);
      }
    };

    fetchPoaDocument();
  }, [user.id]);

  useEffect(() => {
    const fetchTaxDocument = async () => {
      setLoadingTax(true);
      try {
        const response = await fetch(`/api/documents?userId=${user.id}&type=tax`, {
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          setTaxDocument(responseData.data.document);
        }
      } catch (error) {
        console.error('Erro ao buscar documento de declaração IRPF:', error);
      } finally {
        setLoadingTax(false);
      }
    };

    fetchTaxDocument();
  }, [user.id]);

  useEffect(() => {
    const fetchHipoDocument = async () => {
      setLoadingHipo(true);
      try {
        const response = await fetch(`/api/documents?userId=${user.id}&type=hipo`, {
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          setHipoDocument(responseData.data.document);
        }
      } catch (error) {
        console.error('Erro ao buscar documento de declaração de hipossuficiência:', error);
      } finally {
        setLoadingHipo(false);
      }
    };

    fetchHipoDocument();
  }, [user.id]);

  const isPoaSelectable = () => {
    if (loadingPoa) return true;
    return !poaDocument;
  };

  const isTaxSelectable = () => {
    if (loadingTax) return true;
    return !taxDocument;
  };

  const isHipoSelectable = () => {
    if (loadingHipo) return true;
    return !hipoDocument;
  };

  const getPoaStatus = () => {
    if (!poaDocument) return null;
    
    if (poaDocument.signed === 1) {
      return {
        type: 'signed',
        message: 'Procuração já foi assinada',
        icon: CheckCircle,
        color: 'green'
      };
    } else {
      return {
        type: 'pending',
        message: 'Procuração já foi enviada e está pendente de assinatura',
        icon: AlertCircle,
        color: 'yellow'
      };
    }
  };

  const getTaxStatus = () => {
    if (!taxDocument) return null;
    
    if (taxDocument.signed === 1) {
      return {
        type: 'signed',
        message: 'Declaração IRPF já foi assinada',
        icon: CheckCircle,
        color: 'green'
      };
    } else {
      return {
        type: 'pending',
        message: 'Declaração IRPF já foi enviada e está pendente de assinatura',
        icon: AlertCircle,
        color: 'yellow'
      };
    }
  };

  const getHipoStatus = () => {
    if (!hipoDocument) return null;
    
    if (hipoDocument.signed === 1) {
      return {
        type: 'signed',
        message: 'Declaração de hipossuficiência já foi assinada',
        icon: CheckCircle,
        color: 'green'
      };
    } else {
      return {
        type: 'pending',
        message: 'Declaração de hipossuficiência já foi enviada e está pendente de assinatura',
        icon: AlertCircle,
        color: 'yellow'
      };
    }
  };

  const handleFilename = (e: React.FormEvent<HTMLInputElement>) => {
    let name: string = e.currentTarget.files?.length === 1 ? e.currentTarget.files[0].name.slice(0, 25) : "";

    if(name?.length === 25) {
      name += '...';
    }

    if(!name) return;

    setFilename(name);
  }

  const handleDocumentChange = (value: string) => {
    const index = parseInt(value);
    const template = index >= 0 && index < DOCUMENT_TEMPLATES.length ? DOCUMENT_TEMPLATES[index] : null;
    
    if (template?.label === "Procuração" && !isPoaSelectable()) {
      return;
    }

    if (template?.label === "Declaração Isento IRPF" && !isTaxSelectable()) {
      return;
    }
    
    setSelectedDocument(value);
    if (template) {
      setCustomTitle(template.label);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const index = parseInt(selectedDocument);
    const selectedTemplate = index >= 0 && index < DOCUMENT_TEMPLATES.length ? DOCUMENT_TEMPLATES[index] : null;
    const title = selectedTemplate?.label || "";
    const message = formData.get('message') as string;

    if (selectedTemplate?.label === "Procuração" && poaDocument) {
      setFormState({
        success: false,
        errors: { 
          documentType: { 
            message: poaDocument.signed === 1 
              ? 'Procuração já foi assinada' 
              : 'Procuração já foi enviada e está pendente de assinatura'
          } 
        }
      });
      setIsLoading(false);
      return;
    }

    if (selectedTemplate?.label === "Declaração Isento IRPF" && taxDocument) {
      setFormState({
        success: false,
        errors: { 
          documentType: { 
            message: taxDocument.signed === 1 
              ? 'Declaração IRPF já foi assinada' 
              : 'Declaração IRPF já foi enviada e está pendente de assinatura'
          } 
        }
      });
      setIsLoading(false);
      return;
    }

    if (selectedTemplate?.label === "Declaração de Hipossuficiência" && hipoDocument) {
      setFormState({
        success: false,
        errors: { 
          documentType: { 
            message: hipoDocument.signed === 1 
              ? 'Declaração de hipossuficiência já foi assinada' 
              : 'Declaração de hipossuficiência já foi enviada e está pendente de assinatura'
          } 
        }
      });
      setIsLoading(false);
      return;
    }

    const requiresFile = selectedTemplate?.isRequired !== false;

    if (requiresFile && !fileInput.current?.files?.[0]) {
      setFormState({
        success: false,
        errors: { file: { message: 'Selecione um arquivo para enviar' } }
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/document-requests', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: 'create',
          userId: user.id,
          title,
          message,
          documentType: selectedDocument
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        if (requiresFile && fileInput.current?.files?.[0]) {
          setUploading(true);
          const uploadFormData = new FormData();
          uploadFormData.append('file', fileInput.current.files[0]);
          uploadFormData.append('userId', user.id.toString());
          uploadFormData.append('requestId', responseData.data.requestId.toString());
          uploadFormData.append('documentType', selectedDocument);

          try {
            const uploadResponse = await fetch('/api/document-requests/upload-temp', {
              method: 'POST',
              headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
              },
              body: uploadFormData
            });

            if (!uploadResponse.ok) {
              console.error('Erro ao fazer upload do arquivo');
              setFormState({
                success: false,
                errors: { file: { message: 'Erro ao enviar arquivo' } }
              });
              setIsLoading(false);
              setUploading(false);
              return;
            }
          } catch (uploadError) {
            console.error('Erro no upload:', uploadError);
            setFormState({
              success: false,
              errors: { file: { message: 'Erro ao enviar arquivo' } }
            });
            setIsLoading(false);
            setUploading(false);
            return;
          } finally {
            setUploading(false);
          }
        }

        (e.target as HTMLFormElement).reset();
        setSelectedDocument("");
        setCustomTitle("");
        setFilename("");
        if(fileInput.current) {
          fileInput.current.value = "";
        }
        onSuccess?.();
      }
      
      setFormState(responseData);
    } catch (err) {
      console.error('Erro ao criar solicitação:', err);
      setFormState({
        success: false,
        errors: { global: { message: 'Erro ao criar solicitação' } }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2 text-left">
        <h3 className="text-xl font-medium">Nova Solicitação</h3>
        <p className="text-gray-500">
          Solicite e envie documentos. Nossa equipe responderá em breve.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        <div className="space-y-2">
          <Label htmlFor="documentType" title="Tipo de Documento" required />
          <DocumentSelect
            id="documentType"
            name="documentType"
            placeholder="Selecione o tipo de documento"
            options={DOCUMENT_TEMPLATES.map((template, index) => {
              const isPoa = template.label === "Procuração";
              const isTax = template.label === "Declaração Isento IRPF";
              const isHipo = template.label === "Declaração de Hipossuficiência";
              const disabled = (isPoa && !isPoaSelectable()) || (isTax && !isTaxSelectable()) || (isHipo && !isHipoSelectable());
              
              let disabledText = undefined;
              if (disabled && isPoa && poaDocument) {
                disabledText = poaDocument.signed === 1 ? 'Já assinada' : 'Pendente';
              } else if (disabled && isTax && taxDocument) {
                disabledText = taxDocument.signed === 1 ? 'Já assinada' : 'Pendente';
              } else if (disabled && isHipo && hipoDocument) {
                disabledText = hipoDocument.signed === 1 ? 'Já assinada' : 'Pendente';
              }
              
              return {
                value: index.toString(),
                label: template.label,
                template: template,
                disabled: disabled,
                disabledText: disabledText
              };
            })}
            selectedValue={selectedDocument}
            onChange={handleDocumentChange}
            required
          />
          <FieldError error={formState?.errors?.documentType} />
        </div>

        {/* Removido o campo customTitle pois agora temos documentos específicos */}

        <div className="space-y-2">
          {(() => {
            const index = parseInt(selectedDocument);
            const selectedTemplate = index >= 0 && index < DOCUMENT_TEMPLATES.length ? DOCUMENT_TEMPLATES[index] : null;
            const isRequired = selectedTemplate?.isRequired !== false;
            
            if (!isRequired && selectedTemplate) {
              // Se o documento não é obrigatório, mostra apenas o aviso
              return (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>{selectedTemplate.label}</strong> será enviado pela nossa equipe. Não é necessário que você envie.
                  </p>
                </div>
              );
            }
            
            if (isRequired && selectedTemplate) {
              // Se o documento é obrigatório, mostra o campo de upload
              return (
                <>
                  <Label 
                    htmlFor="file" 
                    title="Enviar Documento"
                    required={true} 
                  />
                  <div className="space-y-2">
                    <input 
                      ref={fileInput} 
                      type="file" 
                      name="file" 
                      id="file" 
                      className="hidden" 
                      onInput={handleFilename} 
                      multiple={false}
                      accept=".pdf,.png,.jpg,.jpeg"
                      required={true}
                    />
                    <label 
                      htmlFor="file" 
                      className="border border-slate-200 flex items-center justify-center rounded-md h-10 cursor-pointer space-x-2 hover:border-slate-950 transition-colors text-sm text-slate-950 px-3"
                    >
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>{filename ? filename : 'Selecionar arquivo'}</span>
                    </label>
                    <p className="text-xs text-slate-500">
                      Formatos aceitos: <b>PDF</b>, <b>PNG</b> e <b>JPG</b>. Maximo 25MB.
                    </p>
                  </div>
                  <FieldError error={formState?.errors?.file} />
                </>
              );
            }
            
            return null;
          })()}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" title="Mensagem (Opcional)" />
          <TextArea 
            id="message"
            name="message"
            placeholder="Observações ou instruções especiais para nossa equipe..."
            rows={3}
          />
          <FieldError error={formState?.errors?.message} />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            loading={isLoading || uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>

        {formState?.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">{formState.message}</p>
          </div>
        )}

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <h4 className="font-medium text-amber-800 mb-2">Observação importante:</h4>
          <p className="text-amber-700 text-sm">
            Todos os documentos listados acima são obrigatórios para o processo. Se você não tiver algum ainda, 
            nossa equipe te mostrará o caminho para providenciar cada um deles. A procuração, a declaração IRPF 
            e a declaração de hipossuficiência serão enviadas pela equipe para você assinar.
          </p>
        </div>

        <FieldError error={formState?.errors?.global} />
      </form>
    </div>
  );
}