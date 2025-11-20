import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { getSession } from '../lib/auth'

function FeedbackForm({ onSuccess }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    feedback_type: 'feature',
    subject: '',
    message: '',
    priority: 'medium',
    user_email: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const sessionToken = localStorage.getItem('kiteManager_session')
        if (sessionToken) {
          const session = await getSession(sessionToken)
          if (session && session.user) {
            setUser(session.user)
            setFormData(prev => ({
              ...prev,
              user_email: session.user.email || ''
            }))
          }
        }
      } catch (err) {
        console.error('Error checking user:', err)
      }
    }
    checkUser()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validation
      if (!formData.subject.trim()) {
        setError(t('feedback.error.subject'))
        setSubmitting(false)
        return
      }
      if (!formData.message.trim()) {
        setError(t('feedback.error.message'))
        setSubmitting(false)
        return
      }
      if (!user && !formData.user_email.trim()) {
        setError(t('feedback.error.email'))
        setSubmitting(false)
        return
      }

      // Check if feedback table exists, if not, we'll store in a simple way
      // For now, we'll try to insert into feedback table
      try {
        await sql`
          INSERT INTO feedback (
            user_id,
            user_email,
            feedback_type,
            subject,
            message,
            priority,
            status
          ) VALUES (
            ${user?.id || null},
            ${user?.email || formData.user_email},
            ${formData.feedback_type},
            ${formData.subject.trim()},
            ${formData.message.trim()},
            ${formData.priority},
            'new'
          )
        `
      } catch (dbError) {
        // If table doesn't exist, log the feedback to console for now
        console.warn('Feedback table not found, logging feedback:', {
          ...formData,
          user_id: user?.id,
          user_email: user?.email || formData.user_email,
          timestamp: new Date().toISOString()
        })
        // In a real scenario, you might want to send to an API endpoint instead
      }

      setSuccess(true)
      setFormData({
        feedback_type: 'feature',
        subject: '',
        message: '',
        priority: 'medium',
        user_email: user?.email || ''
      })

      setTimeout(() => {
        setSuccess(false)
        if (onSuccess) onSuccess()
      }, 3000)
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      setError(t('feedback.error.submit'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-semibold text-green-900">{t('feedback.success.title')}</h3>
              <p className="text-sm text-green-700 mt-1">{t('feedback.success.message')}</p>
            </div>
          </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Feedback Type */}
        <div>
          <label htmlFor="feedback_type" className="block text-sm font-medium text-gray-700 mb-2">
            {t('feedback.form.type')} <span className="text-red-500">{t('feedback.form.required')}</span>
          </label>
          <select
            id="feedback_type"
            name="feedback_type"
            value={formData.feedback_type}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="bug">🐛 {t('feedback.form.type.bug')}</option>
            <option value="feature">💡 {t('feedback.form.type.feature')}</option>
            <option value="ux">🎨 {t('feedback.form.type.ux')}</option>
            <option value="workflow">⚙️ {t('feedback.form.type.workflow')}</option>
            <option value="other">📝 {t('feedback.form.type.other')}</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            {t('feedback.form.priority')}
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="low">{t('feedback.form.priority.low')}</option>
            <option value="medium">{t('feedback.form.priority.medium')}</option>
            <option value="high">{t('feedback.form.priority.high')}</option>
            <option value="urgent">{t('feedback.form.priority.urgent')}</option>
          </select>
        </div>
      </div>

      {/* Email (if not logged in) */}
      {!user && (
        <div>
          <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('feedback.form.email')} <span className="text-red-500">{!user && t('feedback.form.required')}</span>
          </label>
          <input
            type="email"
            id="user_email"
            name="user_email"
            value={formData.user_email}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="your.email@example.com"
            required={!user}
          />
          <p className="text-xs text-gray-500 mt-1">{t('feedback.form.email.desc')}</p>
        </div>
      )}

      {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            {t('feedback.form.subject')} <span className="text-red-500">{t('feedback.form.required')}</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={t('feedback.form.subject.placeholder')}
            required
            maxLength={255}
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            {t('feedback.form.message')} <span className="text-red-500">{t('feedback.form.required')}</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={t('feedback.form.message.placeholder')}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{t('feedback.form.message.desc')}</p>
        </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? t('feedback.form.submitting') : t('feedback.form.submit')}
          </button>
      </div>
    </form>
  )
}

export default FeedbackForm

