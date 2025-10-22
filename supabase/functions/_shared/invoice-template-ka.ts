// Georgian invoice template for pdfmake
export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyBank: string;
  companyIban: string;
  projectName: string;
  planName: string;
  durationMonths: number;
  monthlyPrice: number;
  discountPercentage: number;
  totalPrice: number;
  paymentPurpose: string;
  gridixName: string;
  gridixTaxId: string;
  gridixBank: string;
  gridixIban: string;
  gridixCurrency: string;
  logoUrl?: string;
  stampUrl?: string;
}

export function createGeorgianInvoiceTemplate(data: InvoiceData) {
  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      fontSize: 10
    },
    content: [
      // Header with logo and invoice number
      {
        columns: [
          {
            width: '*',
            stack: [
              {
                text: 'საფაქტურო',
                fontSize: 24,
                bold: true,
                color: '#1f2937'
              },
              {
                text: `ნომერი: ${data.invoiceNumber}`,
                fontSize: 14,
                margin: [0, 5, 0, 0]
              },
              {
                text: `თარიღი: ${data.date}`,
                fontSize: 12,
                color: '#6b7280'
              }
            ]
          },
          ...(data.logoUrl ? [{
            width: 120,
            image: data.logoUrl,
            fit: [120, 60],
            alignment: 'right'
          }] : [])
        ],
        margin: [0, 0, 0, 20]
      },

      // Company details table
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                text: 'გადამხდელი (Payer)',
                fontSize: 12,
                bold: true,
                color: '#374151'
              },
              {
                text: 'მიმღები (Payee)',
                fontSize: 12,
                bold: true,
                color: '#374151'
              }
            ],
            [
              {
                stack: [
                  { text: data.companyName, fontSize: 14, bold: true },
                  { text: `საიდენტიფიკაციო კოდი: ${data.companyTaxId}`, fontSize: 10 },
                  { text: data.companyAddress, fontSize: 10 },
                  { text: `ტელ: ${data.companyPhone}`, fontSize: 10 },
                  { text: `ელ-ფოსტა: ${data.companyEmail}`, fontSize: 10 }
                ]
              },
              {
                stack: [
                  { text: data.gridixName, fontSize: 14, bold: true },
                  { text: `საიდენტიფიკაციო კოდი: ${data.gridixTaxId}`, fontSize: 10 },
                  { text: `ბანკი: ${data.gridixBank}`, fontSize: 10 },
                  { text: `IBAN: ${data.gridixIban}`, fontSize: 10 }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb'
        },
        margin: [0, 0, 0, 20]
      },

      // Payment details
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              {
                text: 'გადახდის მიზანი (Payment Purpose)',
                fontSize: 12,
                bold: true,
                color: '#374151'
              },
              {
                text: 'თანხა (Amount)',
                fontSize: 12,
                bold: true,
                color: '#374151'
              }
            ],
            [
              {
                text: data.paymentPurpose,
                fontSize: 11
              },
              {
                text: `${data.totalPrice.toFixed(2)} ${data.gridixCurrency}`,
                fontSize: 14,
                bold: true,
                color: '#059669'
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb'
        },
        margin: [0, 0, 0, 20]
      },

      // Service details
      {
        table: {
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'სერვისი', fontSize: 12, bold: true, color: '#374151' },
              { text: 'ხანგრძლივობა', fontSize: 12, bold: true, color: '#374151' },
              { text: 'ფასი/თვე', fontSize: 12, bold: true, color: '#374151' },
              { text: 'ჯამი', fontSize: 12, bold: true, color: '#374151' }
            ],
            [
              { text: `${data.planName} - ${data.projectName}`, fontSize: 11 },
              { text: `${data.durationMonths} თვე`, fontSize: 11 },
              { text: `${data.monthlyPrice.toFixed(2)} ${data.gridixCurrency}`, fontSize: 11 },
              { text: `${data.totalPrice.toFixed(2)} ${data.gridixCurrency}`, fontSize: 11, bold: true }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb'
        },
        margin: [0, 0, 0, 30]
      },

      // Footer with bank details and signature
      {
        columns: [
          {
            width: '*',
            stack: [
              {
                text: 'ბანკის დეტალები:',
                fontSize: 12,
                bold: true,
                margin: [0, 0, 0, 5]
              },
              {
                text: `ბანკი: ${data.gridixBank}`,
                fontSize: 10
              },
              {
                text: `IBAN: ${data.gridixIban}`,
                fontSize: 10
              },
              {
                text: `ვალუტა: ${data.gridixCurrency}`,
                fontSize: 10
              }
            ]
          },
          {
            width: 150,
            stack: [
              ...(data.stampUrl ? [{
                image: data.stampUrl,
                fit: [150, 80],
                alignment: 'center'
              }] : []),
              {
                text: 'ფინანსური განყოფილება GRIDIX',
                fontSize: 10,
                alignment: 'center',
                margin: [0, 10, 0, 0]
              }
            ]
          }
        ]
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      }
    }
  };
}
