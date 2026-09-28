import { navItems } from './dashboard'
import { getHiddenNavIds } from './permissions'

export const roleLabels = {
  admin: 'المستشار العام',
  lawyer: 'محامي',
  client: 'موكل',
  accountant: 'محاسب',
}

export const dashboardTitles = {
  admin: 'لوحة تحكم المستشار العام',
  lawyer: 'لوحة تحكم المحامي',
  client: 'لوحة تحكم الموكل',
  accountant: 'لوحة تحكم المحاسب',
}

/**
 * Static fallback — used only when the admin hasn't saved a
 * permissions matrix yet (no localStorage entry).
 */
const hiddenNavByRole = {
  lawyer: ['lawyers', 'manage-lists', 'accounts', 'permissions'],
  client: ['lawyers', 'clients', 'manage-lists', 'accounts', 'permissions'],
  accountant: ['lawyers', 'clients', 'manage-lists', 'accounts', 'permissions'],
}

/**
 * Returns the nav items visible to the given roleId.
 *
 * 1. Try dynamic matrix (from PermissionsPage → localStorage).
 * 2. If no matrix → fall back to hardcoded hiddenNavByRole.
 */
export function getNavItems(roleId) {
  // Dynamic permissions from the matrix (returns null when no matrix saved)
  const dynamicHidden = getHiddenNavIds(roleId)

  const hidden = dynamicHidden !== null
    ? dynamicHidden
    : (hiddenNavByRole[roleId] || [])

  return navItems.filter((item) => !hidden.includes(item.id))
}

/** Strips honorifics (أ. / د. / المحامي...) so names coming from
 *  different data sources can still be matched together. */
export function normalizePersonName(name) {
  return String(name || '')
    .replace(/^(أ|ا|د|م)\s*\.\s*/u, '')
    .replace(/^(المحامي|المحامية|المستشار|المستشارة)\s+/u, '')
    .replace(/\s+/gu, ' ')
    .trim()
}

export function isSamePerson(a, b) {
  const first = normalizePersonName(a)
  const second = normalizePersonName(b)
  if (!first || !second) return false
  return first === second || first.includes(second) || second.includes(first)
}
