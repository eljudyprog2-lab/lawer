export const currentUser = {
  name: 'مدير النظام',
  role: 'المستشار العام',
  type: 'المستشار العام',
  initials: 'ما',
  email: 'admin@test.com',
  phone: '01000000000',
  address: '',
  nationalId: '',
  status: 'نشط',
  balance: 0,
  notifications: 4,
}

export const stats = [
  { id: 'cases', label: 'قضايا', value: '1', tone: 'gold', icon: 'cases' },
  { id: 'appointments', label: 'مواعيدي', value: '2', tone: 'teal', icon: 'calendar' },
  { id: 'today', label: 'مواعيد اليوم', value: '0', tone: 'muted', icon: 'clock' },
  { id: 'balance', label: 'الرصيد', value: '5,000.00 ج.م', tone: 'success', icon: 'invoices' },
  { id: 'total', label: 'إجمالي القضايا', value: '1', tone: 'gold', icon: 'folder' },
  { id: 'closed', label: 'قضايا منتهية', value: '0', tone: 'teal', icon: 'check' },
  { id: 'week', label: 'مواعيد الأسبوع', value: '0', tone: 'muted', icon: 'appointments' },
  { id: 'sessions', label: 'جلسات قادمة', value: '0', tone: 'success', icon: 'sessions' },
]

export const caseUpdates = [
  { id: 1, title: 'سرقة', sessionDate: '2023/12/25', status: 'نشط' },
  { id: 2, title: 'قضية انتحال شخصية', sessionDate: '2023/12/20', status: 'نشط' },
  { id: 3, title: 'ميراث جديد', sessionDate: '2023/11/15', status: 'نشط' },
  { id: 4, title: 'نزاع تجاري', sessionDate: '2023/10/08', status: 'نشط' },
]

export const upcomingAppointments = []

export const activities = [
  { id: 1, text: 'موعد اجتماع في 2023/5/2', type: 'appointment' },
  { id: 2, text: 'موعد استشارة في 2023/12/6', type: 'consultation' },
  { id: 3, text: 'تحديث مستند قضية سرقة', type: 'document' },
  { id: 4, text: 'إضافة موكل جديد إلى النظام', type: 'client' },
]

export const navItems = [
  { id: 'home', label: 'الرئيسية', path: '/', icon: 'home' },
  { id: 'cases', label: 'القضايا', path: '/cases', icon: 'cases' },
  { id: 'sessions', label: 'الجلسات', path: '/sessions', icon: 'sessions' },
  { id: 'appointments', label: 'المواعيد', path: '/appointments', icon: 'appointments' },
  { id: 'documents', label: 'المستندات', path: '/documents', icon: 'documents' },
  { id: 'lawyers', label: 'المحامين', path: '/lawyers', icon: 'lawyers' },
  { id: 'clients', label: 'الموكلين', path: '/clients', icon: 'clients' },
  { id: 'invoices', label: 'الفواتير', path: '/invoices', icon: 'invoices' },
]

export const firm = {
  name: 'مكتب الدوسري للمحاماة والاستشارات القانونية',
  shortName: 'مكتب الدوسري',
  phone: '+966 55 550 5922',
  email: 'khalf_law@outlook.com',
  address: 'الرياض - حي العليا - شارع العليا العام',
}
