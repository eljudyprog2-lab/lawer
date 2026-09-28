/**
 * Dynamic permissions bridge.
 *
 * Reads the permissions matrix saved by PermissionsPage (localStorage)
 * and resolves which nav items each roleId is allowed to see.
 *
 * Matrix column keys  →  auth roleId / API role
 *   admin     →  owner  (المستشار العام / Super Admin)
 *   partner   →  admin  (محامي أول / شريك)
 *   trainee   →  lawyer (محامي متدرب)
 *   finance   →  client / secretary (الشؤون الإدارية والمالية)
 *
 * Matrix action keys  →  nav item ids
 *   cases_view / cases_create / cases_delete  →  'cases'
 *   sessions_view / sessions_manage           →  'sessions'
 *   appointments_view / appointments_manage   →  'appointments'
 *   docs_upload / docs_approve                →  'documents'
 *   lawyers_view / lawyers_manage             →  'lawyers'
 *   clients_view / clients_manage             →  'clients'
 *   invoices_issue / invoices_reports         →  'invoices'
 *   lists_manage                              →  'manage-lists'
 *   users_manage                              →  'accounts'
 *
 * The 'permissions' tab is always admin-only (owner/admin) — it is the
 * page that controls the matrix itself, so non-admins must never see it.
 */

const STORAGE_KEY = 'doussary_permissions_matrix'

/**
 * Map from auth roleId (what the user's session stores)
 * to the matrix column key used in PermissionsPage.
 *
 * Both 'owner' and 'admin' API roles map to roleId='admin' in AuthContext,
 * so both share the 'admin' matrix column (full access).
 */
const ROLE_ID_TO_MATRIX_COL = {
  admin: 'admin',    // المستشار العام / مالك  → matrix 'admin' column
  lawyer: 'trainee', // محامي متدرب            → matrix 'trainee' column
  client: 'finance', // الشؤون الإدارية والمالية → matrix 'finance' column
  accountant: 'finance', // محاسب              → matrix 'finance' column
}

/**
 * Which nav item requires at least ONE of these matrix action keys to be `true`
 * for the role's matrix column.  If ANY of the listed keys is true → the tab is visible.
 */
const NAV_TO_MATRIX_KEYS = {
  cases:        ['cases_view', 'cases_create', 'cases_delete'],
  sessions:     ['sessions_view', 'sessions_manage'],
  appointments: ['appointments_view', 'appointments_manage'],
  documents:    ['docs_upload', 'docs_approve'],
  lawyers:      ['lawyers_view', 'lawyers_manage'],
  clients:      ['clients_view', 'clients_manage'],
  invoices:     ['invoices_issue', 'invoices_reports'],
  'manage-lists': ['lists_manage'],
  accounts:     ['users_manage'],
}

/** Nav items that are ALWAYS admin-only regardless of matrix */
const ALWAYS_ADMIN_ONLY = ['permissions']

/** Nav items that are ALWAYS visible for every role */
const ALWAYS_VISIBLE = ['home']

/** Read the saved matrix from localStorage */
function readMatrix() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Resolve which nav item IDs should be HIDDEN for the given roleId.
 *
 * If no saved matrix exists in localStorage, falls back to the
 * hardcoded defaults so the app works out-of-the-box before the
 * admin ever visits PermissionsPage.
 *
 * @param {string} roleId – one of 'admin', 'lawyer', 'client'
 * @returns {string[]} – array of nav item IDs to hide
 */
export function getHiddenNavIds(roleId) {
  // Admin (owner / المستشار العام) always sees everything
  if (roleId === 'admin') return []

  const matrix = readMatrix()

  // No saved matrix yet → use hardcoded defaults
  if (!matrix) return null // signal to caller to use static fallback

  const matrixCol = ROLE_ID_TO_MATRIX_COL[roleId]
  if (!matrixCol) return null // unknown role → use static fallback

  const hidden = []

  // Check each nav item against the matrix
  for (const [navId, actionKeys] of Object.entries(NAV_TO_MATRIX_KEYS)) {
    // If ALL related action keys are false → hide the tab
    const hasAnyPermission = actionKeys.some(
      (key) => matrix[key]?.[matrixCol] === true,
    )
    if (!hasAnyPermission) {
      hidden.push(navId)
    }
  }

  // Always hide permissions page for non-admin
  ALWAYS_ADMIN_ONLY.forEach((id) => {
    if (!hidden.includes(id)) hidden.push(id)
  })

  return hidden
}
