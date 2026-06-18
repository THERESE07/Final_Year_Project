import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

const events: Record<number, string[]> = { 9: ['09:00 AM - Abiyuje'], 11: ['02:00 PM - Duterimbere'], 14: ['10:00 AM - Musanze', '02:00 PM - Kayonza'], 16: ['11:00 AM - Twigire'], 18: ['09:30 AM - Gasabo'], 20: ['11:00 AM - Terimbere'], 21: ['10:00 AM - Northern'] };

const upcoming = [
  { date: '2025-01-13', time: '09:00 AM', coop: 'Abiyuje Cooperative', location: 'Musanze' },
  { date: '2025-01-13', time: '02:00 PM', coop: 'Duterimbere Cooperative', location: 'Huye' },
  { date: '2025-01-15', time: '10:00 AM', coop: 'Tuzamurane Cooperative', location: 'Kayonza' },
  { date: '2025-01-17', time: '09:30 AM', coop: 'Twigire Muhinzi', location: 'Gasabo' },
  { date: '2025-01-20', time: '11:00 AM', coop: 'Terimbere Cooperative', location: 'Nyagatare' },
];

const DistributionSchedule: React.FC = () => {
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calDays = Array.from({ length: 35 }, (_, i) => {
    const d = i - 1;
    return d >= 1 && d <= 31 ? d : null;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distribution Schedule</h1>
          <p className="text-sm text-gray-500">Manage and track input distribution events</p>
        </div>
        <button className="btn-primary text-sm px-4 py-2">+ Schedule Distribution</button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['month', 'week', 'list'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${view === v ? 'bg-agri-green text-white' : 'text-gray-600 hover:text-gray-800'}`}>
            {v} View
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">January 2025</h3>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              const hasEvent = day && events[day];
              const isToday = day === 11;
              return (
                <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm cursor-pointer transition-colors relative
                  ${!day ? '' : isToday ? 'bg-agri-green text-white font-bold' : hasEvent ? 'border border-blue-200 bg-blue-50' : 'hover:bg-gray-50'}`}>
                  {day && (
                    <>
                      <span className={day ? 'text-xs' : ''}>{day}</span>
                      {hasEvent && !isToday && (
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: Math.min(hasEvent.length, 2) }).map((_, j) => (
                            <div key={j} className="w-1 h-1 bg-blue-400 rounded-full" />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Calendar Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-agri-green rounded" /><span className="text-gray-600">Today</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 border border-blue-200 bg-blue-50 rounded" /><span className="text-gray-600">Has Events</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 rounded" /><span className="text-gray-600">No Events</span></div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Upcoming Events</h3>
            <div className="space-y-3">
              {upcoming.map((e, i) => (
                <div key={i} className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Clock size={11} /> {e.date} • {e.time}
                  </div>
                  <p className="font-medium text-sm text-gray-800">{e.coop}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin size={11} /> {e.location}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">This Month</h3>
            <div className="space-y-2">
              {[['Total Events', '7'], ['Scheduled', '5'], ['Completed', '2'], ['Total Farmers', '142']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionSchedule;
