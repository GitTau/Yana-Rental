
import React, { useState } from 'react';
import { Wrench, Plus, CheckCircle, Clock } from 'lucide-react';
import { YanaState, VehicleStatus } from '../types';
import { Card, Badge, Modal, TextArea, StatusInput } from '../components/Common';

interface MaintenanceProps {
  state: YanaState;
  onCreateJob: (vId: string, desc: string) => void;
  onCloseJob: (jobId: string, nextStatus: VehicleStatus, reason: string) => void;
}

const Maintenance: React.FC<MaintenanceProps> = ({ state, onCreateJob, onCloseJob }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedVeh, setSelectedVeh] = useState('');
  const [description, setDescription] = useState('');

  const [closingJobId, setClosingJobId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<VehicleStatus>(VehicleStatus.AVAILABLE);
  const [closeReason, setCloseReason] = useState('');

  const activeJobs = state.maintenanceJobs.filter(j => j.storeId === state.activeStoreId && j.status === 'Open');
  const pastJobs = state.maintenanceJobs.filter(j => j.storeId === state.activeStoreId && j.status === 'Closed');
  
  const eligibleVehicles = state.vehicles.filter(v => v.storeId === state.activeStoreId && v.status !== VehicleStatus.MAINTENANCE && v.status !== VehicleStatus.IN_USE);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Queue</h2>
          <p className="text-gray-500">Track repairs and vehicle downtime.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
        >
          <Plus size={18} />
          <span>New Job</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Jobs */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
            <Clock size={16} className="text-amber-500" />
            <span>Active Repairs ({activeJobs.length})</span>
          </h3>
          {activeJobs.length > 0 ? (
            activeJobs.map(job => {
              const vehicle = state.vehicles.find(v => v.id === job.vehicleId);
              return (
                <Card key={job.id} className="border-l-4 border-l-amber-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{vehicle?.plateNumber}</h4>
                      <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                      <div className="mt-4 flex items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                        <Clock size={12} className="mr-1" />
                        <span>Started {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setClosingJobId(job.id); setNextStatus(VehicleStatus.AVAILABLE); setCloseReason(''); }}
                      className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                    >
                      Resolve
                    </button>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="py-10 bg-white rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-sm italic">
              No active maintenance jobs.
            </div>
          )}
        </div>

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span>Completed Jobs</span>
          </h3>
          <div className="space-y-3">
            {pastJobs.slice(0, 5).map(job => (
              <div key={job.id} className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex justify-between items-center">
                <div>
                   <p className="text-sm font-bold text-gray-800">{state.vehicles.find(v => v.id === job.vehicleId)?.plateNumber}</p>
                   <p className="text-xs text-gray-500">{job.description}</p>
                </div>
                <Badge variant="neutral">Closed</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="New Maintenance Job" confirmLabel="Open Job" onConfirm={() => {
        if (selectedVeh && description) {
           onCreateJob(selectedVeh, description);
        } else {
          alert('Vehicle and description are required.');
        }
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Vehicle</label>
            <select className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={selectedVeh} onChange={e => setSelectedVeh(e.target.value)}>
              <option value="">Select Fleet Member</option>
              {eligibleVehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </select>
          </div>
          <TextArea label="Fault/Job Description" value={description} onChange={setDescription} placeholder="e.g., Brake pad replacement, Motor noise inspection..." />
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal isOpen={!!closingJobId} onClose={() => setClosingJobId(null)} title="Resolve Maintenance" confirmLabel="Close & Release" onConfirm={() => {
        if (closingJobId && closeReason) {
           onCloseJob(closingJobId, nextStatus, closeReason);
        } else {
           alert('Please provide resolution details.');
        }
      }}>
         <StatusInput 
            label="Next Status" 
            value={nextStatus} 
            onChange={(v) => setNextStatus(v as VehicleStatus)} 
            options={[VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE]} 
         />
         <TextArea label="Resolution Notes" value={closeReason} onChange={setCloseReason} placeholder="What was fixed? Any follow-up required?" />
      </Modal>
    </div>
  );
};

export default Maintenance;
