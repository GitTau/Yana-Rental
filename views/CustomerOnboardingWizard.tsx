import React, { useState } from 'react';
import { 
  User, 
  FileText, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  CalendarDays,
  MapPin,
  HeartPulse
} from 'lucide-react';
import { Customer } from '../types';
import { Modal } from '../components/Common';

interface CustomerOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Omit<Customer, 'id' | 'storeId'>) => void;
}

const STEPS = [
  { id: 'personal', label: 'Section A', icon: User },
  { id: 'docs', label: 'Documents', icon: FileText },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'consent', label: 'Legal', icon: ShieldCheck },
];

const CustomerOnboardingWizard: React.FC<CustomerOnboardingWizardProps> = ({ isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    aadharNo: '',
    panNo: '',
    emergencyContact1: '',
    emergencyContact2: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    consentData: false,
    consentSOP: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!formData.name) newErrors.name = 'Full Name is required';
      if (!formData.phone) newErrors.phone = 'Contact Number is required';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required';
      if (!formData.address) newErrors.address = 'Permanent Address is required';
    } else if (currentStep === 1) {
      if (!formData.aadharNo) newErrors.aadharNo = 'Aadhar No is required';
      if (!formData.emergencyContact1) newErrors.emergencyContact1 = 'Emergency Contact 1 is required';
    } else if (currentStep === 2) {
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
    } else if (currentStep === 3) {
      if (!formData.consentData || !formData.consentSOP) newErrors.consent = 'Both agreements must be accepted';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onSubmit({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          dob: formData.dob,
          address: formData.address,
          aadharNo: formData.aadharNo,
          panNo: formData.panNo,
          emergencyContact1: formData.emergencyContact1,
          emergencyContact2: formData.emergencyContact2,
          kycStatus: false,
          agreementAccepted: formData.consentSOP,
          startDate: formData.startDate,
          endDate: formData.endDate
        });
        reset();
        onClose(); // Ensure the window closes after submission
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const reset = () => {
    setCurrentStep(0);
    setFormData({
      name: '',
      dob: '',
      phone: '',
      email: '',
      address: '',
      aadharNo: '',
      panNo: '',
      emergencyContact1: '',
      emergencyContact2: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      consentData: false,
      consentSOP: false
    });
    setErrors({});
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => { onClose(); reset(); }} 
      title="Vehicle & Battery Requisition Form"
    >
      <div className="space-y-6">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-2 pb-6 border-b border-gray-100">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            return (
              <div key={step.id} className="flex flex-col items-center space-y-2 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#00eaff] text-black shadow-lg shadow-cyan-400/30' : 
                  isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-black' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="min-h-[320px] animate-in fade-in slide-in-from-right-4 duration-300">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <User size={12} /> A. Please fill the registration form
              </h4>
              <InputField label="1. Full Name" value={formData.name} onChange={v => updateField('name', v)} error={errors.name} placeholder="Legal Name" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="2. Date of Birth" type="date" value={formData.dob} onChange={v => updateField('dob', v)} error={errors.dob} />
                <InputField label="3. Contact Number" value={formData.phone} onChange={v => updateField('phone', v)} error={errors.phone} placeholder="Primary Phone" />
              </div>
              <InputField label="4. Email Address" type="email" value={formData.email} onChange={v => updateField('email', v)} placeholder="Email" />
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">5. Permanent Address</label>
                <textarea 
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-xs bg-gray-50 h-20 resize-none transition-all ${errors.address ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-slate-200 focus:border-[#00eaff]'}`}
                  value={formData.address}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder="Complete Address"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Aadhar No" value={formData.aadharNo} onChange={v => updateField('aadharNo', v)} error={errors.aadharNo} placeholder="12-digit number" />
                <InputField label="PAN No" value={formData.panNo} onChange={v => updateField('panNo', v)} placeholder="Format: ABCDE1234F" />
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <HeartPulse size={12} className="text-rose-500" /> Emergency Support
                 </p>
                 <div className="space-y-4">
                    <InputField label="Emergency Contact Number 1" value={formData.emergencyContact1} onChange={v => updateField('emergencyContact1', v)} error={errors.emergencyContact1} placeholder="Name or Contact" />
                    <InputField label="Number 2" value={formData.emergencyContact2} onChange={v => updateField('emergencyContact2', v)} placeholder="Secondary Contact" />
                 </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-[#00eaff]/10 border border-[#00eaff]/20 rounded-2xl">
                 <p className="text-xs font-black text-[#0891b2] uppercase tracking-widest">Subscription Window</p>
                 <p className="text-[10px] text-[#0891b2] font-medium mt-1">Specify your planned usage duration for initial dispatch.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <InputField label="Start Date" type="date" value={formData.startDate} onChange={v => updateField('startDate', v)} error={errors.startDate} />
                <InputField label="End Date" type="date" value={formData.endDate} onChange={v => updateField('endDate', v)} error={errors.endDate} />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div 
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.consentData ? 'border-[#00eaff] bg-cyan-50/20' : 'border-gray-100 bg-gray-50'}`}
                onClick={() => updateField('consentData', !formData.consentData)}
              >
                <div className="flex gap-4">
                  <div className={`w-6 h-6 rounded border-2 shrink-0 flex items-center justify-center transition-all ${formData.consentData ? 'bg-[#00eaff] border-[#00eaff]' : 'border-gray-300 bg-white'}`}>
                    {formData.consentData && <CheckCircle2 size={16} className="text-black" />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Section B: Data Privacy</p>
                    <p className="text-[11px] leading-relaxed text-gray-700 font-medium italic">
                      "By providing the above details, I hereby consent to the collection, processing, and storage of my personal data in accordance with company guidelines and applicable data protection policies."
                    </p>
                    <p className="text-[10px] font-black text-[#0891b2] mt-2 uppercase">I Agree</p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.consentSOP ? 'border-[#00eaff] bg-cyan-50/20' : 'border-gray-100 bg-gray-50'}`}
                onClick={() => updateField('consentSOP', !formData.consentSOP)}
              >
                <div className="flex gap-4">
                  <div className={`w-6 h-6 rounded border-2 shrink-0 flex items-center justify-center transition-all ${formData.consentSOP ? 'bg-[#00eaff] border-[#00eaff]' : 'border-gray-300 bg-white'}`}>
                    {formData.consentSOP && <CheckCircle2 size={16} className="text-black" />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Section C: Standard Operating Procedures</p>
                    <p className="text-[11px] leading-relaxed text-gray-700 font-medium italic">
                      "I confirm that I have read, understood, and agree to abide by the Standard Operating Procedures detailed in Service Agreement. I understand that failure to comply may result in task and financial penalties."
                    </p>
                    <p className="text-[10px] font-black text-[#0891b2] mt-2 uppercase">I Agree</p>
                  </div>
                </div>
              </div>

              {errors.consent && (
                <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase ml-1 animate-pulse">
                  <AlertCircle size={14} /> {errors.consent}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button 
            onClick={handleBack} 
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-black'}`}
          >
            <ArrowLeft size={16} /> <span>Back</span>
          </button>
          
          <button 
            onClick={handleNext}
            className="flex items-center space-x-2 bg-[#00eaff] text-black px-10 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-cyan-400/20 active:scale-95 transition-all"
          >
            <span>{currentStep === STEPS.length - 1 ? 'Submit Requisition' : 'Continue'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
};

const InputField = ({ label, value, onChange, type = 'text', error, placeholder }: { label: string, value: string, onChange: (v: string) => void, type?: string, error?: string, placeholder?: string }) => (
  <div className="space-y-1.5 flex-1">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      className={`w-full px-4 py-3 rounded-xl border outline-none text-xs bg-gray-50 transition-all ${error ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-slate-200 focus:ring-4 focus:ring-[#00eaff]/10 focus:border-[#00eaff]'}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
    {error && <p className="text-[9px] font-black text-rose-500 uppercase ml-1 flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
  </div>
);

export default CustomerOnboardingWizard;