import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, DollarSign, ShoppingBag } from 'lucide-react';

export default function Expenses() {
  const { id } = useParams();
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ 
    item_name: '', cost: '', quantity: '', vendor: '', category: 'Material' 
  });

  useEffect(() => {
    fetchExpenses();
  }, [id]);

  const fetchExpenses = async () => {
    const res = await fetch(`/api/projects/${id}/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setExpenses(await res.json());
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...newItem, project_id: id })
    });
    setShowAdd(false);
    fetchExpenses();
    setNewItem({ item_name: '', cost: '', quantity: '', vendor: '', category: 'Material' });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expense Tracker</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addExpense} className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Item Name" 
              required
              className="border p-2 rounded"
              value={newItem.item_name}
              onChange={e => setNewItem({...newItem, item_name: e.target.value})}
            />
            <input 
              placeholder="Cost" 
              type="number"
              required
              className="border p-2 rounded"
              value={newItem.cost}
              onChange={e => setNewItem({...newItem, cost: e.target.value})}
            />
            <input 
              placeholder="Quantity" 
              className="border p-2 rounded"
              value={newItem.quantity}
              onChange={e => setNewItem({...newItem, quantity: e.target.value})}
            />
            <input 
              placeholder="Vendor" 
              className="border p-2 rounded"
              value={newItem.vendor}
              onChange={e => setNewItem({...newItem, vendor: e.target.value})}
            />
            <select 
              className="border p-2 rounded"
              value={newItem.category}
              onChange={e => setNewItem({...newItem, category: e.target.value})}
            >
              <option>Material</option>
              <option>Labor</option>
              <option>Equipment</option>
              <option>Other</option>
            </select>
          </div>
          <button type="submit" className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-lg">Save</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 font-medium text-slate-600">Item</th>
              <th className="p-4 font-medium text-slate-600">Category</th>
              <th className="p-4 font-medium text-slate-600">Vendor</th>
              <th className="p-4 font-medium text-slate-600 text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{exp.item_name}</td>
                <td className="p-4 text-slate-500">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs">{exp.category}</span>
                </td>
                <td className="p-4 text-slate-500">{exp.vendor || '-'}</td>
                <td className="p-4 text-right font-bold text-slate-900">${exp.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
