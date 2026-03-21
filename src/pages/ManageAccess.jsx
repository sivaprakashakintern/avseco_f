import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig.js';

const ManageAccess = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, modRes] = await Promise.all([
        axios.get('/admin/employees'),
        axios.get('/admin/modules')
      ]);
      setEmployees(empRes.data);
      setAvailableModules(modRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
      setLoading(false);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee({ ...employee });
    setMessage({ type: '', text: '' });
  };

  const handleToggleModule = (moduleName) => {
    if (!selectedEmployee) return;

    const currentModules = [...selectedEmployee.modules];
    const index = currentModules.indexOf(moduleName);

    if (index > -1) {
      currentModules.splice(index, 1);
    } else {
      currentModules.push(moduleName);
    }

    setSelectedEmployee({ ...selectedEmployee, modules: currentModules });
  };

  const handleSelectAll = () => {
    if (!selectedEmployee) return;
    setSelectedEmployee({ ...selectedEmployee, modules: [...availableModules] });
  };

  const handleClearAll = () => {
    if (!selectedEmployee) return;
    setSelectedEmployee({ ...selectedEmployee, modules: [] });
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(`/admin/employees/${selectedEmployee._id}/modules`, {
        modules: selectedEmployee.modules
      });
      
      // Update local state
      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? selectedEmployee : emp
      ));
      
      setMessage({ type: 'success', text: 'Permissions saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading access management...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Manage Module Access</h1>
        <p className="text-gray-600">Assign permissions to employees for specific functional modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Employee List */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-gray-50 border-b">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input 
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredEmployees.map(emp => (
              <div 
                key={emp._id}
                onClick={() => handleSelectEmployee(emp)}
                className={`p-4 border-b cursor-pointer transition-colors ${selectedEmployee?._id === emp._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
              >
                <div className="font-semibold text-gray-800">{emp.name}</div>
                <div className="text-sm text-gray-500">@{emp.username} | {emp.department}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Permission Editor */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6 h-[600px] flex flex-col">
          {selectedEmployee ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Permissions for {selectedEmployee.name}</h2>
                  <p className="text-sm text-gray-500">Select which modules this employee can access.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:underline">Select All</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={handleClearAll} className="text-sm text-red-600 hover:underline">Clear All</button>
                </div>
              </div>

              {message.text && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 overflow-y-auto mb-6 p-1">
                {availableModules.map(module => (
                  <div 
                    key={module}
                    onClick={() => handleToggleModule(module)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${selectedEmployee.modules.includes(module) ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-200'}`}
                  >
                    <span className={`material-symbols-outlined text-3xl ${selectedEmployee.modules.includes(module) ? 'text-blue-600' : 'text-gray-400'}`}>
                      {module === 'dashboard' ? 'dashboard' : 
                       module === 'stock' ? 'inventory_2' :
                       module === 'products' ? 'format_list_bulleted' :
                       module === 'production' ? 'factory' :
                       module === 'employees' ? 'badge' :
                       module === 'attendance' ? 'event_available' :
                       module === 'clients' ? 'group' :
                       module === 'sales' ? 'sell' :
                       module === 'reports' ? 'analytics' : 'extension'}
                    </span>
                    <span className={`font-medium capitalize ${selectedEmployee.modules.includes(module) ? 'text-blue-800' : 'text-gray-600'}`}>
                      {module}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedEmployee.modules.includes(module) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {selectedEmployee.modules.includes(module) && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t pt-6 flex justify-end">
                <button 
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined">save</span> Save Permissions</>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-6xl mb-4">person_search</span>
              <p>Select an employee from the list to manage their permissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAccess;
