'use client';

import React, { useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { ConsultationSchedulerModal } from './consultation-scheduler-modal';
import type { ConsultationType } from '@nfi/api-client';

interface ConsultationTriggerButtonProps {
  label?: string;
  variant?: 'primary' | 'outline' | 'gold' | 'compact';
  defaultMode?: ConsultationType;
  defaultStudio?:
    'INDIRANAGAR' | 'WHITEFIELD' | 'HSR_LAYOUT' | 'VIKAS_MARG' | 'ON_SITE' | 'VIRTUAL';
  className?: string;
}

export function ConsultationTriggerButton({
  label = 'Schedule Showroom Visit / 3D Consultation',
  variant = 'primary',
  defaultMode = 'STUDIO_VISIT',
  defaultStudio = 'INDIRANAGAR',
  className = '',
}: ConsultationTriggerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  let btnClasses =
    'px-8 py-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 group ';

  if (variant === 'primary') {
    btnClasses += 'bg-[#8C7355] text-white hover:bg-[#786144] ';
  } else if (variant === 'gold') {
    btnClasses +=
      'bg-[#171717] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/60 shadow-lg hover:shadow-xl ';
  } else if (variant === 'compact') {
    btnClasses =
      'px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 shadow-sm ';
  } else {
    btnClasses +=
      'bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md ';
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${btnClasses} ${className}`}
      >
        <Calendar className="h-4 w-4 text-amber-300 transition-transform group-hover:scale-110" />
        <span>{label}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>

      <ConsultationSchedulerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultMode={defaultMode}
        defaultStudio={defaultStudio}
      />
    </>
  );
}
