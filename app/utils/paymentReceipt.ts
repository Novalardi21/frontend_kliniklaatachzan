import { jsPDF } from 'jspdf'

export function createPaymentReceipt(
  details: [string, string][],
  amounts: [string, string][]
) {
  const pdf = new jsPDF({ format: 'a5', unit: 'mm', putOnlyUsedFonts: true })
  const width = pdf.internal.pageSize.getWidth()
  const left = 13
  const right = width - left
  const contentWidth = right - left
  let y = 52

  pdf.setProperties({ title: 'Kuitansi Pembayaran', author: 'Klinik Laa Tachzan' })
  pdf.setFillColor('#195941')
  pdf.rect(0, 0, width, 39, 'F')
  pdf.setTextColor('#ffffff')
  pdf.setFontSize(11)
  pdf.text('KLINIK LAA TACHZAN', left, 15)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(23)
  pdf.text('Kuitansi Pembayaran', left, 28)
  pdf.setFontSize(10)
  pdf.setFillColor('#e7f4ed')
  pdf.roundedRect(right - 19, 9, 19, 9, 2, 2, 'F')
  pdf.setTextColor('#195941')
  pdf.text('LUNAS', right - 9.5, 15, { align: 'center' })

  for (const [label, value] of details) {
    if (y > 190) {
      pdf.addPage()
      y = 17
    }
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor('#57645e')
    pdf.text(label, left, y)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor('#182820')
    const lines: string[] = pdf.splitTextToSize(value, contentWidth - 43)
    for (const line of lines) {
      if (y > 190) {
        pdf.addPage()
        y = 17
      }
      pdf.text(line, left + 43, y)
      y += 5
    }
    y += 4
  }

  if (y + 54 > 200) {
    pdf.addPage()
    y = 17
  }
  pdf.setFillColor('#edf5f0')
  pdf.roundedRect(left, y, contentWidth, 36, 3, 3, 'F')
  for (const [index, [label, value]] of amounts.entries()) {
    pdf.setFont('helvetica', index === 0 ? 'bold' : 'normal')
    pdf.setFontSize(index === 0 ? 12 : 10)
    pdf.setTextColor('#195941')
    pdf.text(label, left + 5, y + 9 + index * 10)
    pdf.text(value, right - 5, y + 9 + index * 10, { align: 'right' })
  }
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor('#57645e')
  pdf.text('Terima kasih telah mempercayakan layanan kepada kami.', left, y + 48)
  return pdf
}
