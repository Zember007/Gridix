// Georgian invoice template for pdfmake

function splitTextByScript(text: string) {
  const segments: { text: string; font: string }[] = [];
  let currentFont: string | null = null;
  let buffer = "";

  for (const char of text) {
    const code = char.charCodeAt(0);

    // Определяем диапазоны Unicode
    let font: string;
    if (code >= 0x10A0 && code <= 0x10FF) font = "Georgian"; // грузинский
    else font = "Roboto"; // всё остальное (латиница, кириллица и т.п.)

    if (font !== currentFont && buffer) {
      segments.push({ text: buffer, font: currentFont! });
      buffer = "";
    }

    currentFont = font;
    buffer += char;
  }

  if (buffer) segments.push({ text: buffer, font: currentFont! });
  return segments;
}

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
      fontSize: 10,
      font: "Georgian"
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
                text: splitTextByScript(`ნომერი: ${data.invoiceNumber}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 14,
                  margin: [0, 5, 0, 0]
                })),

              },
              {
                text: splitTextByScript(`თარიღი: ${data.date}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 12,
                  color: '#6b7280'
                })),

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
                text: splitTextByScript('გადამხდელი (Payer)').map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 12,
                  bold: true,
                  color: '#374151',
                })),

              },
              {

                text: splitTextByScript('მიმღები (Payee)').map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 12,
                  bold: true,
                  color: '#374151',
                }))
              }
            ],
            [
              {
                stack: [
                  {
                    text: splitTextByScript(data.companyName).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 14,
                      bold: true
                    }))
                  },
                  {
                    text: splitTextByScript(`საიდენტიფიკაციო კოდი: ${data.companyTaxId}`).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 10
                    }))
                  },
                  {
                    text: splitTextByScript(data.companyAddress).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 10
                    }))
                  },
                  {
                    text: splitTextByScript(`ტელ: ${data.companyPhone}`).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 10
                    }))
                  },
                  {
                    text: splitTextByScript(`ელ-ფოსტა: ${data.companyEmail}`).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 10
                    }))
                  }
                ]
              },
              {
                stack: [
                  {
                    text: splitTextByScript(data.gridixName).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 14,
                      bold: true
                    }))
                  },
                  {
                    text: splitTextByScript(`საიდენტიფიკაციო კოდი: ${data.gridixTaxId}`).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 10
                    }))
                  },
                  {
                    text: splitTextByScript(`ბანკი: ${data.gridixBank}`).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 10
                    }))
                  },
                  {
                    text: splitTextByScript(`IBAN: ${data.gridixIban}`).map(segment => ({
                      text: segment.text,
                      font: segment.font,
                      fontSize: 10
                    }))
                  }
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
                text: splitTextByScript('გადახდის მიზანი (Payment Purpose)').map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 12,
                  bold: true,
                  color: '#374151'
                }))

              },
              {
                text: splitTextByScript('თანხა (Amount)').map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 12,
                  bold: true,
                  color: '#374151'
                })),
              
              }
            ],
            [
              {
                text: splitTextByScript(data.paymentPurpose).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 11
                }))
              },
              {
                text: `${data.totalPrice.toFixed(2)} ${data.gridixCurrency}`,
                fontSize: 14,
                font: 'Roboto',
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
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'სერვისი', fontSize: 12, bold: true, color: '#374151' },
              { text: 'ხანგრძლივობა', fontSize: 12, bold: true, color: '#374151' },
              { text: 'ფასი/თვე', fontSize: 12, bold: true, color: '#374151' },
              { text: 'ფასდაკლება', fontSize: 12, bold: true, color: '#374151' },
              { text: 'ჯამი', fontSize: 12, bold: true, color: '#374151' }
            ],
            [
              {
                text: splitTextByScript(`${data.planName} - ${data.projectName}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 11
                }))
              },
              {
                text: splitTextByScript(`${data.durationMonths} თვე`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 11
                }))
              },
              {
                text: splitTextByScript(`${data.monthlyPrice.toFixed(2)} ${data.gridixCurrency}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 11
                }))
              },
              {
                text: splitTextByScript(data.discountPercentage > 0 ? `${data.discountPercentage}%` : 'ფასდაკლება არ არის').map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 11,
                  color: data.discountPercentage > 0 ? '#059669' : '#6b7280'
                }))
              },
              {
                text: splitTextByScript(`${data.totalPrice.toFixed(2)} ${data.gridixCurrency}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 11,
                  bold: true
                }))
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
                text: splitTextByScript(`ბანკი: ${data.gridixBank}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 10
                })),
              },
              {
                text: splitTextByScript(`IBAN: ${data.gridixIban}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 10
                })),
              },
              {
                text: splitTextByScript(`ვალუტა: ${data.gridixCurrency}`).map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 10
                })),
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
                text: splitTextByScript('ფინანსური განყოფილება GRIDIX').map(segment => ({
                  text: segment.text,
                  font: segment.font,
                  fontSize: 10,
                  alignment: 'center',
                  margin: [0, 10, 0, 0]
                })),
              
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
