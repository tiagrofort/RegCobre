import React from 'react';

export const ImportarErpView: React.FC = () => {
  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1200px] mx-auto w-full pb-16">
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">cloud_sync</span>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
            Integração e Carga de Títulos ERP
          </h1>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Conexão homologada com TOTVS Protheus, SAP Business One, Senior e Sankhya para sincronização automática de títulos a receber, baixas de conciliação bancária e cadastros de clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <h3 className="font-title-md font-bold text-primary">Sincronizador Automático Ativo</h3>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            O conector RegCobre sincroniza automaticamente os títulos vencidos a cada 15 minutos. Última carga realizada com sucesso às 14:48:02 (48 títulos carregados).
          </p>
          <div className="p-3 bg-surface-container-low rounded-lg font-data-mono text-xs text-outline space-y-1">
            <div>Conector: <strong>TOTVS REST Webhook v3.8</strong></div>
            <div>Status: <span className="text-secondary font-bold">ONLINE (100% OK)</span></div>
            <div>Hash de Integridade: <span className="text-primary font-bold">#9821-TOTVS-CORP</span></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">upload_file</span>
            <h3 className="font-title-md font-bold text-primary">Carga Manual via Arquivo (Próxima Etapa)</h3>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Conforme especificado no planejamento, a importação manual de planilhas Excel (.xlsx) e arquivos .csv será implementada na etapa seguinte de backend e integração direta.
          </p>
          <div className="p-3 bg-surface-container-high rounded-lg text-xs text-on-surface-variant">
            Nesta etapa, toda a aplicação opera com dados representativos em memória de alta fidelidade para validação operacional do fluxo.
          </div>
        </div>
      </div>
    </div>
  );
};
