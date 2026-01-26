// Quotation export utilities

export interface QuotationItem {
  id: string;
  name: string;
  clave?: string;
  quantity: number;
  price: number;
}

export interface QuotationData {
  clientName?: string;
  items: QuotationItem[];
  notes?: string;
  validityDays?: number;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function calculateSubtotal(item: QuotationItem): number {
  return item.quantity * item.price;
}

export function calculateTotal(items: QuotationItem[]): number {
  return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
}

export function generateWhatsAppText(data: QuotationData): string {
  const date = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let text = `📋 *COTIZACIÓN COMPUCHIAPAS*\n`;
  text += `Fecha: ${date}\n`;
  
  if (data.clientName) {
    text += `Cliente: ${data.clientName}\n`;
  }
  
  text += `\n`;

  data.items.forEach((item, index) => {
    const subtotal = calculateSubtotal(item);
    text += `▸ ${item.name}`;
    if (item.quantity > 1) {
      text += ` (x${item.quantity})`;
    }
    text += ` - ${formatCurrency(subtotal)}\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━\n`;
  text += `*TOTAL: ${formatCurrency(calculateTotal(data.items))}*\n`;

  if (data.notes) {
    text += `\n📝 Notas: ${data.notes}\n`;
  }

  text += `\nVálido por ${data.validityDays || 7} días`;
  text += `\n📞 WhatsApp: 961-145-3697`;
  text += `\n🌐 compuchiapas.lovable.app`;

  return text;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generatePDFContent(data: QuotationData): string {
  // Returns HTML content for PDF generation
  const date = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.clave || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(calculateSubtotal(item))}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cotización - Compuchiapas</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .date { color: #666; }
        .client-info { margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #2563eb; color: white; padding: 12px 8px; text-align: left; }
        .total-row { font-weight: bold; font-size: 18px; }
        .total-row td { padding-top: 15px; }
        .notes { background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        .validity { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">COMPUCHIAPAS</div>
        <div class="date">${date}</div>
      </div>
      
      ${data.clientName ? `
        <div class="client-info">
          <strong>Cliente:</strong> ${data.clientName}
        </div>
      ` : ''}
      
      <table>
        <thead>
          <tr>
            <th>Clave</th>
            <th>Descripción</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">P. Unit.</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="4" style="text-align: right;">TOTAL:</td>
            <td style="text-align: right;">${formatCurrency(calculateTotal(data.items))}</td>
          </tr>
        </tbody>
      </table>
      
      ${data.notes ? `
        <div class="notes">
          <strong>Notas:</strong> ${data.notes}
        </div>
      ` : ''}
      
      <p class="validity">⏰ Cotización válida por ${data.validityDays || 7} días</p>
      
      <div class="footer">
        <p><strong>Compusistemas de Chiapas</strong></p>
        <p>📞 961-145-3697 | 🌐 compuchiapas.lovable.app</p>
        <p>📍 Tuxtla Gutiérrez, Chiapas</p>
      </div>
    </body>
    </html>
  `;
}

export function printQuotation(data: QuotationData): void {
  const content = generatePDFContent(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
