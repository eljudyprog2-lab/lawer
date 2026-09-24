import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'

export function ActivityPanel({ activities = [] }) {
  const [selectedActivity, setSelectedActivity] = useState(null)
  const navigate = useNavigate()

  const handleNavigate = (path) => {
    if (path) {
      setSelectedActivity(null)
      navigate(path)
    }
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">
          <span className="panel__title-icon">
            <Icon name="clock" />
          </span>
          آخر الأنشطة
        </h2>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden>
            <Icon name="clock" size={36} />
          </span>
          <p>لا توجد أنشطة حديثة</p>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map((item) => (
            <article
              key={item.id}
              className="activity-item"
              onClick={() => setSelectedActivity(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedActivity(item)
                }
              }}
            >
              <div className={`activity-item__icon activity-item__icon--${item.tone || 'teal'}`}>
                <Icon name={item.icon || 'bell'} size={18} />
              </div>
              <div className="activity-item__body">
                {item.title ? <h3 className="activity-item__title">{item.title}</h3> : null}
                {item.description ? (
                  <p className="activity-item__text">{item.description}</p>
                ) : item.text ? (
                  <p className="activity-item__text">{item.text}</p>
                ) : null}
                {item.timeLabel ? (
                  <span className="activity-item__meta">
                    <Icon name="clock" size={13} />
                    {item.timeLabel}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedActivity && (
        <Modal
          open={Boolean(selectedActivity)}
          title="تفاصيل النشاط"
          onClose={() => setSelectedActivity(null)}
          footer={
            <div className="flex w-full items-center justify-between gap-3">
              {selectedActivity.targetPath ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => handleNavigate(selectedActivity.targetPath)}
                >
                  <Icon
                    name={
                      selectedActivity.targetPath.includes('cases')
                        ? 'cases'
                        : selectedActivity.targetPath.includes('sessions')
                          ? 'sessions'
                          : 'calendar'
                    }
                    size={18}
                  />
                  {selectedActivity.targetPath.includes('cases')
                    ? 'الانتقال إلى صفحة القضايا'
                    : selectedActivity.targetPath.includes('sessions')
                      ? 'الانتقال إلى صفحة الجلسات'
                      : 'الانتقال إلى صفحة المواعيد'}
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setSelectedActivity(null)}
              >
                إغلاق
              </button>
            </div>
          }
        >
          <div className="space-y-4 py-2 text-right">
            <div className="flex items-center gap-3 border-b border-[#e8ecec] pb-3">
              <div
                className={`activity-item__icon activity-item__icon--${selectedActivity.tone || 'teal'}`}
              >
                <Icon name={selectedActivity.icon || 'bell'} size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand">
                  {selectedActivity.title || 'تفاصيل النشاط'}
                </h3>
                {selectedActivity.timeLabel ? (
                  <span className="text-xs text-[#6b7f80]">{selectedActivity.timeLabel}</span>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg bg-[#f8faf9] p-3 text-sm text-[#3d4f50]">
              <p className="font-medium leading-relaxed">
                {selectedActivity.description || selectedActivity.text || 'لا توجد تفاصيل إضافية'}
              </p>
            </div>

            {(selectedActivity.date || selectedActivity.time) && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {selectedActivity.date && (
                  <div className="rounded-md border border-[#e8ecec] p-2">
                    <span className="block text-[#6b7f80]">التاريخ</span>
                    <span className="font-semibold text-brand">{selectedActivity.date}</span>
                  </div>
                )}
                {selectedActivity.time && (
                  <div className="rounded-md border border-[#e8ecec] p-2">
                    <span className="block text-[#6b7f80]">الوقت</span>
                    <span className="font-semibold text-brand">{selectedActivity.time}</span>
                  </div>
                )}
              </div>
            )}

            {selectedActivity.lawyerName && (
              <div className="rounded-md border border-[#e8ecec] p-2 text-xs">
                <span className="block text-[#6b7f80]">المحامي المسؤول</span>
                <span className="font-semibold text-brand">{selectedActivity.lawyerName}</span>
              </div>
            )}
            {selectedActivity.clientName && (
              <div className="rounded-md border border-[#e8ecec] p-2 text-xs">
                <span className="block text-[#6b7f80]">الموكل</span>
                <span className="font-semibold text-brand">{selectedActivity.clientName}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </section>
  )
}
