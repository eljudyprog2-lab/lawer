import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { useNotifications, useNotificationMutations } from '../../hooks/useNotifications'

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, error, refetch } = useNotifications()
  const { markRead, remove } = useNotificationMutations()

  const markAllRead = async () => {
    const unread = notifications.filter((item) => !item.read)
    await Promise.allSettled(unread.map((item) => markRead.mutateAsync(item.id)))
  }

  const removeOne = async (id) => {
    try {
      await remove.mutateAsync(id)
    } catch {
      /* toast handled via error state on refetch if needed */
    }
  }

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return
    try {
      await markRead.mutateAsync(id)
    } catch {
      /* ignore — list stays consistent via query invalidate */
    }
  }

  return (
    <div className="notifications-page">
      <div className="cases-toolbar">
        <h2 className="cases-toolbar__title">
          <Icon name="bell" size={22} />
          الإشعارات
          {unreadCount > 0 ? (
            <span className="notifications-count">{unreadCount} غير مقروء</span>
          ) : null}
        </h2>
        <div className="cases-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isLoading}
            title="تحديث"
          >
            <HiOutlineRefresh size={18} className={isLoading ? 'animate-spin' : undefined} />
            تحديث
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={markAllRead}
            disabled={unreadCount === 0 || markRead.isPending}
          >
            <Icon name="check" size={18} />
            قراءة الكل
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="notifications-empty">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p>جاري تحميل الإشعارات...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="notifications-empty">
          <HiOutlineExclamationCircle size={36} className="text-rose-600" aria-hidden />
          <p>{error}</p>
          <button type="button" className="btn btn--primary" onClick={() => refetch()}>
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <section className="notifications-list">
          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <Icon name="bell" size={36} />
              <p>لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            notifications.map((item) => (
              <article
                key={item.id}
                className={`notification-item${item.read ? '' : ' is-unread'}`}
                onClick={() => handleMarkRead(item.id, item.read)}
              >
                <span className="notification-item__icon" aria-hidden>
                  <Icon name="bell" size={18} />
                </span>
                <div className="notification-item__body">
                  <h3>
                    {item.title}
                    {item.type === 'payment' || item.type === 'invoice' ? (
                      <Icon name="invoices" size={15} className="notification-item__badge" />
                    ) : null}
                  </h3>
                  <p>{item.message}</p>
                  <span className="notification-item__time">
                    <Icon name="clock" size={14} />
                    {item.timeAgo}
                  </span>
                </div>
                <button
                  type="button"
                  className="notification-item__delete"
                  title="حذف الإشعار"
                  aria-label={`حذف ${item.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeOne(item.id)
                  }}
                >
                  <Icon name="trash" size={18} />
                </button>
              </article>
            ))
          )}
        </section>
      ) : null}
    </div>
  )
}
