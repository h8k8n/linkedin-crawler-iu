import axios from 'axios'
import { BASE_URL } from './Parameters'

const MAIN_URL = `${BASE_URL}/linkedin-account`

export const useLinkedinAccountService = () => {
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

  const changeStatusAccounts = async (selectedIds, newStatus) => {
    try {
      await axios.post(`${MAIN_URL}/change-status`, {
        idList: selectedIds,
        status: newStatus,
      })
      return {
        success: true,
        message:
          newStatus === 0
            ? 'Seçili Hesaplar pasif yapıldı'
            : 'Seçili Hesaplar aktif yapıldı',
      }
    } catch (error) {
      console.error('Change status error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const create = async accountList => {
    try {
      const response = await axios.post(`${MAIN_URL}/`, {
        linkedinAccountList: accountList,
      })
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

  return {
    deleteOne,
    deleteBatch,
    fetchAll,
    changeStatusAccounts,
    create,
    update,
  }
}
