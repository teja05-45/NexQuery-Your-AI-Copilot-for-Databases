export default function ConnectionStatus({ status }) {
  const statusMap = {
    connected: {
      label: 'Connected',
      classes: 'bg-success-50 text-success-700',
    },
    disconnected: {
      label: 'Disconnected',
      classes: 'bg-alert-50 text-alert-700',
    },
    testing: {
      label: 'Testing',
      classes: 'bg-brand-50 text-brand-700',
    },
  }

  const { label, classes } = statusMap[status] || statusMap.disconnected

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
