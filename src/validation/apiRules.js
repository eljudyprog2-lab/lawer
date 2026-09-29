/**
 * SINGLE SOURCE OF TRUTH for API validation rules and field constraints.
 * Generated automatically from live API discovery against https://law.elmoroj.com/api.
 */

export const apiRules = {
  login: {
    login: {
      required: true,
      min: 3,
      max: 255,
      type: 'string',
      source: 'API response (422 "The login field is required.")',
      messages: {
        required: 'البريد الإلكتروني أو الهاتف مطلوب',
        min: 'يجب أن لا يقل عن 3 أحرف',
        max: 'الحد الأقصى 255 حرفاً',
      },
      helperText: 'أدخل البريد الإلكتروني أو رقم الهاتف المسجل',
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
      source: 'API response (Laravel validation rule in:admin,lawyer,owner)',
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
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
      pattern: /^\d+$/,
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
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      source: 'API response ("must be a valid email address")',
      messages: {
        invalid: 'صيغة البريد الإلكتروني غير صحيحة',
      },
    },
    phone: {
      required: false,
      max: 20,
      type: 'phone',
      pattern: /^\d+$/,
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
      pattern: /^\d+$/,
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
      pattern: /^\d+$/,
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

  lookups: {
    name: {
      required: true,
      min: 1,
      max: 255,
      type: 'string',
      source: 'API response ("The name field must not be greater than 255 characters.")',
      messages: {
        required: 'اسم الخيار مطلوب',
        max: 'الاسم لا يتجاوز 255 حرفاً',
      },
    },
    description: {
      required: false,
      max: 500,
      type: 'string',
      messages: {
        max: 'الوصف لا يتجاوز 500 حرف',
      },
    },
  },

  appointments: {
    appointment_date: {
      required: true,
      type: 'string',
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      source: 'API response ("The appointment date field is required.")',
      messages: {
        required: 'تاريخ الموعد مطلوب',
        invalid: 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)',
      },
    },
    appointment_time: {
      required: true,
      type: 'string',
      source: 'API response ("The appointment time field is required.")',
      messages: {
        required: 'وقت الموعد مطلوب',
        invalid: 'صيغة الوقت غير صحيحة',
      },
    },
    appointment_type: {
      required: true,
      type: 'enum',
      allowedValues: ['استشارة', 'اجتماع', 'أخرى'],
      source: 'API response ("The selected appointment type is invalid.")',
      messages: {
        required: 'نوع الموعد مطلوب',
        invalid: 'نوع الموعد غير صالح',
      },
    },
    status: {
      required: false,
      type: 'enum',
      allowedValues: ['معلق', 'مؤكد', 'قيد الانتظار', 'ملغي', 'غير معين'],
      source: 'API response ("The selected status is invalid.")',
      messages: {
        invalid: 'حالة الموعد غير صالحة',
      },
    },
    client_id: {
      required: true,
      type: 'integer',
      source: 'API requirement in admin portal',
      messages: {
        required: 'الموكل مطلوب',
        invalid: 'الموكل المحدد غير صالح',
      },
    },
    notes: {
      required: false,
      max: 1000,
      type: 'string',
      messages: {
        max: 'الملاحظات لا يجب أن تتجاوز 1000 حرف',
      },
    },
  },

  documents: {
    company_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The company id field is required.")',
    },
    title: {
      required: true,
      max: 255,
      type: 'string',
      source: 'API response ("The title field is required.", "must not be greater than 255 characters.")',
      messages: {
        required: 'اسم/عنوان المستند مطلوب',
        max: 'اسم المستند لا يتجاوز 255 حرفاً',
      },
    },
    file: {
      required: true,
      type: 'file',
      source: 'API response ("The file field is required.", "must be a file.")',
      messages: {
        required: 'يرجى اختيار ملف لرفعه',
        invalid: 'الملف المرفق غير صالح',
      },
    },
    document_type: {
      required: false,
      max: 100,
      type: 'string',
      source: 'API response ("The document type field must not be greater than 100 characters.")',
      messages: {
        max: 'نوع المستند لا يتجاوز 100 حرف',
      },
    },
    case_id: {
      required: false,
      type: 'integer',
      source: 'API response ("The selected case id is invalid.")',
    },
    notes: {
      required: false,
      type: 'string',
    },
    description: {
      required: false,
      type: 'string',
    },
  },

  invoices: {
    company_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The company id field is required.")',
    },
    invoice_number: {
      required: true,
      type: 'string',
      source: 'API response ("The invoice number field is required.", "The invoice number has already been taken.")',
      messages: {
        required: 'رقم الفاتورة مطلوب',
        unique: 'رقم الفاتورة مسجل مسبقاً',
      },
    },
    client_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The client id field is required.")',
      messages: {
        required: 'الموكل مطلوب',
      },
    },
    issue_date: {
      required: true,
      type: 'date',
      source: 'API response ("The issue date field is required.", "must be a valid date.")',
      messages: {
        required: 'تاريخ الإصدار مطلوب',
        invalid: 'تاريخ الإصدار غير صحيح',
      },
    },
    due_date: {
      required: false,
      type: 'date',
      source: 'API response ("must be a valid date.")',
      messages: {
        invalid: 'تاريخ الاستحقاق غير صحيح',
      },
    },
    description: {
      required: true,
      type: 'string',
      source: 'API response ("The description field is required.")',
      messages: {
        required: 'وصف الفاتورة مطلوب',
      },
    },
    total_amount: {
      required: true,
      min: 0,
      type: 'numeric',
      source: 'API response ("The total amount field is required.", "must be at least 0.")',
      messages: {
        required: 'المبلغ الإجمالي مطلوب',
        min: 'المبلغ الإجمالي يجب أن يكون صفراً أو أكثر',
      },
    },
    paid_amount: {
      required: false,
      min: 0,
      type: 'numeric',
      source: 'API response ("The paid amount field must be a number.")',
      messages: {
        invalid: 'المبلغ المدفوع يجب أن يكون رقماً',
      },
    },
    status: {
      required: false,
      type: 'enum',
      allowedValues: ['unpaid', 'paid', 'partial', 'cancelled'],
      source: 'API response ("The selected status is invalid.")',
      messages: {
        invalid: 'حالة الفاتورة غير صالحة',
      },
    },
    payment_method: {
      required: false,
      type: 'enum',
      allowedValues: ['cash', 'bank_transfer', 'credit_card', 'other'],
      source: 'API response ("The selected payment method is invalid.")',
      messages: {
        invalid: 'طريقة الدفع غير صالحة',
      },
    },
    case_id: {
      required: false,
      type: 'integer',
    },
    notes: {
      required: false,
      type: 'string',
    },
  },

  cases: {
    company_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The company id field is required.")',
      messages: {
        required: 'معرف الشركة مطلوب',
      },
    },
    case_number: {
      required: true,
      min: 1,
      max: 100,
      type: 'string',
      source: 'API response ("The case number field is required.", unique)',
      messages: {
        required: 'رقم القضية مطلوب',
        max: 'رقم القضية يجب ألا يتجاوز 100 حرف',
      },
    },
    title: {
      required: true,
      min: 2,
      max: 255,
      type: 'string',
      source: 'API response ("The title field is required.")',
      messages: {
        required: 'عنوان القضية مطلوب',
        min: 'عنوان القضية يجب ألا يقل عن حرفين',
        max: 'عنوان القضية يجب ألا يتجاوز 255 حرفاً',
      },
    },
    type_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The type id field is required.")',
      messages: {
        required: 'نوع القضية مطلوب',
      },
    },
    client_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The client id field is required.")',
      messages: {
        required: 'الموكل مطلوب',
      },
    },
    lawyer_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The lawyer id field is required.")',
      messages: {
        required: 'المحامي المسؤول مطلوب',
      },
    },
    court_name: {
      required: true,
      min: 2,
      max: 255,
      type: 'string',
      source: 'API response ("The court name field is required.")',
      messages: {
        required: 'اسم المحكمة مطلوب',
        min: 'اسم المحكمة يجب ألا يقل عن حرفين',
        max: 'اسم المحكمة يجب ألا يتجاوز 255 حرفاً',
      },
    },
    court_circuit: {
      required: false,
      max: 255,
      type: 'string',
    },
    judge_name: {
      required: false,
      max: 255,
      type: 'string',
    },
    court_case_number: {
      required: false,
      max: 100,
      type: 'string',
    },
    first_session_date: {
      required: false,
      type: 'date',
    },
    next_session_date: {
      required: false,
      type: 'date',
    },
    priority: {
      required: false,
      type: 'enum',
      allowedValues: ['low', 'normal', 'high', 'urgent'],
      source: 'API response ("The selected priority is invalid.")',
      messages: {
        invalid: 'مستوى الأولوية غير صالح',
      },
    },
    stage: {
      required: false,
      type: 'enum',
      allowedValues: ['investigation', 'court', 'appeal', 'execution', 'closed'],
      source: 'API response ("The selected stage is invalid.")',
      messages: {
        invalid: 'المرحلة المحددة غير صالحة',
      },
    },
    status: {
      required: false,
      type: 'enum',
      allowedValues: ['active', 'closed', 'pending'],
      source: 'API response ("The selected status is invalid.")',
      messages: {
        invalid: 'حالة القضية غير صالحة',
      },
    },
  },

  case_documents: {
    company_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The company id field is required.")',
    },
    case_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The case id field is required.")',
    },
    document_type: {
      required: false,
      max: 255,
      type: 'string',
    },
    description: {
      required: false,
      type: 'string',
    },
    file: {
      required: true,
      type: 'file',
      source: 'API response ("The file field is required.")',
      messages: {
        required: 'الملف مطلوب',
      },
    },
  },

  lawyers: {
    company_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The company id field is required.")',
    },
    user_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The user id field is required.")',
    },
    full_name: {
      required: true,
      min: 2,
      max: 255,
      type: 'string',
      source: 'Users API requirement',
      messages: {
        required: 'الاسم الكامل مطلوب',
        min: 'الاسم الكامل يجب ألا يقل عن حرفين',
        max: 'الاسم الكامل لا يتجاوز 255 حرفاً',
      },
    },
    email: {
      required: true,
      max: 255,
      type: 'email',
      source: 'Users API requirement',
      messages: {
        required: 'البريد الإلكتروني مطلوب',
        invalid: 'صيغة البريد الإلكتروني غير صحيحة',
      },
    },
    phone: {
      required: false,
      type: 'phone',
      messages: {
        invalid: 'صيغة رقم الهاتف غير صحيحة',
      },
    },
    national_id: {
      required: false,
      type: 'nationalId',
      messages: {
        invalid: 'رقم الهوية غير صحيح (10-14 رقماً)',
      },
    },
    bar_number: {
      required: false,
      max: 50,
      type: 'string',
      messages: {
        max: 'رقم القيد لا يتجاوز 50 حرفاً',
      },
    },
    specialization: {
      required: false,
      max: 255,
      type: 'string',
    },
    address: {
      required: false,
      max: 255,
      type: 'string',
    },
    status: {
      required: false,
      type: 'enum',
      allowedValues: ['active', 'inactive'],
      messages: {
        invalid: 'حالة المحامي غير صالحة',
      },
    },
  },

  notifications: {
    company_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The company id field is required.")',
    },
    user_id: {
      required: true,
      type: 'integer',
      source: 'API response ("The user id field is required.")',
    },
    title: {
      required: true,
      max: 255,
      type: 'string',
      source: 'API response ("The title field is required.")',
      messages: {
        required: 'عنوان الإشعار مطلوب',
        max: 'عنوان الإشعار لا يتجاوز 255 حرفاً',
      },
    },
    message: {
      required: true,
      type: 'string',
      source: 'API response ("The message field is required.")',
      messages: {
        required: 'نص الإشعار مطلوب',
      },
    },
    type: {
      required: false,
      max: 50,
      type: 'string',
    },
    reference_id: {
      required: false,
      type: 'integer',
    },
    is_read: {
      required: false,
      type: 'boolean',
    },
  },
}



