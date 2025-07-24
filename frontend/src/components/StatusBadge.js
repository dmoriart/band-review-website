import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      suggested: {
        label: 'Suggested',
        icon: '💭',
        className: 'suggested'
      },
      in_progress: {
        label: 'In Progress',
        icon: '🚧',
        className: 'in-progress'
      },
      done: {
        label: 'Completed',
        icon: '✅',
        className: 'done'
      },
      rejected: {
        label: 'Rejected',
        icon: '❌',
        className: 'rejected'
      }
    };

    return statusMap[status] || statusMap.suggested;
  };

  const statusInfo = getStatusInfo(status);

  return (
    <span className={`status-badge ${statusInfo.className}`}>
      <span className="status-icon">{statusInfo.icon}</span>
      <span className="status-label">{statusInfo.label}</span>
    </span>
  );
};

export default StatusBadge;
