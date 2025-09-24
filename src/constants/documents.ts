export interface DocumentTemplate {
  label: string;
  description?: string;
  whatIs: string;
  whyNeeded: string;
  whoSends: string;
  isRequired?: boolean;
}

// Lista padrão de documentos - futuramente será configurável pelo admin
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // {
  //   label: "Procuração",
  //   description: "Documento enviado pela equipe para autorização legal",
  //   whatIs: "É um documento que você assina dando permissão para que a equipe faça o processo em seu nome.",
  //   whyNeeded: "Sem a procuração assinada, o juiz não aceita o pedido, porque não tem autorização oficial para que a equipe te represente.",
  //   whoSends: "A equipe envia a procuração pronta. Você só assina e devolve.",
  //   isRequired: false
  // },
  // {
  //   label: "Declaração Isento IRPF",
  //   description: "Documento enviado pela equipe para assinatura de declaração de imposto de renda",
  //   whatIs: "É um documento que você assina declarando informações sobre imposto de renda.",
  //   whyNeeded: "É necessário para comprovação de situação fiscal e financeira no processo.",
  //   whoSends: "A equipe envia o documento pronto. Você só assina e devolve.",
  //   isRequired: false
  // },
  // {
  //   label: "Declaração de Hipossuficiência",
  //   description: "Documento enviado pela equipe para assinatura de declaração de hipossuficiência",
  //   whatIs: "É um documento que você assina declarando sua condição de hipossuficiência econômica.",
  //   whyNeeded: "É necessário para solicitar a gratuidade da justiça no processo.",
  //   whoSends: "A equipe envia o documento pronto. Você só assina e devolve.",
  //   isRequired: false
  // },
  {
    label: "Documento de Identidade (RG ou CNH)",
    description: "Identidade oficial do paciente",
    whatIs: "É a sua identidade oficial, RG ou CNH.",
    whyNeeded: "O juiz usa para confirmar quem é o paciente e colocar o nome certo na autorização.",
    whoSends: "Você tira uma foto legível (frente e verso) e envia pelo site."
  },
  {
    label: "Comprovante de Endereço (até 3 meses)",
    description: "Conta recente para comprovar local de cultivo",
    whatIs: "Conta de luz, água, internet ou banco mostrando seu endereço atual.",
    whyNeeded: "O juiz precisa saber onde o cultivo vai acontecer. A autorização fica vinculada a esse endereço.",
    whoSends: "Você envia a conta mais recente que tenha (até 90 dias)."
  },
  {
    label: "Declaração de Imposto de Renda ou Declaração de Isenção",
    description: "Comprovação da situação financeira",
    whatIs: "Se você declara imposto de renda, envia a declaração. Se não declara, a equipe manda um documento simples para você assinar dizendo que não declara.",
    whyNeeded: "Serve para mostrar sua situação financeira e pedir a gratuidade do processo, quando for o caso.",
    whoSends: "Você envia a declaração ou assina a de isenção que a equipe manda."
  },
  {
    label: "Declaração ANVISA",
    description: "Autorização para importação de medicamentos",
    whatIs: "É uma autorização da ANVISA para importar remédios de cannabis.",
    whyNeeded: "Mostra que seu tratamento já é reconhecido como medicinal e fortalece o processo.",
    whoSends: "Você envia o documento. Se não tem ainda, a equipe explica como solicitar."
  },
  {
    label: "Certificado de Curso de Cultivo/Extração",
    description: "Comprovação de conhecimento técnico",
    whatIs: "É um certificado que mostra que você fez curso de cultivo ou extração de cannabis medicinal.",
    whyNeeded: "Mostra que você tem conhecimento técnico e sabe fazer o tratamento de forma segura.",
    whoSends: "Você envia o certificado. Se ainda não tem, a equipe explica onde fazer."
  },
  {
    label: "Comprovante de Associação",
    description: "Vinculação a associação de cannabis medicinal",
    whatIs: "Documento que mostra que você é associado a uma associação de cannabis medicinal.",
    whyNeeded: "Ajuda a mostrar que você segue os requisitos técnicos e jurídicos e que seu tratamento tem respaldo.",
    whoSends: "Você envia o comprovante. Se não tem, a equipe explica como se associar."
  },
  {
    label: "Laudo de Engenheiro Ambiental",
    description: "Análise técnica do espaço de cultivo",
    whatIs: "É um documento feito por um engenheiro que analisa seu espaço de cultivo e calcula quantas plantas você precisa para o tratamento.",
    whyNeeded: "É uma das provas mais importantes. O juiz usa para autorizar a quantidade de plantas e validar o local de cultivo.",
    whoSends: "Você envia o laudo pronto. A equipe explica como contratar um engenheiro para fazer."
  },
  {
    label: "Receita Médica Atualizada",
    description: "Prescrição médica atual para cannabis",
    whatIs: "Receita assinada por médico que prescreve o uso medicinal da cannabis para você.",
    whyNeeded: "Sem receita, o juiz não tem como comprovar que o tratamento é necessário.",
    whoSends: "Você envia a receita mais atual com assinatura do médico."
  },
  {
    label: "Laudo de Evolução e Benefícios à Saúde",
    description: "Relatório médico sobre resultados do tratamento",
    whatIs: "Relatório do seu médico mostrando como o tratamento com cannabis melhorou sua saúde.",
    whyNeeded: "Ajuda o juiz a entender que o tratamento funciona e que você não pode interromper.",
    whoSends: "Você envia o laudo feito pelo seu médico."
  },
  {
    label: "Laudo Farmacêutico",
    description: "Acompanhamento técnico da medicação",
    whatIs: "Documento feito por um farmacêutico que descreve como o medicamento é feito e usado (doses e concentrações).",
    whyNeeded: "Mostra que seu tratamento tem acompanhamento técnico e é feito de forma segura.",
    whoSends: "Você envia o laudo assinado por um farmacêutico."
  }
];
