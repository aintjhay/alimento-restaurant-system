import React from 'react';
import realtimeService from '../../services/realtimeService';
import './StatusTimeline.css';

/**
 * StatusTimeline - Visual step-by-step order status progression
 * Shows the order journey: Pending → Confirmed → Preparing → Completed
 */
const StatusTimeline = ({ statusTimeline, currentStatus }) => {
  const statusSequence = ['pending', 'confirmed', 'preparing', 'completed'];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✓',
      'preparing': '👨‍🍳',
      'ready': '📦',
      'completed': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '•';
  };

  // Calculate current progress
  const getCurrentStep = () => {
    for (let i = statusSequence.length - 1; i >= 0; i--) {
      const status = statusSequence[i];
      if (statusTimeline?.some(t => t.status === status)) {
        return i;
      }
    }
    return -1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="status-timeline-container">
      <div className="timeline-track">
        {statusSequence.map((status, index) => {
          const isCompleted = index <= currentStep;
          const entry = statusTimeline?.find(t => t.status === status);
          const isCurrentStatus = status === currentStatus;

          return (
            <div key={status} className="timeline-step">
              {/* Step Dot */}
              <div className={`timeline-dot ${isCompleted ? 'completed' : ''} ${isCurrentStatus ? 'current' : ''}`}>
                {isCompleted && '✓'}
              </div>

              {/* Step Content */}
              <div className="step-content">
                <div className="step-label">
                  {getStatusIcon(status)} {realtimeService.getStatusText(status)}
                </div>

                {entry ? (
                  <div className="step-timestamp">
                    <div className="timestamp-date">{formatDate(entry.timestamp)}</div>
                    <div className="timestamp-time">{formatTime(entry.timestamp)}</div>
                    {entry.notes && (
                      <div className="step-notes">{entry.notes}</div>
                    )}
                  </div>
                ) : (
                  <div className="step-pending">
                    Waiting...
                  </div>
                )}
              </div>

              {/* Connecting Line */}
              {index < statusSequence.length - 1 && (
                <div className={`connecting-line ${isCompleted ? 'completed' : ''}`}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-background"></div>
        <div
          className="progress-bar-fill"
          style={{
            width: `${((currentStep + 1) / statusSequence.length) * 100}%`
          }}
        ></div>
      </div>

      {/* Step Indicators */}
      <div className="step-indicators">
        {statusSequence.map((status, index) => {
          const isCompleted = index <= currentStep;
          return (
            <div
              key={status}
              className={`indicator ${isCompleted ? 'completed' : ''}`}
              title={realtimeService.getStatusText(status)}
            >
              {index + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
