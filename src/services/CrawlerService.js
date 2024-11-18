import axios from 'axios'
import { BASE_URL } from './Parameters'

const MAIN_URL = `${BASE_URL}/crawling`

export const useCrawlerService = () => {
  const fetchFilterDefinitions = async () => {
    try {
      const response = await axios.get(`${MAIN_URL}/filter-definitions`)
      return {
        success: true,
        message: 'İşlem tamamlandı',
        response: response,
      }
    } catch (error) {
      console.error('process error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const deleteOne = async id => {
    try {
      await axios.delete(`${MAIN_URL}/${id}`)
      return {
        success: true,
        message: 'Kayıt başarıyla silindi',
      }
    } catch (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const deleteBatch = async selectedIds => {
    try {
      await axios.post(`${MAIN_URL}/batch-delete`, selectedIds)
      return {
        success: true,
        message: 'Kayıtlar başarıyla silindi',
      }
    } catch (error) {
      console.error('Delete accounts error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const fetchAll = async () => {
    try {
      const response = await axios.get(`${MAIN_URL}/`)
      return {
        success: true,
        response: response,
      }
    } catch (error) {
      console.error('Fetch error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const fetchDetail = async id => {
    try {
      const response = await axios.get(`${MAIN_URL}/${id}`)
      return {
        success: true,
        response: response,
      }
    } catch (error) {
      console.error('Fetch error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const create = async data => {
    try {
      const response = await axios.post(`${MAIN_URL}/`, data)
      return {
        success: true,
        message: 'Kayıt Oluşturuldu',
        response: response,
      }
    } catch (error) {
      console.error('Create error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const update = async data => {
    try {
      const response = await axios.put(`${MAIN_URL}/${data.id}`, data)
      return {
        success: true,
        message: 'Kayıt Güncellendi',
        response: response,
      }
    } catch (error) {
      console.error('Update error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const start = async id => {
    try {
      const response = await axios.get(`${MAIN_URL}/start/${id}`)
      return {
        success: true,
        response: response,
      }
    } catch (error) {
      console.error(error)
      var message = 'Beklenmeyen bir hata oluştu, crawling işlemi başlatılamadı'
      if (error.status == 412) {
        message =
          'Aktif linkedin hesabı veya aktif proxy server bulunamadığı için işlem başlatılamadı, lütfen linkedin hesaplarını ve proxy serverlarını kontrol ediniz'
      }
      return {
        success: false,
        error: message,
      }
    }
  }

  const status = async id => {
    try {
      const response = await axios.get(`${MAIN_URL}/status/${id}`)
      return {
        success: true,
        response: response,
      }
    } catch (error) {
      console.error('Fetch error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const stop = async id => {
    try {
      const response = await axios.get(`${MAIN_URL}/stop/${id}`)
      return {
        success: true,
        response: response,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  return {
    fetchFilterDefinitions,
    deleteOne,
    deleteBatch,
    fetchAll,
    fetchDetail,
    create,
    update,
    start,
    status,
    stop,
  }
}
