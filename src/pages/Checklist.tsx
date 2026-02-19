import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Circle, Plus } from 'lucide-react';

export default function Checklist() {
  const { id } = useParams();
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchChecklist();
  }, [id]);

  const fetchChecklist = async () => {
    const res = await fetch(`/api/projects/${id}/checklist`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setItems(await res.json());
  };

  const toggleStatus = async (itemId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await fetch(`/api/checklist/${itemId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    fetchChecklist();
  };

  const groupedItems = items.reduce((acc: any, item: any) => {
    if (!acc[item.stage]) acc[item.stage] = [];
    acc[item.stage].push(item);
    return acc;
  }, {});

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Construction Checklist</h1>
      
      {Object.keys(groupedItems).map(stage => (
        <div key={stage} className="mb-8 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">{stage}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {groupedItems[stage].map((item: any) => (
              <div 
                key={item.id} 
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => toggleStatus(item.id, item.status)}
              >
                <div className="flex items-center gap-4">
                  {item.status === 'completed' ? (
                    <CheckCircle className="text-green-500 w-6 h-6" />
                  ) : (
                    <Circle className="text-slate-300 w-6 h-6" />
                  )}
                  <span className={item.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}>
                    {item.task}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
