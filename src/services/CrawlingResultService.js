import axios from 'axios'
import { BASE_URL } from './Parameters'
import { MainUtil } from '@/util/MainUtil'

const MAIN_URL = `${BASE_URL}/crawling/result`

export const useCrawlingResultService = () => {
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

  const fetchOne = async id => {
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

  const fetchAll = async (page, size, filters) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      })

      if (filters.fullName.length > 0) {
        params.append('fullName', filters.fullName)
      }
      if (filters.status) {
        params.append('status', filters.status)
      }

      if (filters.crawlDate) {
        params.append(
          'crawlDateBegin',
          MainUtil.formatDate(filters.crawlDate[0]),
        )
        params.append('crawlDateEnd', MainUtil.formatDate(filters.crawlDate[1]))
      }

      if (filters.processDate) {
        params.append(
          'processDateBegin',
          MainUtil.formatDate(filters.processDate[0]),
        )
        params.append(
          'processDateEnd',
          MainUtil.formatDate(filters.processDate[1]),
        )
      }

      const response = await axios.get(`${MAIN_URL}/?${params.toString()}`)
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
    fetchOne,
    fetchAll,
  }
}
