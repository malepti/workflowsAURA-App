import React, { useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, AreaChart as AreaChartIcon, ScatterChart as ScatterChartIcon, Code2, Play } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import { useApp } from '../../context/AppContext';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ChartsView: React.FC = () => {
  const { addToast } = useApp();
  
  const [jsonInput, setJsonInput] = useState<string>(`[
  { "name": "Jan", "sales": 4000, "profit": 2400 },
  { "name": "Feb", "sales": 3000, "profit": 1398 },
  { "name": "Mar", "sales": 2000, "profit": 9800 },
  { "name": "Apr", "sales": 2780, "profit": 3908 },
  { "name": "May", "sales": 1890, "profit": 4800 },
  { "name": "Jun", "sales": 2390, "profit": 3800 }
]`);
  
  const [data, setData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area' | 'scatter'>('bar');
  const [keys, setKeys] = useState<string[]>([]);
  const [xAxisKey, setXAxisKey] = useState<string>('');

  React.useEffect(() => {
    handleRender();
  }, []);

  const handleRender = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('Data must be a non-empty array of objects');
      }
      
      const firstObj = parsedData[0];
      const availableKeys = Object.keys(firstObj);
      
      setData(parsedData);
      setKeys(availableKeys.filter(k => typeof firstObj[k] === 'number'));
      setXAxisKey(availableKeys.find(k => typeof firstObj[k] === 'string') || availableKeys[0]);
      addToast('Chart data loaded successfully.', 'success');
    } catch (e: any) {
      addToast(`Failed to parse JSON: ${e.message}`, 'error');
    }
  };

  const renderChart = () => {
    if (data.length === 0 || keys.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
          No data to display. Please provide valid JSON.
        </div>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {keys.map((k, i) => (
              <Line type="monotone" key={k} dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie') {
      const dataKey = keys[0];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={xAxisKey}
              label={({ cx, cy, midAngle = 0, innerRadius, outerRadius, percent = 0 }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {keys.map((k, i) => (
              <Area type="monotone" key={k} dataKey={k} fill={COLORS[i % COLORS.length]} stroke={COLORS[i % COLORS.length]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxisKey} type="category" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {keys.map((k, i) => (
              <Scatter name={k} key={k} data={data} fill={COLORS[i % COLORS.length]} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>DATA VISUALIZATION</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172554]">Interactive Charts</h1>
          <p className="text-xs text-slate-500">
            Paste JSON array data or CSV data (as JSON) and instantly render beautiful, interactive charts.
          </p>
        </div>

        {/* Chart Types */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors ${chartType === 'bar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Bar Chart</span>
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors ${chartType === 'line' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LineChartIcon className="h-4 w-4" /> <span className="hidden sm:inline">Line Chart</span>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors ${chartType === 'pie' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <PieChartIcon className="h-4 w-4" /> <span className="hidden sm:inline">Pie Chart</span>
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors ${chartType === 'area' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <AreaChartIcon className="h-4 w-4" /> <span className="hidden lg:inline">Area Chart</span>
          </button>
          <button
            onClick={() => setChartType('scatter')}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors ${chartType === 'scatter' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <ScatterChartIcon className="h-4 w-4" /> <span className="hidden lg:inline">Scatter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* JSON Input Panel */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-indigo-600" />
              <span>data.json</span>
            </div>
            <button
              onClick={handleRender}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
            >
              <Play className="h-3.5 w-3.5 fill-emerald-600" /> Render
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="flex-1 w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 leading-relaxed resize-none focus:outline-none selection:bg-indigo-600"
            spellCheck={false}
          />
        </div>

        {/* Chart Render Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex items-center justify-center">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};
