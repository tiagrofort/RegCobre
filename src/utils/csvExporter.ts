/**
 * Utilitário de Exportação de Dados para Formato CSV (Excel-Ready)
 * - Codificação UTF-8 com BOM (\uFEFF) para compatibilidade nativa com Microsoft Excel
 * - Separador padrão ponto e vírgula (;) padrão brasileiro
 * - Escape rigoroso de aspas, quebras de linha e delimitadores
 * - Formatação numérica limpa (sem caracteres monetários decorativos)
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T, index: number) => string | number | boolean | null | undefined;
  type?: 'text' | 'number' | 'currency' | 'date';
}

export interface CsvExportOptions<T> {
  filename: string;
  columns: CsvColumn<T>[];
  data: T[];
  separator?: string; // Padrão ';'
  includeBOM?: boolean; // Padrão true
}

/**
 * Escapa uma célula individual para conformidade com a RFC 4180
 */
function escapeCsvValue(val: string | number | boolean | null | undefined, separator: string): string {
  if (val === null || val === undefined) {
    return '';
  }

  const str = String(val).trim();

  // Se contiver delimitador, quebra de linha ou aspas, deve ser envolvido por aspas e ter aspas duplicadas
  if (str.includes(separator) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converte a coleção em string CSV e dispara o download seguro no navegador
 */
export function exportToCsv<T>(options: CsvExportOptions<T>): boolean {
  try {
    const { filename, columns, data, separator = ';', includeBOM = true } = options;

    if (!columns || columns.length === 0) {
      console.error('[csvExporter] Nenhuma coluna informada para exportação.');
      return false;
    }

    // 1. Linha de Cabeçalhos
    const headerRow = columns
      .map((col) => escapeCsvValue(col.header, separator))
      .join(separator);

    // 2. Linhas de Dados
    const dataRows = data.map((item, index) => {
      return columns
        .map((col) => {
          const rawValue = col.accessor(item, index);
          let formattedValue: string | number = '';

          if (rawValue === null || rawValue === undefined) {
            formattedValue = '';
          } else if (col.type === 'currency' && typeof rawValue === 'number') {
            // Formata no padrão brasileiro (e.g. 1540,50) para que o Excel reconheça como número
            formattedValue = rawValue.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              useGrouping: false, // Sem ponto de milhar para evitar confusão de parse no Excel
            });
          } else if (col.type === 'number' && typeof rawValue === 'number') {
            formattedValue = String(rawValue).replace('.', ',');
          } else {
            formattedValue = String(rawValue);
          }

          return escapeCsvValue(formattedValue, separator);
        })
        .join(separator);
    });

    // 3. Montagem do Conteúdo Final
    const csvContent = (includeBOM ? '\uFEFF' : '') + [headerRow, ...dataRows].join('\r\n');

    // 4. Criação do Blob e Disparo do Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', cleanFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('[csvExporter] Erro ao exportar CSV:', error);
    return false;
  }
}
