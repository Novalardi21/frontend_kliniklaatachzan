export function downloadFile(
  name: string,
  text: string,
  type = 'text/plain;charset=utf-8'
) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const columns = Object.keys(rows[0]!)
  const escape = (value: unknown) => {
    let text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }
  downloadFile(
    name,
    '\uFEFF' +
      [
        columns.map(escape).join(','),
        ...rows.map((row) => columns.map((key) => escape(row[key])).join(','))
      ].join('\r\n'),
    'text/csv;charset=utf-8'
  )
}
