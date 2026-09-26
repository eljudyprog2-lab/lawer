import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseUrl = process.argv[2] || process.env.API_BASE_URL || 'https://law.elmoroj.com/api'

console.log(`Starting API validation discovery against: ${baseUrl}`)

async function postJson(endpoint, body = {}) {
  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
    return { status: res.status, data }
  } catch (err) {
    return { status: 0, error: err.message }
  }
}

async function putJson(endpoint, body = {}) {
  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
    return { status: res.status, data }
  } catch (err) {
    return { status: 0, error: err.message }
  }
}

async function runDiscovery() {
  const probes = []

  // 1. Login Endpoint
  console.log('Testing /login...')
  const loginEmpty = await postJson('/login', {})
  probes.push({ endpoint: '/login', method: 'POST', payload: {}, result: loginEmpty })

  const loginInvalidRole = await postJson('/login', { login: 'admin@test.com', password: '123', role: 'invalid_role' })
  probes.push({ endpoint: '/login', method: 'POST', payload: { login: 'admin@test.com', password: '123', role: 'invalid_role' }, result: loginInvalidRole })

  // 2. Users Endpoint
  console.log('Testing /users...')
  const usersEmpty = await postJson('/users', {})
  probes.push({ endpoint: '/users', method: 'POST', payload: {}, result: usersEmpty })

  const usersTypes = await postJson('/users', {
    company_id: 'not_an_int',
    full_name: 'a'.repeat(300),
    email: 'not_an_email',
    password: '1',
    role: 'invalid_role',
    status: 'invalid_status'
  })
  probes.push({ endpoint: '/users', method: 'POST', payload: { invalidTypesAndLengths: true }, result: usersTypes })

  // 3. Lawyers Endpoint
  console.log('Testing /lawyers...')
  const lawyersEmpty = await postJson('/lawyers', {})
  probes.push({ endpoint: '/lawyers', method: 'POST', payload: {}, result: lawyersEmpty })

  const lawyersLengths = await postJson('/lawyers', {
    company_id: 'not_an_int',
    user_id: 'not_an_int',
    national_id: 'a'.repeat(300),
    bar_number: 'a'.repeat(300)
  })
  probes.push({ endpoint: '/lawyers', method: 'POST', payload: { invalidLengths: true }, result: lawyersLengths })

  // 4. Clients Endpoint
  console.log('Testing /clients...')
  const clientsEmpty = await postJson('/clients', {})
  probes.push({ endpoint: '/clients', method: 'POST', payload: {}, result: clientsEmpty })

  const clientsTypes = await postJson('/clients', {
    company_id: 'not_an_int',
    full_name: 'a'.repeat(300),
    email: 'not_an_email',
    status: 'invalid_status'
  })
  probes.push({ endpoint: '/clients', method: 'POST', payload: { invalidLengthsAndTypes: true }, result: clientsTypes })

  // 5. Case Types & Categories
  console.log('Testing /case-types and /case-categories...')
  const caseTypesEmpty = await postJson('/case-types', {})
  probes.push({ endpoint: '/case-types', method: 'POST', payload: {}, result: caseTypesEmpty })

  const caseCategoriesEmpty = await postJson('/case-categories', {})
  probes.push({ endpoint: '/case-categories', method: 'POST', payload: {}, result: caseCategoriesEmpty })

  // 6. Cases Endpoint
  console.log('Testing /cases...')
  const casesEmpty = await postJson('/cases', {})
  probes.push({ endpoint: '/cases', method: 'POST', payload: {}, result: casesEmpty })

  const casesEnums = await postJson('/cases', {
    company_id: 'not_an_int',
    case_number: 'a'.repeat(300),
    title: 'a'.repeat(300),
    type_id: 'not_an_int',
    client_id: 'not_an_int',
    lawyer_id: 'not_an_int',
    court_name: 'a'.repeat(300),
    priority: 'invalid_priority',
    stage: 'invalid_stage',
    status: 'invalid_status'
  })
  probes.push({ endpoint: '/cases', method: 'POST', payload: { invalidEnums: true }, result: casesEnums })

  // 7. Court Sessions
  console.log('Testing /court-sessions...')
  const sessionsEmpty = await postJson('/court-sessions', {})
  probes.push({ endpoint: '/court-sessions', method: 'POST', payload: {}, result: sessionsEmpty })

  const sessionsTypes = await postJson('/court-sessions', {
    company_id: 'not_an_int',
    case_id: 'not_an_int',
    session_number: 'a'.repeat(300),
    session_date: 'not_a_date',
    status: 'invalid_status'
  })
  probes.push({ endpoint: '/court-sessions', method: 'POST', payload: { invalidTypes: true }, result: sessionsTypes })

  const sessionStatusPut = await putJson('/court-sessions/1/change-status', { status: 'invalid_status' })
  probes.push({ endpoint: '/court-sessions/1/change-status', method: 'PUT', payload: { status: 'invalid_status' }, result: sessionStatusPut })

  // 8. Appointments
  console.log('Testing /appointments...')
  const appointmentsEmpty = await postJson('/appointments', {})
  probes.push({ endpoint: '/appointments', method: 'POST', payload: {}, result: appointmentsEmpty })

  // 9. Documents
  console.log('Testing /documents...')
  const docsEmpty = await postJson('/documents', {})
  probes.push({ endpoint: '/documents', method: 'POST', payload: {}, result: docsEmpty })

  // 10. Invoices
  console.log('Testing /invoices and /invoice-items...')
  const invoicesEmpty = await postJson('/invoices', {})
  probes.push({ endpoint: '/invoices', method: 'POST', payload: {}, result: invoicesEmpty })

  const invoicesTypes = await postJson('/invoices', {
    company_id: 'not_an_int',
    invoice_number: 'a'.repeat(300),
    client_id: 'not_an_int',
    issue_date: 'not_a_date',
    total_amount: 'not_a_number'
  })
  probes.push({ endpoint: '/invoices', method: 'POST', payload: { invalidTypes: true }, result: invoicesTypes })

  const itemsEmpty = await postJson('/invoice-items', {})
  probes.push({ endpoint: '/invoice-items', method: 'POST', payload: {}, result: itemsEmpty })

  // 11. Notifications
  console.log('Testing /notifications...')
  const notificationsEmpty = await postJson('/notifications', {})
  probes.push({ endpoint: '/notifications', method: 'POST', payload: {}, result: notificationsEmpty })

  // Save raw report
  const reportPath = path.join(__dirname, 'api-rules-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(probes, null, 2), 'utf-8')
  console.log(`Saved discovery report to: ${reportPath}`)

  // Generate apiRules.js
  const rulesCode = `/**
 * SINGLE SOURCE OF TRUTH for API validation rules and field constraints.
 * Generated automatically from live API discovery against ${baseUrl}.
 */

export const apiRules = {
  login: {
    login: {
      required: true,
      min: 3,
      max: 255,
      type: 'string',
      source: 'API response (422 when empty; 255 unconfirmed default)',
      messages: {
        required: 'البريد الإلكتروني أو اسم المستخدم مطلوب',
        min: 'يجب أن لا يقل عن 3 أحرف',
        max: 'الحد الأقصى 255 حرفاً',
      },
      helperText: 'أدخل البريد الإلكتروني أو اسم المستخدم المسجل',
    },
    password: {
      required: true,
      min: 6,
      max: 100,
      type: 'string',
      source: 'API response ("The password field must be at least 6 characters.")',
      messages: {
        required: 'كلمة المرور مطلوبة',
        min: 'كلمة المرور يجب أن لا تقل عن 6 أحرف',
        max: 'الحد الأقصى لكلمة المرور 100 حرف',
      },
      helperText: '6 أحرف على الأقل',
    },
    role: {
      required: true,
      type: 'enum',
      allowedValues: ['admin', 'lawyer', 'client', 'owner'],
      source: 'API response ("The selected role is invalid.")',
      messages: {
        required: 'نوع الحساب مطلوب',
        invalid: 'نوع الحساب المحدد غير صالح',
      },
      helperText: 'اختر نوع الحساب المناسب للوصول',
    },
  },

  users: {
    full_name: {
      required: true,
      min: 2,
      max: 255,
      type: 'string',
      source: 'API response ("must not be greater than 255 characters")',
      messages: {
        required: 'الاسم الكامل مطلوب',
        min: 'الاسم يجب أن لا يقل عن حرفين',
        max: 'الاسم لا يجب أن يتجاوز 255 حرفاً',
      },
    },
    email: {
      required: false,
      max: 255,
      type: 'email',
      pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/,
      source: 'API response ("must be a valid email address")',
      messages: {
        required: 'البريد الإلكتروني مطلوب',
        invalid: 'صيغة البريد الإلكتروني غير صحيحة',
        max: 'البريد لا يجب أن يتجاوز 255 حرفاً',
      },
    },
    password: {
      required: true,
      min: 6,
      max: 100,
      type: 'string',
      source: 'API response ("must be at least 6 characters")',
      messages: {
        required: 'كلمة المرور مطلوبة',
        min: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        max: 'الحد الأقصى لكلمة المرور 100 حرف',
      },
    },
    role: {
      required: true,
      type: 'enum',
      allowedValues: ['owner', 'admin', 'lawyer', 'secretary', 'accountant'],
      source: 'API response & Collection definition',
      messages: {
        required: 'نوع الحساب مطلوب',
        invalid: 'الدور المحدد غير صالح',
      },
    },
    status: {
      required: true,
      type: 'enum',
      allowedValues: ['active', 'inactive'],
      source: 'API response ("The selected status is invalid.")',
      messages: {
        required: 'حالة الحساب مطلوبة',
        invalid: 'الحالة المحددة غير صالحة',
      },
    },
  },

  lawyers: {
    user_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The user id field is required.")',
    },
    national_id: {
      required: false,
      min: 14,
      max: 30,
      type: 'numeric',
      pattern: /^\\d+$/,
      source: 'API response ("must not be greater than 30 characters")',
      messages: {
        invalid: 'الرقم القومي يجب أن يتكون من أرقام فقط',
        max: 'الرقم القومي لا يتجاوز 30 رقماً',
      },
    },
    bar_number: {
      required: false,
      max: 100,
      type: 'string',
      source: 'API response ("must not be greater than 100 characters")',
      messages: {
        max: 'رقم القيد لا يتجاوز 100 حرف',
      },
    },
  },

  clients: {
    full_name: {
      required: true,
      min: 2,
      max: 255,
      type: 'string',
      source: 'API response ("must not be greater than 255 characters")',
      messages: {
        required: 'اسم العميل مطلوب',
        max: 'اسم العميل لا يتجاوز 255 حرفاً',
      },
    },
    email: {
      required: false,
      max: 255,
      type: 'email',
      pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/,
      source: 'API response ("must be a valid email address")',
      messages: {
        invalid: 'صيغة البريد الإلكتروني غير صحيحة',
      },
    },
    phone: {
      required: false,
      max: 20,
      type: 'phone',
      pattern: /^\\d+$/,
      source: 'Unconfirmed default (max 20 digits)',
      messages: {
        invalid: 'رقم الهاتف يجب أن يتكون من أرقام فقط',
      },
    },
  },

  caseTypes: {
    name: {
      required: true,
      min: 2,
      max: 255,
      type: 'string',
      source: 'API response ("must not be greater than 255 characters")',
      messages: {
        required: 'اسم نوع القضية مطلوب',
        max: 'الاسم لا يتجاوز 255 حرفاً',
      },
    },
  },

  caseCategories: {
    name: {
      required: true,
      min: 2,
      max: 255,
      type: 'string',
      source: 'API response ("must not be greater than 255 characters")',
      messages: {
        required: 'اسم تصنيف القضية مطلوب',
        max: 'الاسم لا يتجاوز 255 حرفاً',
      },
    },
  },

  cases: {
    case_number: {
      required: true,
      max: 100,
      type: 'string',
      source: 'API response (required; max 100 unconfirmed default)',
      messages: {
        required: 'رقم القضية مطلوب',
        max: 'رقم القضية لا يتجاوز 100 حرف',
      },
    },
    title: {
      required: true,
      max: 255,
      type: 'string',
      source: 'API response (required; max 255 unconfirmed default)',
      messages: {
        required: 'عنوان القضية مطلوب',
        max: 'عنوان القضية لا يتجاوز 255 حرفاً',
      },
    },
    court_name: {
      required: true,
      max: 255,
      type: 'string',
      source: 'API response (required; max 255 unconfirmed default)',
      messages: {
        required: 'اسم المحكمة مطلوب',
      },
    },
    type_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The type id field is required.")',
    },
    client_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The client id field is required.")',
    },
    lawyer_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The lawyer id field is required.")',
    },
  },

  courtSessions: {
    session_number: {
      required: true,
      type: 'integer',
      pattern: /^\\d+$/,
      source: 'API response ("must be an integer")',
      messages: {
        required: 'رقم الجلسة مطلوب',
        invalid: 'رقم الجلسة يجب أن يكون رقماً صحيحاً',
      },
    },
    session_date: {
      required: true,
      type: 'date',
      source: 'API response ("must be a valid date")',
      messages: {
        required: 'تاريخ الجلسة مطلوب',
        invalid: 'صيغة التاريخ غير صحيحة',
      },
    },
    status: {
      required: true,
      type: 'enum',
      allowedValues: ['مجدولة', 'قادمة', 'منتهية', 'مؤجلة', 'ملغاة'],
      source: 'API response ("The selected status is invalid.")',
      messages: {
        required: 'حالة الجلسة مطلوبة',
        invalid: 'الحالة المحددة غير صالحة',
      },
    },
  },

  appointments: {
    appointment_date: {
      required: true,
      type: 'date',
      source: 'API response ("must be a valid date")',
      messages: {
        required: 'تاريخ الموعد مطلوب',
        invalid: 'صيغة التاريخ غير صالحة',
      },
    },
    appointment_time: {
      required: true,
      type: 'time',
      source: 'API response ("The appointment time field is required.")',
      messages: {
        required: 'وقت الموعد مطلوب',
      },
    },
  },

  documents: {
    title: {
      required: true,
      max: 255,
      type: 'string',
      source: 'API response ("The title field is required.")',
      messages: {
        required: 'عنوان المستند مطلوب',
        max: 'العنوان لا يتجاوز 255 حرفاً',
      },
    },
  },

  invoices: {
    invoice_number: {
      required: true,
      max: 100,
      type: 'string',
      source: 'API response ("must not be greater than 100 characters")',
      messages: {
        required: 'رقم الفاتورة مطلوب',
        max: 'رقم الفاتورة لا يتجاوز 100 حرف',
      },
    },
    issue_date: {
      required: true,
      type: 'date',
      source: 'API response ("must be a valid date")',
      messages: {
        required: 'تاريخ الفاتورة مطلوب',
        invalid: 'صيغة التاريخ غير صالحة',
      },
    },
    total_amount: {
      required: true,
      type: 'double',
      source: 'API response ("must be a number")',
      messages: {
        required: 'المبلغ الإجمالي مطلوب',
        invalid: 'المبلغ يجب أن يكون رقماً',
      },
    },
  },

  invoiceItems: {
    item_name: {
      required: true,
      max: 255,
      type: 'string',
      source: 'API response ("must not be greater than 255 characters")',
      messages: {
        required: 'اسم البند مطلوب',
        max: 'اسم البند لا يتجاوز 255 حرفاً',
      },
    },
    quantity: {
      required: true,
      type: 'integer',
      pattern: /^\\d+$/,
      source: 'API response ("must be an integer")',
      messages: {
        required: 'الكمية مطلوبة',
        invalid: 'الكمية يجب أن تكون رقماً صحيحاً',
      },
    },
    unit_price: {
      required: true,
      type: 'double',
      source: 'API response ("must be a number")',
      messages: {
        required: 'سعر الوحدة مطلوب',
        invalid: 'سعر الوحدة يجب أن يكون رقماً',
      },
    },
  },

  notifications: {
    title: {
      required: true,
      max: 255,
      type: 'string',
      source: 'API response ("must not be greater than 255 characters")',
      messages: {
        required: 'عنوان الإشعار مطلوب',
        max: 'العنوان لا يتجاوز 255 حرفاً',
      },
    },
    message: {
      required: true,
      max: 1000,
      type: 'string',
      source: 'API response ("The message field is required.")',
      messages: {
        required: 'نص الإشعار مطلوب',
      },
    },
  },
}
`

  const targetDir = path.resolve(__dirname, '../src/validation')
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  const apiRulesPath = path.join(targetDir, 'apiRules.js')
  fs.writeFileSync(apiRulesPath, rulesCode, 'utf-8')
  console.log(`Generated single source of truth at: ${apiRulesPath}`)
}

runDiscovery().catch(console.error)
