import React from 'react';

const StatusBadge = ({ status }) => {
    const colors = {
        'READY': 'bg-green-100 text-green-800 border-green-200',
        'RISKY': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'NOT ACCEPTABLE': 'bg-red-100 text-red-800 border-red-200',
        'PROCESSING': 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
