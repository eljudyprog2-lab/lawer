/**
 * Centralized Arabic translations and enum mappings.
 * Single source of truth for all user-facing statuses, roles, plans, and error messages.
 * Never outputs raw English strings to the UI.
 */

// ── Statuses ──
export const STATUS_TRANSLATIONS = {
  // General & User / Company
  active: 'نشط',
  inactive: 'غير نشط',
  pending: 'قيد الانتظار',
  suspended: 'موقوف',
  expired: 'منتهي',
  archived: 'مؤرشف',

  // Cases
  open: 'مفتوحة',
  closed: 'مغلقة',
  in_progress: 'قيد النظر',
  'in-progress': 'قيد النظر',
  under_review: 'قيد المراجعة',
  judged: 'محكومة',

  // Sessions / Hearings
  upcoming: 'قادمة',
  completed: 'منعقدة',
  cancelled: 'ملغاة',
  canceled: 'ملغاة',
  postponed: 'مؤجلة',

  // Invoices & Payments
  paid: 'مدفوعة',
  unpaid: 'غير مدفوعة',
  partial: 'مدفوعة جزئياً',
  partially_paid: 'مدفوعة جزئياً',
  overdue: 'متأخرة',
  draft: 'مسودة',

  // Appointments
  scheduled: 'مجدول',
  confirmed: 'مؤكد',
}

// ── Roles ──
export const ROLE_TRANSLATIONS = {
  owner: 'مالك',
  admin: 'المستشار العام',
  superadmin: 'المدير العام',
  super_admin: 'المدير العام',
  lawyer: 'محامي',
  client: 'موكل',
  secretary: 'سكرتير',
  accountant: 'محاسب',
  paralegal: 'مساعد قانوني',
  consultant: 'مستشار',
  user: 'مستخدم',
}

// ── Subscription Plans ──
export const PLAN_TRANSLATIONS = {
  trial: 'تجريبي',
  basic: 'أساسي',
  professional: 'احترافي',
  enterprise: 'مؤسسي',
}

// ── Appointment Types ──
export const APPOINTMENT_TYPE_TRANSLATIONS = {
  consultation: 'استشارة قانونية',
  case_followup: 'متابعة قضية',
  followup: 'متابعة قضية',
  court_hearing: 'حضور جلسة',
  contract_signing: 'توقيع عقود',
  general: 'موعد عام',
}

// ── Common API Error Translations ──
export const API_ERROR_TRANSLATIONS = {
  'unauthenticated.': 'انتهت صلاحية الجلسة. يُرجى تسجيل الدخول مجدداً.',
  'unauthenticated': 'انتهت صلاحية الجلسة. يُرجى تسجيل الدخول مجدداً.',
  'unauthorized.': 'ليس لديك الصلاحية الكافية لإتمام هذا الإجراء.',
  'unauthorized': 'ليس لديك الصلاحية الكافية لإتمام هذا الإجراء.',
  'the given data was invalid.': 'البيانات المدخلة غير صالحة. يُرجى مراجعة الحقول المطلوبة.',
  'the email has already been taken.': 'البريد الإلكتروني مسجل مسبقاً في النظام.',
  'the phone has already been taken.': 'رقم الهاتف مسجل مسبقاً في النظام.',
  'invalid credentials.': 'بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور.',
  'these credentials do not match our records.': 'بيانات الاعتماد المدخلة غير مطابقة لسجلاتنا.',
  'server error': 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً.',
  'not found': 'لم يتم العثور على السجل المطلوب.',
  'not found.': 'لم يتم العثور على السجل المطلوب.',
  'too many requests.': 'تم تجاوز عدد المحاولات المسموح به. يُرجى الانتظار قليلاً.',
  'too many requests': 'تم تجاوز عدد المحاولات المسموح به. يُرجى الانتظار قليلاً.',
  'csrf token mismatch.': 'انتهت صلاحية رمز الأمان. يُرجى تحديث الصفحة والمحاولة مجدداً.',
  'network error': 'تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى.',
}

// ── Helper Resolvers with Safe Neutral Arabic Fallbacks ──

export function translateStatus(status, fallback = 'غير محدد') {
  if (!status) return fallback
  const key = String(status).toLowerCase().trim()
  return STATUS_TRANSLATIONS[key] || fallback
}

export function translateRole(role, fallback = 'مستخدم') {
  if (!role) return fallback
  const key = String(role).toLowerCase().trim()
  return ROLE_TRANSLATIONS[key] || fallback
}

export function translatePlan(plan, fallback = 'أساسي') {
  if (!plan) return fallback
  const key = String(plan).toLowerCase().trim()
  return PLAN_TRANSLATIONS[key] || fallback
}

export function translateAppointmentType(type, fallback = 'استشارة') {
  if (!type) return fallback
  const key = String(type).toLowerCase().trim()
  return APPOINTMENT_TYPE_TRANSLATIONS[key] || fallback
}

export function translateApiErrorMessage(message) {
  if (!message) return 'حدث خطأ غير متوقع. حاول مرة أخرى.'
  const text = String(message).trim()
  const key = text.toLowerCase()

  if (API_ERROR_TRANSLATIONS[key]) {
    return API_ERROR_TRANSLATIONS[key]
  }

  // Partial match checks for standard Laravel validation sentences
  if (/email.*taken/i.test(text)) return 'البريد الإلكتروني مسجل مسبقاً في النظام.'
  if (/phone.*taken/i.test(text)) return 'رقم الهاتف مسجل مسبقاً في النظام.'
  if (/password.*required/i.test(text)) return 'حقل كلمة المرور مطلوب.'
  if (/password.*at least/i.test(text)) return 'كلمة المرور يجب ألا تقل عن 6 أحرف.'
  if (/unauthenticated/i.test(text)) return 'انتهت صلاحية الجلسة. يُرجى تسجيل الدخول مجدداً.'
  if (/credentials.*match/i.test(text)) return 'بيانات الاعتماد المدخلة غير صحيحة.'
  if (/not found/i.test(text)) return 'لم يتم العثور على السجل المطلوب.'
  if (/network error/i.test(text)) return 'تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.'

  // Database Foreign Key / Integrity Constraints
  if (/foreign key constraint|integrity constraint violation|cannot delete.*parent row|1451/i.test(text)) {
    return 'لا يمكن حذف هذا العنصر لوجود بيانات وسجلات أخرى مرتبطة به في النظام (مثل القضايا أو الجلسات). يُرجى فك الارتباط أولاً.'
  }

  // If the message contains English letters, convert to neutral Arabic message
  if (/[a-zA-Z]{3,}/.test(text) && !/[\u0600-\u06FF]/.test(text)) {
    return 'تعذر إتمام العملية من الخادم. يُرجى مراجعة البيانات المدخلة والمحاولة مرة أخرى.'
  }

  return text
}
