'use client';

import { useState, useEffect } from 'react';

export default function ComplianceSidebar() {
  return (
    <div className="glass-card p-4">
      <h3 className="font-bold text-lg mb-3 text-pastel-blue-400 flex items-center">
        <i className="fas fa-shield-alt mr-2" /> Compliance Health
      </h3>
      <div className="space-y-3">
        {[
          { label: 'BCEA Compliance', value: 94, color: 'bg-pastel-blue-200' },
          { label: 'EEA Progress', value: 78, color: 'bg-pastel-blue-400' },
          { label: 'COIDA Coverage', value: 100, color: 'bg-green-400' },
          { label: 'Skills Development', value: 65, color: 'bg-pastel-blue-300' },
          { label: 'POPIA Compliance', value: 88, color: 'bg-pastel-blue-200' },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-bold">{item.value}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${item.color} transition-all`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
