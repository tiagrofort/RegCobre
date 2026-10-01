import React, { useState } from 'react';

type ImportStep = 'upload' | 'analisar' | 'mapear' | 'pre-visualizar' | 'validar' | 'importar';

interface ColumnMapping {
  erpColumn: string;
  sampleValue: string;
  regCobreField: string;
  required: boolean;
}

interface ImportarErpViewProps {
  onNavigateToTodayWork?: () => void;
  onNavigateToPortfolio?: () => void;
}

export const ImportarErpView: React.FC<ImportarErpViewProps> = ({
  onNavigateToTodayWork,
  onNavigateToPortfolio,
}) => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFileName, setSelectedFileName] = useState<string>('totvs_protheus_titulos_nov2024.xlsx');
  const [fileType, setFileType] = useState<'XLSX' | 'XLS' | 'CSV'>('XLSX');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedSuccessCount, setImportedSuccessCount] = useState<number>(38);

  // Column mappings state
  const [mappings, setMappings] = useState<ColumnMapping[]>([
    {
      erpColumn: 'A1_COD (Código Cliente)',
      sampleValue: '#9821',
      regCobreField: 'erpCode',
      required: true,
    },
    {
      erpColumn: 'A1_NOME (Razão Social / Nome)',
      sampleValue: 'Indústria Metalúrgica Andrade Ltda',
      regCobreField: 'debtorName',
      required: true,
    },
    {
      erpColumn: 'A1_CGC (CPF / CNPJ)',
      sampleValue: '14.892.301/0001-44',
      regCobreField: 'cnpjCpf',
      required: true,
    },
    {
      erpColumn: 'E1_NUM (Número do Título)',
      sampleValue: '000987-1',
      regCobreField: 'titleNumber',
      required: true,
    },
    {
      erpColumn: 'E1_VENCREA (Data Vencimento)',
      sampleValue: '25/09/2026',
      regCobreField: 'dueDate',
      required: true,
    },
    {
      erpColumn: 'E1_SALDO (Valor Aberto)',
      sampleValue: 'R$ 1.250,00',
      regCobreField: 'currentValue',
      required: true,
    },
    {
      erpColumn: 'A1_TEL (Telefone / WhatsApp)',
      sampleValue: '(11) 98822-1044',
      regCobreField: 'phoneMobile',
      required: false,
    },
  ]);

  const regCobreFieldOptions = [
    { value: 'erpCode', label: 'Código ERP' },
    { value: 'debtorName', label: 'Devedor (Razão Social / Nome)' },
    { value: 'cnpjCpf', label: 'CPF / CNPJ' },
    { value: 'titleNumber', label: 'Número do Título / Fatura' },
    { value: 'dueDate', label: 'Data de Vencimento' },
    { value: 'currentValue', label: 'Valor do Título (R$)' },
    { value: 'phoneMobile', label: 'Telefone / WhatsApp' },
    { value: 'ignore', label: '-- Ignorar esta Coluna --' },
  ];

  const handleUpdateMapping = (erpCol: string, targetField: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.erpColumn === erpCol ? { ...m, regCobreField: targetField } : m))
    );
  };

  const handleStartAnalysis = (fileName: string, type: 'XLSX' | 'XLS' | 'CSV') => {
    setSelectedFileName(fileName);
    setFileType(type);
    setIsProcessing(true);
    setCurrentStep('analisar');
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('mapear');
    }, 1200);
  };

  const handleProceedToPreview = () => {
    setCurrentStep('pre-visualizar');
  };

  const handleProceedToValidate = () => {
    setIsProcessing(true);
    setCurrentStep('validar');
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  const handleExecuteImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setImportedSuccessCount(38);
      setCurrentStep('importar');
    }, 1200);
  };

  const stepsList: { key: ImportStep; label: string; icon: string }[] = [
    { key: 'upload', label: '1. Upload', icon: 'upload_file' },
    { key: 'analisar', label: '2. Analisar', icon: 'manage_search' },
    { key: 'mapear', label: '3. Mapear Colunas', icon: 'schema' },
    { key: 'pre-visualizar', label: '4. Pré-visualizar', icon: 'preview' },
    { key: 'validar', label: '5. Validar', icon: 'verified' },
    { key: 'importar', label: '6. Concluído', icon: 'task_alt' },
  ];

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1400px] mx-auto w-full pb-16">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[26px]">cloud_upload</span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Importação de Títulos e Dívidas do ERP
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm font-semibold">
              Carga Flexível
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
            O ERP é a origem dos títulos. O RegCobre permite importar planilhas sem layout rígido, mapeando as colunas do seu ERP diretamente para os campos do sistema de cobrança.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-data-mono">
            Formatos aceitos: <strong>.XLSX, .XLS, .CSV</strong>
          </span>
        </div>
      </div>

      {/* Wizard Step Indicator */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {stepsList.map((st, idx) => {
            const isCurrent = currentStep === st.key;
            const isPast =
              stepsList.findIndex((s) => s.key === currentStep) >
              stepsList.findIndex((s) => s.key === st.key);

            return (
              <div key={st.key} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full ${
                    isCurrent
                      ? 'bg-primary text-surface font-bold shadow-xs'
                      : isPast
                      ? 'bg-secondary-container text-on-secondary-container font-semibold'
                      : 'bg-surface-container-low text-on-surface-variant opacity-60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {isPast ? 'check_circle' : st.icon}
                  </span>
                  <span className="text-xs truncate">{st.label}</span>
                </div>
                {idx < stepsList.length - 1 && (
                  <span className="material-symbols-outlined text-[16px] text-outline px-1 shrink-0">
                    chevron_right
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {currentStep === 'upload' && (
        <div className="flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm border-2 border-dashed border-outline-variant hover:border-secondary transition-colors flex flex-col items-center justify-center text-center gap-space-md py-12">
            <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[36px]">upload_file</span>
            </div>
            <div>
              <h3 className="font-headline-sm font-bold text-primary">
                Selecione ou arraste a planilha do seu ERP
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                Suporte para extratos do TOTVS Protheus, SAP Business One, Senior, Sankhya ou planilhas customizadas em Excel (.xlsx, .xls) ou delimitadas por ponto-e-vírgula (.csv).
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => handleStartAnalysis('totvs_protheus_titulos_nov2024.xlsx', 'XLSX')}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">attachment</span>
                <span>Carregar "totvs_protheus_titulos_nov2024.xlsx"</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartAnalysis('sap_contas_receber_extrato.csv', 'CSV')}
                className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold transition-colors cursor-pointer border border-outline-variant/30 flex items-center gap-1.5"
              >
                <span>Usar arquivo CSV de Exemplo</span>
              </button>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md text-xs">
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="font-label-uppercase text-secondary font-bold block mb-1">
                1. NÃO EXIGE LAYOUT FIXO
              </span>
              <p className="text-on-surface-variant leading-relaxed">
                Você não precisa alterar as colunas do ERP antes de enviar. O passo seguinte permite correlacionar o nome de qualquer coluna com o campo correspondente do RegCobre.
              </p>
            </div>
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="font-label-uppercase text-primary font-bold block mb-1">
                2. HISTÓRICO PRESERVADO
              </span>
              <p className="text-on-surface-variant leading-relaxed">
                Importar novos títulos não apaga o histórico de contatos nem altera registros já trabalhados pelos cobradores.
              </p>
            </div>
            <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="font-label-uppercase text-outline font-bold block mb-1">
                3. VALIDAÇÃO ANTES DA GRAVAÇÃO
              </span>
              <p className="text-on-surface-variant leading-relaxed">
                Você verá uma prévia completa e uma validação de consistência dos dados antes de confirmar a gravação na carteira.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ANALISAR */}
      {currentStep === 'analisar' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-space-md py-16">
          <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-secondary animate-spin">
            <span className="material-symbols-outlined text-[32px]">sync</span>
          </div>
          <div>
            <h3 className="font-headline-sm font-bold text-primary">
              Analisando estrutura do arquivo...
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Lendo cabeçalhos, separadores e tipagem de dados de <strong>{selectedFileName}</strong> ({fileType})
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: MAPEAR COLUNAS */}
      {currentStep === 'mapear' && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
            <div>
              <h2 className="font-title-md font-bold text-primary">
                Mapeamento das Colunas do Arquivo ({selectedFileName})
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Indique qual coluna do arquivo do ERP corresponde a cada campo do RegCobre.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep('upload')}
                className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-primary-container text-surface text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>Avançar para Pré-visualização</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <table className="w-full text-left font-body-sm text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase text-[11px] uppercase tracking-wider select-none">
                  <th className="py-2.5 px-4">Coluna Detectada no ERP</th>
                  <th className="py-2.5 px-4">Exemplo de Dado na Planilha</th>
                  <th className="py-2.5 px-4">Campo de Destino no RegCobre</th>
                  <th className="py-2.5 px-4 text-center">Obrigatoriedade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {mappings.map((m) => (
                  <tr key={m.erpColumn} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-semibold text-primary">
                      <span className="font-mono bg-surface-container-high px-2 py-1 rounded text-xs">
                        {m.erpColumn}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-data-mono text-on-surface-variant">
                      {m.sampleValue}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={m.regCobreField}
                        onChange={(e) => handleUpdateMapping(m.erpColumn, e.target.value)}
                        className="w-full max-w-xs h-8 px-2.5 bg-surface-container-lowest rounded text-xs font-medium text-on-surface border border-outline-variant/50 focus:border-primary"
                      >
                        {regCobreFieldOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.required ? (
                        <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-badge-sm text-[10px] font-semibold">
                          Obrigatório
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-badge-sm text-[10px]">
                          Opcional
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 4: PRÉ-VISUALIZAR */}
      {currentStep === 'pre-visualizar' && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
            <div>
              <h2 className="font-title-md font-bold text-primary">
                Pré-visualização dos Dados Mapeados (Amostra de 4 registros)
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Confira como os títulos serão interpretados e estruturados no RegCobre.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep('mapear')}
                className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold cursor-pointer"
              >
                Ajustar Mapeamento
              </button>
              <button
                type="button"
                onClick={handleProceedToValidate}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-primary-container text-surface text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>Avançar para Validação</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-x-auto">
            <table className="w-full text-left font-body-sm text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase text-[11px] uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3">Código ERP</th>
                  <th className="py-2.5 px-3">Devedor</th>
                  <th className="py-2.5 px-3">CPF / CNPJ</th>
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3 text-right">Valor Nominal</th>
                  <th className="py-2.5 px-3">Telefone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-data-mono">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-3 font-bold text-primary">#9821</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-primary">Indústria Metalúrgica Andrade Ltda</td>
                  <td className="py-2.5 px-3">14.892.301/0001-44</td>
                  <td className="py-2.5 px-3 font-bold">000987-1</td>
                  <td className="py-2.5 px-3">25/09/2026</td>
                  <td className="py-2.5 px-3 text-right font-bold text-primary">R$ 1.250,00</td>
                  <td className="py-2.5 px-3">(11) 98822-1044</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-3 font-bold text-primary">#3412</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-primary">Construtora Rocha Forte Ltda</td>
                  <td className="py-2.5 px-3">08.120.994/0001-90</td>
                  <td className="py-2.5 px-3 font-bold">000452-2</td>
                  <td className="py-2.5 px-3">18/08/2026</td>
                  <td className="py-2.5 px-3 text-right font-bold text-primary">R$ 15.750,00</td>
                  <td className="py-2.5 px-3">(11) 97100-3321</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-3 font-bold text-primary">#1094</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-primary">Supermercados Alvorada Eireli</td>
                  <td className="py-2.5 px-3">02.441.563/0002-12</td>
                  <td className="py-2.5 px-3 font-bold">000881-1</td>
                  <td className="py-2.5 px-3">30/09/2026</td>
                  <td className="py-2.5 px-3 text-right font-bold text-primary">R$ 12.800,00</td>
                  <td className="py-2.5 px-3">(19) 99233-4411</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-3 font-bold text-primary">#5519</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-primary">Distribuidora Brasil Norte PJ</td>
                  <td className="py-2.5 px-3">19.330.122/0003-88</td>
                  <td className="py-2.5 px-3 font-bold">000732-3</td>
                  <td className="py-2.5 px-3">12/07/2026</td>
                  <td className="py-2.5 px-3 text-right font-bold text-primary">R$ 43.290,00</td>
                  <td className="py-2.5 px-3">(91) 98111-2299</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 5: VALIDAR */}
      {currentStep === 'validar' && (
        <div className="flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
                <h2 className="font-title-md font-bold text-primary">
                  Relatório de Validação de Consistência
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Resultado da verificação de integridade antes da importação para a base de cobrança.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep('pre-visualizar')}
                className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold cursor-pointer"
              >
                Voltar à Prévia
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="h-9 px-6 rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                <span>{isProcessing ? 'Gravando...' : 'Confirmar e Importar 38 Títulos'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            <div className="p-4 bg-secondary-container/20 rounded-xl border border-secondary/30 text-center">
              <span className="text-[10px] font-label-uppercase text-secondary font-bold block">
                REGISTROS VÁLIDOS
              </span>
              <span className="font-headline-md font-bold text-secondary font-data-mono">
                38 de 38 (100%)
              </span>
              <span className="text-xs text-secondary block mt-0.5">Aptos para cobrança</span>
            </div>

            <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-center">
              <span className="text-[10px] font-label-uppercase text-outline font-bold block">
                DOCUMENTOS CNPJ / CPF
              </span>
              <span className="font-headline-md font-bold text-primary font-data-mono">
                0 Erros
              </span>
              <span className="text-xs text-on-surface-variant block mt-0.5">Sintaxe regularizada</span>
            </div>

            <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-center">
              <span className="text-[10px] font-label-uppercase text-outline font-bold block">
                SOMA FINANCEIRA
              </span>
              <span className="font-headline-md font-bold text-primary font-data-mono">
                R$ 214.500,00
              </span>
              <span className="text-xs text-on-surface-variant block mt-0.5">Valor total a receber</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: CONCLUÍDO / IMPORTAR */}
      {currentStep === 'importar' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-md border-2 border-secondary flex flex-col items-center justify-center text-center gap-space-md py-12 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-[36px]">task_alt</span>
          </div>

          <div>
            <h2 className="font-headline-md font-bold text-primary">
              Importação Concluída com Sucesso!
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
              Foram importados <strong>{importedSuccessCount} novos títulos</strong> a partir de <strong>{selectedFileName}</strong>. A carteira e a agenda diária dos cobradores foram devidamente atualizadas sem perda de nenhum histórico anterior.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
            {onNavigateToTodayWork && (
              <button
                type="button"
                onClick={onNavigateToTodayWork}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                <span>Ir para Trabalho de Hoje</span>
              </button>
            )}

            {onNavigateToPortfolio && (
              <button
                type="button"
                onClick={onNavigateToPortfolio}
                className="h-10 px-5 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold transition-colors cursor-pointer border border-outline-variant/30 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                <span>Ver em Minha Carteira</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentStep('upload')}
              className="h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-title-md text-xs font-medium cursor-pointer"
            >
              Importar Outro Arquivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
