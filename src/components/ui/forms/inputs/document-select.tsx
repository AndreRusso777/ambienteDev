import { useState, useRef, useEffect } from "react";
import { ChevronDown, Info, X } from "lucide-react";
import { DocumentTemplate } from "@/constants/documents";

interface Props {
  id: string;
  name: string;
  placeholder?: string;
  options: { value: string; label: string; template: DocumentTemplate; disabled?: boolean; disabledText?: string }[];
  selectedValue?: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function DocumentSelect({
  id,
  name,
  placeholder = "Selecione uma opção",
  options,
  selectedValue,
  onChange,
  required = false,
  className = ""
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === selectedValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    const option = options.find(opt => opt.value === value);
    if (option?.disabled) return; // Não permite seleção de opções desabilitadas
    
    onChange(value);
    setIsOpen(false);
  };

  const handleInfoClick = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    setShowTooltip(showTooltip === optionValue ? null : optionValue);
  };

  return (
    <div className="relative w-full" ref={selectRef}>
      <input
        type="hidden"
        name={name}
        value={selectedValue || ""}
        required={required}
      />
      
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[2.5rem] px-3 py-2 text-left bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-transparent focus:border-black ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex-1 min-w-0">
            {selectedOption ? (
              <div className="w-full min-w-0">
                <div 
                  className="font-medium text-slate-900 truncate"
                >
                  {selectedOption.label}
                </div>
                {selectedOption.template.description && (
                  <div className="text-xs text-slate-500 truncate">
                    {selectedOption.template.description}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-slate-500 truncate block">
                {placeholder}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedOption && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(showTooltip === selectedOption.value ? null : selectedOption.value);
                }}
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                title="Ver detalhes"
              >
                <Info className="w-5 h-5" />
              </div>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-96 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`flex items-start gap-2 px-3 py-3 border-b border-slate-100 last:border-b-0 ${
                option.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-slate-50 cursor-pointer'
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className={`font-medium ${option.disabled ? 'text-slate-400' : 'text-slate-900'}`}>
                  {option.label}
                  {option.disabled && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({option.disabledText || 'Não disponível'})
                    </span>
                  )}
                </div>
                {option.template.description && (
                  <div className={`text-xs mt-1 ${option.disabled ? 'text-slate-400' : 'text-slate-500'}`}>
                    {option.template.description}
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={(e) => handleInfoClick(e, option.value)}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-blue-600 transition-colors mt-0.5"
                title="Ver detalhes"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTooltip(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const option = options.find(opt => opt.value === showTooltip);
              if (!option) return null;
              
              return (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 pr-4 flex-1">
                      {option.label}
                    </h3>
                    <button
                      onClick={() => setShowTooltip(null)}
                      className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">O que é:</h4>
                      <p className="text-slate-700 break-words">{option.template.whatIs}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Por que precisa:</h4>
                      <p className="text-slate-700 break-words">{option.template.whyNeeded}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Quem envia:</h4>
                      <p className="text-slate-700 break-words">{option.template.whoSends}</p>
                    </div>

                    {option.template.isRequired === false && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-blue-700 text-xs break-words">
                          <strong>Observação:</strong> Este documento é enviado pela equipe, não é necessário que você envie.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
