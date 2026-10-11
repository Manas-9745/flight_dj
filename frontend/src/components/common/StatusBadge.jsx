import React from 'react';

const StatusBadge = ({ status }) => {
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-800';

  switch (status) {
    case 'ON_TIME':
    case 'SCHEDULED':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'DELAYED':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'CANCELLED':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'BOARDING':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    default:
      break;
  }

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

export default StatusBadge;
