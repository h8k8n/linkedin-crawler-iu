import axios from 'axios'
import { BASE_URL } from './Parameters'
import { MainUtil } from '@/util/MainUtil'

const MAIN_URL = `${BASE_URL}/linkedin-profile`

export const useProfileDataService = () => {
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

  const fetchAll = async (page, size, filters, sortField, sortOrder) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      })

      if (filters.fullName.length > 0) {
        params.append('fullName', filters.fullName)
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

      if (filters.companies.length > 0) {
        params.append('companies', filters.companies)
      }

      if (filters.titles.length > 0) {
        params.append('titles', filters.titles)
      }

      if (filters.schools.length > 0) {
        params.append('schools', filters.schools)
      }

      if (filters.departments.length > 0) {
        params.append('departments', filters.departments)
      }

      if (sortField) {
        params.append('sortField', sortField)
        params.append('sortOrder', sortOrder)
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

  const fetchDetail = async (id, profileId) => {
    try {
      const params = new URLSearchParams()
      if (id) {
        params.append('id', id)
      } else if (profileId) {
        params.append('profileId', profileId)
      }
      const response = await axios.get(
        `${MAIN_URL}/detail/?${params.toString()}`,
      )
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
    fetchDetail,
  }
}
