import { navItems } from './dashboard'

export const roleLabels = {
  admin: 'المستشار العام',
  lawyer: 'محامي',
  client: 'موكل',
}

export const dashboardTitles = {
  admin: 'لوحة تحكم المستشار العام',
  lawyer: 'لوحة تحكم المحامي',
  client: 'لوحة تحكم الموكل',
}

const hiddenNavByRole = {
  lawyer: ['lawyers'],
  client: ['lawyers', 'clients'],
}

export function getNavItems(roleId) {
  const hidden = hiddenNavByRole[roleId] || []
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
