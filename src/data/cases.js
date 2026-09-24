export const caseTypeOptions = [
  'جنائي',
  'أحوال شخصية',
  'عمالي',
  'تجاري',
  'مدني',
  'إداري',
]

export const caseStatusOptions = ['نشطة', 'قيد', 'مؤجل', 'منتهي']

export const priorityOptions = ['عاجل', 'مرتفع', 'عالي', 'عادي', 'منخفض']

export const classificationOptions = [
  'أفراد',
  'قضية عامة',
  'قضية خاصة',
  'استشارة',
  'تحكيم',
]

export const stageOptions = [
  'تحقيق',
  'مرافعة',
  'حجز للحكم',
  'استئناف',
  'تنفيذ',
  'مغلقة',
]

export const eventTypeOptions = [
  'جلسة محكمة',
  'اجتماع',
  'استشارة',
  'مذكرة',
  'حكم',
  'إجراء إداري',
]

export const eventImportanceOptions = ['عاجل', 'مرتفع', 'عادي', 'منخفض']

export const documentTypeOptions = [
  'عقد',
  'هوية',
  'محضر جلسة',
  'مذكرة دفاع',
  'حكم',
  'توكيل',
  'أخرى',
]

export const clientOptions = [
  'محمد أحمد السعيد',
  'فاطمة علي حسن',
  'خالد عبدالله',
  'نورة سعد القحطاني',
  'سامي يوسف',
  'ريم عبدالرحمن',
  'محمود احمد امير',
]

export const lawyerOptions = [
  'أحمد يوسف علي',
  'سارة محمود',
  'عمر حسن',
  'ليلى كريم',
  'يوسف إبراهيم',
]

function baseDetails(overrides = {}) {
  return {
    courtName: 'الرياض',
    circuit: 'الرياض',
    judgeName: 'رجب محمد',
    courtCaseNumber: '87878',
    firstSession: '2026/03/20',
    incidentDate: '2026/03/26',
    powerOfAttorneyDate: '2026/04/09',
    limitationExpiry: '2026/03/31',
    judgmentDeadline: '2026/05/22',
    priority: 'مرتفع',
    classification: 'أفراد',
    stage: 'تحقيق',
    startDate: '2026/03/30',
    description:
      'في يوم الأحد الموافق 10/3/2026، وقعت واقعة سرقة تتعلق بالممتلكات موضوع الدعوى، وتم فتح ملف القضية ومتابعة الإجراءات القانونية أمام المحكمة المختصة.',
    internalNotes: '',
    requiredDocuments: '',
    clientDetails: {
      name: 'محمود احمد امير',
      nationalId: '5245484315',
      phone: '01025547777',
      address: 'الرياض حي الرمال',
    },
    lawyerDetails: {
      name: 'احمد يوسف علي',
      phone: '01147771110',
      email: 'ahmed@gmail.com',
    },
    opponent: 'غير معروف',
    opponentLawyer: 'امير عمر',
    opponentLawyerPhone: '011499991111',
    events: [],
    documents: [],
    ...overrides,
  }
}

export const initialCases = [
  {
    id: '1',
    number: '2025/123',
    title: 'قضية تعويض عن حادث مروري',
    client: 'محمد اشرف',
    lawyer: 'سارة محمود',
    type: 'مدني',
    status: 'قيد',
    nextSession: '2025/09/15',
    ...baseDetails({
      clientDetails: {
        name: 'محمد اشرف',
        nationalId: '',
        phone: '01234567890',
        address: '',
      },
      lawyerDetails: {
        name: 'سارة محمود',
        phone: '0559876543',
        email: 'sara@example.com',
      },
      priority: 'عادي',
      description: 'قضية تعويض عن أضرار ناتجة عن حادث مروري',
      firstSession: '2025/09/03',
    }),
  },
  {
    id: '2',
    number: '45455/2026',
    title: 'قضية انتحال شخصية',
    client: 'فاطمة علي حسن',
    lawyer: 'سارة محمود',
    type: 'جنائي',
    status: 'منتهي',
    nextSession: '—',
    ...baseDetails({
      clientDetails: {
        name: 'فاطمة علي حسن',
        nationalId: '1012345678',
        phone: '0551234567',
        address: 'الرياض - العليا',
      },
      lawyerDetails: {
        name: 'سارة محمود',
        phone: '0559876543',
        email: 'sara@example.com',
      },
      priority: 'عادي',
      description: 'قضية تتعلق بانتحال شخصية وتم الفصل فيها.',
    }),
  },
  {
    id: '3',
    number: '56546/2026',
    title: 'ميراث جديد',
    client: 'خالد عبدالله',
    lawyer: 'عمر حسن',
    type: 'أحوال شخصية',
    status: 'مؤجل',
    nextSession: '2026/09/03',
    ...baseDetails({
      clientDetails: {
        name: 'خالد عبدالله',
        nationalId: '1098765432',
        phone: '0501112233',
        address: 'جدة',
      },
      lawyerDetails: {
        name: 'عمر حسن',
        phone: '0504445566',
        email: 'omar@example.com',
      },
      priority: 'عالي',
      classification: 'قضية خاصة',
      description: 'نزاع حول توزيع تركة بين الورثة.',
    }),
  },
  {
    id: '4',
    number: '42342/2026',
    title: 'نزاع تجاري',
    client: 'نورة سعد القحطاني',
    lawyer: 'ليلى كريم',
    type: 'تجاري',
    status: 'قيد',
    nextSession: '2026/07/28',
    ...baseDetails({
      clientDetails: {
        name: 'نورة سعد القحطاني',
        nationalId: '1087654321',
        phone: '0532223344',
        address: 'الدمام',
      },
      lawyerDetails: {
        name: 'ليلى كريم',
        phone: '0535556677',
        email: 'laila@example.com',
      },
    }),
  },
  {
    id: '5',
    number: '87654/2026',
    title: 'قضية ميراث',
    client: 'سامي يوسف',
    lawyer: 'يوسف إبراهيم',
    type: 'أحوال شخصية',
    status: 'منتهي',
    nextSession: '—',
    ...baseDetails({
      clientDetails: {
        name: 'سامي يوسف',
        nationalId: '1076543210',
        phone: '0543334455',
        address: 'الرياض',
      },
      lawyerDetails: {
        name: 'يوسف إبراهيم',
        phone: '0546667788',
        email: 'yousef@example.com',
      },
    }),
  },
  {
    id: '6',
    number: '23456/2026',
    title: 'فصل تعسفي',
    client: 'ريم عبدالرحمن',
    lawyer: 'أحمد يوسف علي',
    type: 'عمالي',
    status: 'قيد',
    nextSession: '2026/08/01',
    ...baseDetails({
      clientDetails: {
        name: 'ريم عبدالرحمن',
        nationalId: '1065432109',
        phone: '0567778899',
        address: 'الخبر',
      },
      lawyerDetails: {
        name: 'أحمد يوسف علي',
        phone: '01147771110',
        email: 'ahmed@gmail.com',
      },
    }),
  },
  {
    id: '7',
    number: '99887/2026',
    title: 'اعتداء',
    client: 'محمد أحمد السعيد',
    lawyer: 'سارة محمود',
    type: 'جنائي',
    status: 'مؤجل',
    nextSession: '2026/10/15',
    ...baseDetails({
      clientDetails: {
        name: 'محمد أحمد السعيد',
        nationalId: '1054321098',
        phone: '0578889900',
        address: 'مكة',
      },
      lawyerDetails: {
        name: 'سارة محمود',
        phone: '0559876543',
        email: 'sara@example.com',
      },
    }),
  },
  {
    id: '8',
    number: '11223/2026',
    title: 'نفقة زوجية',
    client: 'فاطمة علي حسن',
    lawyer: 'عمر حسن',
    type: 'أحوال شخصية',
    status: 'قيد',
    nextSession: '2026/08/20',
    ...baseDetails({
      clientDetails: {
        name: 'فاطمة علي حسن',
        nationalId: '1012345678',
        phone: '0551234567',
        address: 'الرياض - العليا',
      },
      lawyerDetails: {
        name: 'عمر حسن',
        phone: '0504445566',
        email: 'omar@example.com',
      },
    }),
  },
]

export const emptyCaseForm = {
  number: '',
  title: '',
  type: '',
  status: 'نشطة',
  courtName: '',
  circuit: '',
  judgeName: '',
  courtCaseNumber: '',
  firstSession: '',
  nextSession: '',
  client: '',
  lawyer: '',
  opponent: '',
  opponentLawyer: '',
  opponentLawyerPhone: '',
  description: '',
  internalNotes: '',
  requiredDocuments: '',
  incidentDate: '',
  powerOfAttorneyDate: '',
  limitationExpiry: '',
  judgmentDeadline: '',
  priority: 'عادي',
  classification: '',
  stage: 'تحقيق',
}

export function normalizeCaseFromForm(payload) {
  return {
    id: String(Date.now()),
    number: payload.number,
    title: payload.title,
    client: payload.client,
    lawyer: payload.lawyer,
    type: payload.type,
    status: payload.status === 'نشطة' ? 'قيد' : payload.status,
    nextSession: payload.nextSession || '—',
    courtName: payload.courtName || '—',
    circuit: payload.circuit || '—',
    judgeName: payload.judgeName || '—',
    courtCaseNumber: payload.courtCaseNumber || '—',
    firstSession: payload.firstSession || '—',
    incidentDate: payload.incidentDate || '—',
    powerOfAttorneyDate: payload.powerOfAttorneyDate || '—',
    limitationExpiry: payload.limitationExpiry || '—',
    judgmentDeadline: payload.judgmentDeadline || '—',
    priority: payload.priority || 'عادي',
    classification: payload.classification || '—',
    stage: payload.stage || 'تحقيق',
    startDate: payload.firstSession || new Date().toISOString().slice(0, 10),
    description: payload.description || 'لا يوجد وصف مسجل.',
    internalNotes: payload.internalNotes || '',
    requiredDocuments: payload.requiredDocuments || '',
    clientDetails: {
      name: payload.client,
      nationalId: '—',
      phone: '—',
      address: '—',
    },
    lawyerDetails: {
      name: payload.lawyer,
      phone: '—',
      email: '—',
    },
    opponent: payload.opponent || 'غير معروف',
    opponentLawyer: payload.opponentLawyer || '—',
    opponentLawyerPhone: payload.opponentLawyerPhone || '—',
    events: [],
    documents: [],
  }
}
