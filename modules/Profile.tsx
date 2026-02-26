
import React from 'react';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Phone, 
  CreditCard, 
  Building2, 
  Key, 
  ShieldAlert, 
  ChevronRight,
  UserCheck,
  History
} from 'lucide-react';

interface ProfileProps {
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center gap-4 z-40 transition-colors">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
        {/* User Card */}
        <div className="bg-white dark:bg-gray-900 p-8 flex flex-col items-center mb-2 transition-colors border-b border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 bg-[#387ed1] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-blue-500/10">
            U
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">User</h2>
          <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-green-50 dark:bg-green-900/10 rounded-full">
            <UserCheck size={14} className="text-green-600" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">KYC Verified</span>
          </div>
        </div>

        {/* Security Section */}
        <ProfileSection title="Security & Authentication" icon={<ShieldCheck size={14}/>}>
          <ProfileRow label="Two-factor auth (2FA)" value="Enabled" isLink />
          <ProfileRow label="Password & Security" value="Manage" isLink />
          <ProfileRow label="Demat authorization (eDIS)" value="Active" isLink />
        </ProfileSection>

        {/* Identity Section */}
        <ProfileSection title="Identity Details" icon={<Smartphone size={14}/>}>
          <ProfileRow label="Email" value="user@kite.pro" />
          <ProfileRow label="Phone" value="+91 766*****36" />
          <ProfileRow label="PAN" value="ABCDE****F" />
          <ProfileRow label="Support Code" value="2348" isCopyable />
        </ProfileSection>

      </div>
    </div>
  );
};

const ProfileSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-900 mb-2 p-5 border-b border-gray-100 dark:border-gray-800 transition-colors">
    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
      {icon} {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const ProfileRow = ({ label, value, isLink, isCopyable }: { label: string, value: string, isLink?: boolean, isCopyable?: boolean }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>
    <div className="flex items-center gap-2 cursor-pointer group">
      <span className={`text-sm ${isLink ? 'text-[#387ed1] font-bold hover:underline' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>{value}</span>
      {isLink && <ChevronRight size={14} className="text-gray-300" />}
      {isCopyable && <Key size={14} className="text-gray-300" />}
    </div>
  </div>
);

const SessionRow = ({ device, location, time }: { device: string, location: string, time: string }) => (
  <div className="flex justify-between items-center">
    <div>
      <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{device}</p>
      <p className="text-[10px] text-gray-400">{location}</p>
    </div>
    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">{time}</span>
  </div>
);

const CheckCircle = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Profile;
