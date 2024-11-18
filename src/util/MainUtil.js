export const MainUtil = {
  getSeverity(status) {
    if (status === 0) {
      return 'danger'
    } else {
      return 'success'
    }
  },

  formatAccountStatus(status) {
    if (status === 0) {
      return 'Pasif'
    } else {
      return 'Aktif'
    }
  },

  showToast(toast, severity, message) {
    var summary = 'Başarılı İşlem'
    if (severity === 'error') {
      summary = 'Hatalı İşlem'
    }
    toast.add({
      severity: severity,
      summary: summary,
      detail: message,
      life: 3000,
    })
  },

  parseCSV(csv) {
    const lines = csv.split('\n')
    const headers = lines[0].split(';').map(header => header.trim())

    return lines
      .slice(1)
      .map(line => {
        if (!line.trim()) return null // Boş satırları atla
        const values = line.split(';')
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = values[index]?.trim()
        })
        return obj
      })
      .filter(item => item) // null değerleri filtrele
  },

  formatDate(date) {
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  },
}
