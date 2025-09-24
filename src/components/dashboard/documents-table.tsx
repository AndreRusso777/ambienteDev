import { Document } from "@/types/document";
import User from "@/types/user";
import { CheckCircle, Circle, Download, FileClock, Signature, Upload, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Form from "../ui/forms/form";
import Button from "../ui/shared/button";
import { FormState } from "@/types/form";

interface Props {
  user: User;
  documents: Document[];
}

export default function DocumentsTable({ user, documents: serverDocuments }: Props) {
  const [documents, setDocuments] = useState<Document[]>(serverDocuments);
  const [uploadModalDocument, setUploadModalDocument] = useState<Document | null>(null);
  const [uploadFormState, setUploadFormState] = useState<FormState>();
  const [filename, setFilename] = useState<string>("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Função para determinar a prioridade de ordenação do documento
  const getDocumentPriority = (document: Document): number => {
    // 1. Pendente (sem path e não é contract/poa/tax/hipo)
    if (!document.path && document.type !== "contract" && document.type !== "poa" && document.type !== "tax" && document.type !== "hipo") {
      return 1;
    }
    
    // 2. Aguardando aprovação (tem path mas não está aprovado)
    if (document.path && document.approved !== 1) {
      return 2;
    }
    
    // 3. Aprovado (tem path e está aprovado)
    if (document.path && document.approved === 1) {
      return 3;
    }
    
    // 4. Assinado (contract/poa/tax/hipo assinados)
    if ((document.type === "contract" || document.type === "poa" || document.type === "tax" || document.type === "hipo") && document.signed === 1) {
      return 4;
    }
    
    // 1. Pendente (contract/poa/tax/hipo não assinados)
    if ((document.type === "contract" || document.type === "poa" || document.type === "tax" || document.type === "hipo") && document.signed !== 1) {
      return 1;
    }
    
    return 5; // fallback
  };

  // Documentos ordenados
  const sortedDocuments = [...documents].sort((a, b) => {
    const priorityA = getDocumentPriority(a);
    const priorityB = getDocumentPriority(b);
    return priorityA - priorityB;
  });

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
      const response = await fetch(`/api/documents/download?filename=${doc.filename}&userId=${user.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      if (!response.ok) {
        console.error("Failed to fetch file");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const filenameSegments = doc.filename.split('.');
      const fileExtension = filenameSegments[(filenameSegments?.length - 1) || 1];
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title}.${fileExtension}`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  }

  const handleFilename = (e: React.FormEvent<HTMLInputElement>) => {
    let name: string = e.currentTarget.files?.length === 1 ? e.currentTarget.files[0].name.slice(0, 25) : "";

    if(name?.length === 25) {
      name += '...';
    }

    if(!name) return;

    setFilename(name);
  }

  const handleCloseUploadModal = () => {
    setUploadModalDocument(null);
    setFilename("");
    if(fileInput.current) {
      fileInput.current.value = "";
    }
  }

  const handleUpload = async(e: React.FormEvent<HTMLFormElement>) => {
    setUploading(true);
    e.preventDefault();
    
    if(!uploadModalDocument?.id) {
      console.error('Não foi possível encontrar a requisição do documento.')
      setUploading(false);
      return;
    };

    const formData = new FormData(e.currentTarget);
    formData.append('documentId', uploadModalDocument.id.toString());
    formData.append('userId', JSON.stringify(user.id));

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        },
        body: formData
      });

      const responseData = await response.json();
      
      if(response.ok) {
        await getDocuments();
        setFilename("");
        if(fileInput.current) {
          fileInput.current.value = "";
        }
        setUploadModalDocument(null);
      }  else {
        setUploadFormState(responseData);
      }
    } catch(err) {
      console.log(err);
    }

    setUploading(false);
  }

  const getDocuments = async() => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents?userId=${user.id}`, { 
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        } 
      });
  
      const responseData = await response.json();
  
      if(response.ok) {
        setDocuments(responseData.data.documents);
      }

      return responseData.data.documents;
    } catch(err) {
      console.error('Error while trying to fetch user documents', err);
    }
  }
  
  const handleCreateTax = async(id: number) => {
    try {
      const response = await fetch('/api/documents/tax-declaration', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          documentId: id
        })
      });

      if(!response.ok) {
        return console.error('Ocorreu um erro inesperado ao tentar gerar link de assinatura.');
      }

      const data = await response.json();

      await getDocuments();
      
      const link = document.createElement("a");
      link.href = data.data.sign_url;
      link.target = "_blank";
      link.click();
    } catch(err) {
      console.error(err);
    }
  }

  const handleCreateHipo = async(id: number) => {
    try {
      const response = await fetch('/api/documents/hipossuficiency-declaration', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          documentId: id
        })
      });

      if(!response.ok) {
        return console.error('Ocorreu um erro inesperado ao tentar gerar link de assinatura.');
      }

      const data = await response.json();

      await getDocuments();
      
      const link = document.createElement("a");
      link.href = data.data.sign_url;
      link.target = "_blank";
      link.click();
    } catch(err) {
      console.error(err);
    }
  }

  const handleCreatePoa = async(id: number) => {
    try {
      const response = await fetch('/api/documents/power-of-attorney', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          documentId: id
        })
      });

      if(!response.ok) {
        return console.error('Ocorreu um erro inesperado ao tentar gerar link de assinatura.');
      }

      const data = await response.json();

      await getDocuments();
      
      const link = document.createElement("a");
      link.href = data.data.sign_url;
      link.target = "_blank";
      link.click();
    } catch(err) {
      console.error(err);
    }
  }

  const handleSignTax = async(tax: Document) => {
    setIsSigning(true);

    if(!tax?.token) {
      await handleCreateTax(tax.id);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let taxTokenExpiry: Date | null = null;
    
    if(tax.token_expiry) {
      taxTokenExpiry = new Date(tax.token_expiry);
      taxTokenExpiry.setHours(0, 0, 0, 0);
    }
    
    if(taxTokenExpiry && today.getTime() > taxTokenExpiry.getTime()) {
      try {
        const response = await fetch(`/api/documents/tax-declaration`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: tax.id,
            token: tax.token
          })
        });
  
        if(!response.ok) {
          return console.error('Ocorreu um erro inesperado ao tentar validar sua declaração IRPF');
        }

        await handleCreateTax(tax.id)
      } catch(err) {
        console.error('Ocorreu um erro inesperado ao tentar atualizar data de assinatura da sua declaração IRPF', err);
        setIsSigning(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/documents/tax-declaration?token=${tax.token}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        }
      });

      if(!response.ok) {
        return console.error('Ocorreu um erro inesperado ao tentar validar sua declaração IRPF');
      }
      
      const data = await response.json();

      const link = document.createElement("a");
      link.href = data.data.sign_url;
      link.target = "_blank";
      link.click();
    } catch(err) {
      console.error('Ocorreu um erro inesperado ao tentar atualizar data de assinatura da sua declaração IRPF', err);
      setIsSigning(false);
      return;
    }
  }

  const handleSignHipo = async(hipo: Document) => {
    setIsSigning(true);

    if(!hipo?.token) {
      await handleCreateHipo(hipo.id);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let hipoTokenExpiry: Date | null = null;
    
    if(hipo.token_expiry) {
      hipoTokenExpiry = new Date(hipo.token_expiry);
      hipoTokenExpiry.setHours(0, 0, 0, 0);
    }
    
    if(hipoTokenExpiry && today.getTime() > hipoTokenExpiry.getTime()) {
      try {
        const response = await fetch(`/api/documents/hipossuficiency-declaration`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: hipo.id,
            token: hipo.token
          })
        });

        const responseData = await response.json();
  
        if(!response.ok) {
          return console.error('Ocorreu um erro inesperado ao tentar validar sua declaração de hipossuficiência');
        }

        await handleCreateHipo(hipo.id)
      } catch(err) {
        console.error('Ocorreu um erro inesperado ao tentar atualizar data de assinatura da sua declaração de hipossuficiência', err);
        setIsSigning(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/documents/hipossuficiency-declaration?token=${hipo.token}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        }
      });

      if(!response.ok) {
        return console.error('Ocorreu um erro inesperado ao tentar validar sua declaração de hipossuficiência');
      }
      
      const data = await response.json();

      const link = document.createElement("a");
      link.href = data.data.sign_url;
      link.target = "_blank";
      link.click();
    } catch(err) {
      console.error('Ocorreu um erro inesperado ao tentar atualizar data de assinatura da sua declaração de hipossuficiência', err);
      setIsSigning(false);
      return;
    }
  }

  const handleSign = async(poa: Document) => {
    setIsSigning(true);

    if(!poa?.token) {
      await handleCreatePoa(poa.id);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let poaTokenExpiry: Date | null = null;
    
    if(poa.token_expiry) {
      poaTokenExpiry = new Date(poa.token_expiry);
      poaTokenExpiry.setHours(0, 0, 0, 0);
    }
    
    if(poaTokenExpiry && today.getTime() > poaTokenExpiry.getTime()) {
      try {
        const response = await fetch(`/api/documents/power-of-attorney`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: poa.id,
            token: poa.token
          })
        });

        const responseData = await response.json();
  
        if(!response.ok) {
          return console.error('Ocorreu um erro inesperado ao tentar validar sua procuração');
        }

        await handleCreatePoa(poa.id)
      } catch(err) {
        console.error('Ocorreu um erro inesperado ao tentar atualizar data de assinatura do seu contrato', err);
        setIsSigning(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/documents/power-of-attorney?token=${poa.token}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        }
      });

      if(!response.ok) {
        return console.error('Ocorreu um erro inesperado ao tentar validar sua procuração');
      }
      
      const data = await response.json();

      const link = document.createElement("a");
      link.href = data.data.sign_url;
      link.target = "_blank";
      link.click();
    } catch(err) {
      console.error('Ocorreu um erro inesperado ao tentar atualizar data de assinatura do seu contrato', err);
      setIsSigning(false);
      return;
    }
  }

  useEffect(() => {
    if(!isSigning) return;

    const intervalId = setInterval(async () => {
      const documents = await getDocuments();
      const poa = documents.find((document: Document) => document.type === "poa");
      const tax = documents.find((document: Document) => document.type === "tax");
      const hipo = documents.find((document: Document) => document.type === "hipo");
      if((poa && poa.signed === 1) || (tax && tax.signed === 1) || (hipo && hipo.signed === 1)) {
        setIsSigning(false);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isSigning]);

  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <div className="relative w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-100">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="group transition-colors hover:bg-gray-50">
                <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                  Documento
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                  Status
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}></th>
              </tr>
            </thead>
            {sortedDocuments?.length > 0 && (
              <tbody>
                {sortedDocuments.map((document: Document) => (
                  <tr key={document.id} className="group border-t transition-colors hover:bg-gray-50">
                    <td className="p-2 align-middle" colSpan={1}>
                      <div className="min-w-64">{document.title}</div>
                    </td>
                    <td className="p-2 align-middle sticky right-0" colSpan={1}>
                      <div className="min-w-20">
                        {(document.type === "contract" || document.type === "poa" || document.type === "tax" || document.type === "hipo") ? (
                          <>
                            {document.signed === 1 ? (
                              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 border border-green-200">
                                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                <span className="text-green-700 font-medium text-sm">Assinado</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-yellow-100 border border-yellow-200">
                                <FileClock className="w-4 h-4 text-yellow-600 mr-2" />
                                <span className="text-yellow-700 font-medium text-sm">Pendente</span>
                              </div>
                            )}
                          </>
                        ) : document.path ? (
                          <>
                            {document.approved === 1 ? (
                              <div className="inline-flex flex-col items-start px-3 py-1.5 rounded-lg bg-green-100 border border-green-200">
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 min-w-4 text-green-600 mr-2" />
                                  <span className="text-green-700 font-medium text-sm">Aprovado</span>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-yellow-100 border border-yellow-200">
                                <FileClock className="w-4 h-4 min-w-4 text-yellow-600 mr-2" />
                                <span className="text-yellow-700 font-medium text-sm">Aguardando aprovação</span>
                              </div>
                            )}
                          </>
                        ) : document.approved === 0 ? (
                          <div className="inline-flex flex-col items-start px-3 py-1.5 rounded-lg bg-red-100 border border-red-200">
                            <div className="flex items-center">
                              <XIcon className="w-4 h-4 min-w-4 text-red-600 mr-2" />
                              <span className="text-red-700 font-medium text-sm">Rejeitado</span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-yellow-100 border border-yellow-200">
                            <Circle className="w-4 h-4 text-yellow-600 mr-2" />
                            <span className="text-yellow-700 font-medium text-sm">Pendente</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 align-middle sticky right-0 bg-white group-hover:bg-gray-50" colSpan={1}>
                      <div className="w-10 ml-auto">
                        {(document.type === "poa" && !document.signed) && (
                          <button 
                            type="button"
                            title="Assinar"
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                            onClick={() => { handleSign(document); }}
                            disabled={isSigning}
                          >
                            <Signature className="w-4" />
                          </button>
                        )}
                        {(document.type === "tax" && !document.signed) && (
                          <button 
                            type="button"
                            title="Assinar"
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                            onClick={() => { handleSignTax(document); }}
                            disabled={isSigning}
                          >
                            <Signature className="w-4" />
                          </button>
                        )}
                        {(document.type === "hipo" && !document.signed) && (
                          <button 
                            type="button"
                            title="Assinar"
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                            onClick={() => { handleSignHipo(document); }}
                            disabled={isSigning}
                          >
                            <Signature className="w-4" />
                          </button>
                        )}
                        {(document.path || (document.token && document.signed === 1)) && (
                          <button 
                            type="button"
                            title="Baixar"
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                            onClick={() => { handleDownload(document); }}
                          >
                            <Download className="w-4" />
                          </button>
                        )}
                        {!document.path && document.type === "doc" && (
                          <button
                            type="button"
                            title="Enviar"
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1 disabled:hover:border-inherit disabled:opacity-60 disabled:cursor-default"
                            onClick={() => { setUploadModalDocument(document) }}
                          >
                            <Upload className="w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>
      <div className={`fixed top-0 left-0 w-full h-screen flex items-center justify-center ${!uploadModalDocument ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} transition-opacity ease-linear z-[60] px-4`}>
        <div 
          className="absolute top-0 left-0 w-full h-full bg-slate-950 bg-opacity-70 -z-10 cursor-default" 
          role="button" 
          onClick={handleCloseUploadModal}
        ></div>
        <div className={`relative w-full max-w-md border border-slate-200 rounded-lg grid gap-6 p-6 bg-white ${!uploadModalDocument ? 'scale-95' : 'scale-100'} transition-all ease-linear`}>
          <button 
            type="button"
            className=" absolute top-2 right-2 w-6 h-6 border rounded-md hover:border-slate-950 flex items-center justify-center"
            onClick={handleCloseUploadModal}
          >
            <XIcon className="w-4 h-4" />
          </button>
          <div className="flex flex-col space-y-1.5">
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              Enviar documento
            </h1>
            <p className="text-sm font-normal text-slate-500 mt-1">
              Documento requerido: {uploadModalDocument?.title}<br></br>
              Formatos aceitos: <b>PDF</b>, <b>PNG</b> e <b>JPG</b>
            </p>
          </div>
          <Form state={uploadFormState} onSubmit={handleUpload} className="!flex !gap-0">
            <input ref={fileInput} type="file" name="file" id="file" className="hidden" onInput={handleFilename} multiple={false} />
            <label htmlFor="file" className="border flex items-center justify-center rounded-md w-10 h-10 cursor-pointer space-x-2 flex-1 hover:border-slate-950 transition-colors mr-2 text-sm text-slate-950">
              <Upload className="w-4 h-4 shrink-0" />
              <span>{ filename ? filename : 'Selecionar' }</span>
            </label>
            <Button disabled={!fileInput.current || !filename || uploading}>Enviar</Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
