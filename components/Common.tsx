import React from 'react';

export const Card: React.FC<{ 
  children: React.ReactNode, 
  title?: string, 
  subtitle?: string, 
  className?: string,
  onClick?: React.MouseEventHandler<HTMLDivElement>
}> = ({ 
  children, title, subtitle, className = "", onClick
}) => (
  <div 
    className={`bg-white rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-standard ${onClick ? 'cursor-pointer active:scale-[0.98] hover:border-[#00eaff] hover:shadow-md' : ''} ${className}`}
    onClick={onClick}
  >
    {(title || subtitle) && (
      <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-50 bg-slate-50/30">
        {title && <h3 className="font-extrabold text-slate-900 tracking-tight text-[11px] lg:text-sm uppercase tracking-wider">{title}</h3>}
        {subtitle && <p className="text-[9px] lg:text-[11px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
      </div>
    )}
    <div className="p-4 lg:p-6">{children}</div>
  </div>
);

// Added className prop to fix TypeScript errors in view files that attempt to pass custom classes
export const Badge: React.FC<{ children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'neutral' | 'info', className?: string }> = ({ 
  children, variant = 'neutral', className = ""
}) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    info: 'bg-[#00eaff]/10 text-[#0891b2] border-[#00eaff]/20',
  };
  return (
    <span className={`px-2 lg:px-2.5 py-0.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest border ${styles[variant]} whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
};

export const Modal: React.FC<{ 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  children: React.ReactNode,
  onConfirm?: () => void,
  confirmLabel?: string
}> = ({ isOpen, onClose, title, children, onConfirm, confirmLabel = 'Confirm' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center lg:bg-slate-900/40 lg:backdrop-blur-sm bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white lg:rounded-3xl rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
        <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-black text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-standard">&times;</button>
        </div>
        <div className="p-5 lg:p-8 overflow-y-auto max-h-[75vh] scrollbar-hide">{children}</div>
        {onConfirm && (
          <div className="px-5 lg:px-6 py-4 lg:py-5 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
            <button onClick={onClose} className="px-5 py-2 text-xs lg:text-sm font-bold text-slate-500 hover:text-slate-800 transition-standard">Cancel</button>
            <button 
              onClick={() => { onConfirm(); onClose(); }} 
              className="px-6 lg:px-8 py-2 lg:py-2.5 bg-[#00eaff] text-black text-xs lg:text-sm font-black rounded-xl hover:shadow-lg hover:shadow-cyan-400/20 transition-standard active:scale-95"
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export interface InputOption {
  value: string;
  label: string;
}

export const StatusInput: React.FC<{ 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  options: (string | InputOption)[] 
}> = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
    <select 
      className="w-full px-4 py-2 lg:py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00eaff]/30 focus:border-[#00eaff] outline-none text-xs lg:text-sm bg-white transition-standard"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt, idx) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lab = typeof opt === 'string' ? opt : opt.label;
        return <option key={`${val}-${idx}`} value={val}>{lab}</option>;
      })}
    </select>
  </div>
);

export const TextArea: React.FC<{ label: string, value: string, onChange: (v: string) => void, placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label className="block text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
    <textarea 
      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00eaff]/30 focus:border-[#00eaff] outline-none text-xs lg:text-sm h-24 lg:h-28 resize-none transition-standard"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);