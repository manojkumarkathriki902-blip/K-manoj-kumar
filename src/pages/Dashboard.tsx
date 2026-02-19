import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  CheckSquare, 
  DollarSign, 
  FileText, 
  Bot,
  Plus,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProject) {
      fetchStats(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async (projectId: number) => {
    // In a real app, these would be aggregated on the backend
    // Fetching expenses for chart
    const resExp = await fetch(`/api/projects/${projectId}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const expenses = await resExp.json();
    
    const totalSpent = expenses.reduce((acc: number, curr: any) => acc + curr.cost, 0);
    const budget = selectedProject?.budget || 0;
    
    setStats({
      totalSpent,
      remaining: Math.max(0, budget - totalSpent),
      expenses
    });
  };

  const COLORS = ['#4F46E5', '#E2E8F0'];

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">No Projects Found</h2>
          <Link 
            to="/project-setup" 
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Your First Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Mobile Header */}
      <div className="bg-white p-4 shadow-sm md:hidden flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-bold text-lg text-slate-800">BuildTrack AI</h1>
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
          {user?.name[0]}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <LayoutDashboard /> BuildTrack
            </h1>
          </div>
          
          <div className="px-4 mb-6">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Current Project</label>
            <select 
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedProject?.id}
              onChange={(e) => {
                const proj = projects.find(p => p.id === parseInt(e.target.value));
                setSelectedProject(proj);
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
            <NavItem icon={<CheckSquare />} label="Checklist" to={`/project/${selectedProject?.id}/checklist`} />
            <NavItem icon={<Users />} label="Workers" to={`/project/${selectedProject?.id}/workers`} />
            <NavItem icon={<DollarSign />} label="Expenses" to={`/project/${selectedProject?.id}/expenses`} />
            <NavItem icon={<FileText />} label="Files" to={`/project/${selectedProject?.id}/files`} />
            <NavItem icon={<MessageSquare />} label="Chat" to={`/project/${selectedProject?.id}/chat`} />
            <NavItem icon={<Bot />} label="AI Assistant" to={`/project/${selectedProject?.id}/ai`} />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                {user?.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Project Overview</h2>
            <p className="text-slate-500">{selectedProject?.site_address}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-sm font-medium text-slate-500 mb-2">Total Budget</h3>
              <p className="text-3xl font-bold text-slate-900">
                ${selectedProject?.budget?.toLocaleString()}
              </p>
              <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full" 
                  style={{ width: `${(stats?.totalSpent / selectedProject?.budget) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {Math.round((stats?.totalSpent / selectedProject?.budget) * 100)}% utilized
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-sm font-medium text-slate-500 mb-2">Timeline</h3>
              <p className="text-3xl font-bold text-slate-900">Day 45</p>
              <p className="text-sm text-slate-500">of 180 days</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Next Milestone</h3>
                <p className="text-xl font-bold text-slate-900">Slab Casting</p>
                <p className="text-sm text-indigo-600 mt-1">Due in 5 days</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                <Calendar className="w-6 h-6" />
              </div>
            </motion.div>
          </div>

          {/* Charts & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Budget Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Spent', value: stats?.totalSpent || 0 },
                        { name: 'Remaining', value: stats?.remaining || 1 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {/* @ts-ignore */}
                      {stats && [0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Expenses</h3>
              <div className="space-y-4">
                {stats?.expenses?.slice(0, 4).map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{exp.item_name}</p>
                        <p className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">-${exp.cost}</p>
                  </div>
                ))}
                <Link to={`/project/${selectedProject?.id}/expenses`} className="block text-center text-sm text-indigo-600 font-medium hover:underline pt-2">
                  View All Transactions
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-20">
        <MobileNavItem icon={<LayoutDashboard />} to="/dashboard" active />
        <MobileNavItem icon={<CheckSquare />} to={`/project/${selectedProject?.id}/checklist`} />
        <MobileNavItem icon={<MessageSquare />} to={`/project/${selectedProject?.id}/chat`} />
        <MobileNavItem icon={<Bot />} to={`/project/${selectedProject?.id}/ai`} />
      </div>
    </div>
  );
}

function NavItem({ icon, label, to, active }: { icon: any, label: string, to?: string, active?: boolean }) {
  const content = (
    <>
      {icon}
      <span className="font-medium">{label}</span>
    </>
  );

  const className = `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
    active 
      ? 'bg-indigo-50 text-indigo-600' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

  if (to) return <Link to={to} className={className}>{content}</Link>;
  return <div className={className}>{content}</div>;
}

function MobileNavItem({ icon, to, active }: { icon: any, to: string, active?: boolean }) {
  return (
    <Link 
      to={to} 
      className={`p-2 rounded-lg ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
    >
      {icon}
    </Link>
  );
}
