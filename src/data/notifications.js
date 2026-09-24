export const initialNotifications = [
  {
    id: '1',
    title: 'فاتورة جديدة',
    message:
      'تم إنشاء فاتورة جديدة رقم INV-202603-1465 بمبلغ 5,000.00 ج.م للعميل ID: 34',
    timeAgo: 'منذ ٣ أشهر',
    read: false,
    type: 'invoice',
  },
  {
    id: '2',
    title: 'موعد يحتاج تعيين محامي',
    message:
      'الموكل mohamed ashraf sayed لديه موعد بتاريخ 2025-12-04 الساعة 14:47:00 من نوع أخرى',
    timeAgo: 'منذ ٣ أشهر',
    read: false,
    type: 'appointment',
  },
  {
    id: '3',
    title: 'موعد يحتاج تعيين محامي',
    message:
      'الموكل mohamed ashraf sayed لديه موعد بتاريخ 2025-12-04 الساعة 00:17:00 من نوع استشارة',
    timeAgo: 'منذ ٣ أشهر',
    read: true,
    type: 'appointment',
  },
  {
    id: '4',
    title: 'دفعة جديدة',
    message:
      'Received payment of 21.00 EGP from mohamed ashraf for invoice INV-202509-0866',
    timeAgo: 'منذ 10 أشهر',
    read: true,
    type: 'payment',
  },
]
