import { apiClient, extractList, extractItem, parseApiError } from './client'

export { parseApiError }

/** ── Case Types ── */
const TYPES_PATH = '/case-types'

export async function fetchCaseTypes(params = {}) {
  const { data } = await apiClient.get(TYPES_PATH, { params })
  return extractList(data)
}

export async function fetchCaseType(id) {
  const { data } = await apiClient.get(`${TYPES_PATH}/${id}`)
  return extractItem(data)
}

export async function createCaseType(values) {
  const { data } = await apiClient.post(TYPES_PATH, values)
  return extractItem(data)
}

export async function updateCaseType(id, values) {
  const { data } = await apiClient.put(`${TYPES_PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteCaseType(id) {
  const { data } = await apiClient.delete(`${TYPES_PATH}/${id}`)
  return data
}

/** ── Case Categories ── */
const CATEGORIES_PATH = '/case-categories'

export async function fetchCaseCategories(params = {}) {
  const { data } = await apiClient.get(CATEGORIES_PATH, { params })
  return extractList(data)
}

export async function fetchCaseCategory(id) {
  const { data } = await apiClient.get(`${CATEGORIES_PATH}/${id}`)
  return extractItem(data)
}

export async function createCaseCategory(values) {
  const { data } = await apiClient.post(CATEGORIES_PATH, values)
  return extractItem(data)
}

export async function updateCaseCategory(id, values) {
  const { data } = await apiClient.put(`${CATEGORIES_PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteCaseCategory(id) {
  const { data } = await apiClient.delete(`${CATEGORIES_PATH}/${id}`)
  return data
}
