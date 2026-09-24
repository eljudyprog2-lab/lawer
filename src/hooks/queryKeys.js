/** TanStack Query key factories — shared shape for cache invalidation. */

function entityKeys(root) {
  return {
    all: [root],
    lists: () => [root, 'list'],
    list: (params = {}) => [root, 'list', params],
    details: () => [root, 'detail'],
    detail: (id) => [root, 'detail', id],
  }
}

export const companyKeys = entityKeys('companies')
export const userKeys = entityKeys('users')
export const clientKeys = entityKeys('clients')
export const lawyerKeys = entityKeys('lawyers')
export const caseKeys = entityKeys('cases')
export const caseTypeKeys = entityKeys('caseTypes')
export const caseCategoryKeys = entityKeys('caseCategories')
export const documentKeys = entityKeys('documents')
export const appointmentKeys = entityKeys('appointments')
export const notificationKeys = entityKeys('notifications')

export const invoiceKeys = {
  ...entityKeys('invoices'),
  dash: (params = {}) => ['invoices', 'dashboard', params],
}

export const sessionKeys = {
  ...entityKeys('sessions'),
  kpis: (params = {}) => ['sessions', 'kpis', params],
  calendar: (params = {}) => ['sessions', 'calendar', params],
}

export const dashboardKeys = {
  all: ['dashboard'],
  stats: () => ['dashboard', 'stats'],
}
