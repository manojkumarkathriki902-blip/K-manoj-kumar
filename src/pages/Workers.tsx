import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Phone, DollarSign } from 'lucide-react';

export default function Workers() {
  const { id } = useParams();
  const { token } = useAuth();
  const [workers, setWorkers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', phone: '', work_type: 'Labor', daily_wage: '' });

  useEffect(() => {
    fetchWorkers();
  }, [id]);

  const fetchWorkers = async () => {
    const res = await fetch(`/api/projects/${id}/workers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setWorkers(await res.json());
  };

  const addWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/workers', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...newWorker, project_id: id })
    });
    setShowAdd(false);
    fetchWorkers();
    setNewWorker({ name: '', phone: '', work_type: 'Labor', daily_wage: '' });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Worker Management</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4" /> Add Worker
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addWorker} className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Name" 
              required
              className="border p-2 rounded"
              value={newWorker.name}
              onChange={e => setNewWorker({...newWorker, name: e.target.value})}
            />
            <input 
              placeholder="Phone" 
              className="border p-2 rounded"
              value={newWorker.phone}
              onChange={e => setNewWorker({...newWorker, phone: e.target.value})}
            />
            <select 
              className="border p-2 rounded"
              value={newWorker.work_type}
              onChange={e => setNewWorker({...newWorker, work_type: e.target.value})}
            >
              <option>Labor</option>
              <option>Mason</option>
              <option>Carpenter</option>
              <option>Electrician</option>
              <option>Plumber</option>
            </select>
            <input 
              placeholder="Daily Wage" 
              type="number"
              required
              className="border p-2 rounded"
              value={newWorker.daily_wage}
              onChange={e => setNewWorker({...newWorker, daily_wage: e.target.value})}
            />
          </div>
          <button type="submit" className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-lg">Save</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(worker => (
          <div key={worker.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{worker.name}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{worker.work_type}</span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> {worker.phone || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> ${worker.daily_wage}/day
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <button className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-100">
                Present
              </button>
              <button className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-100">
                Absent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
