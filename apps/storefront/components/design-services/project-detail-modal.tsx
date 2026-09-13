'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, MapPin, Clock, IndianRupee, Maximize2, ShieldCheck, CheckCircle, Star } from 'lucide-react';
import type { PortfolioProject } from '../../data/portfolio-projects';

interface ProjectDetailModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Reset active image on project change
  useEffect(() => {
    setActiveImageIdx(0);
  }, [project]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [project, onClose]);

  if (!project) return null;

  const currentImage = project.galleryImages[activeImageIdx] || project.coverImage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col z-10 animate-scale-in"
        style={{ animationDuration: '250ms' }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#8C7355]">
              <MapPin size={13} />
              <span>{project.community}, {project.locality} · Bengaluru</span>
            </div>
            <h3 id="project-modal-title" className="text-xl md:text-2xl font-serif font-medium text-[#171717]">
              {project.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-200/60 transition-colors"
            aria-label="Close project modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* Main Gallery Showcase */}
          <div>
            <div className="relative aspect-[16/10] w-full bg-stone-900 rounded-xl overflow-hidden shadow-inner mb-3">
              <Image
                src={currentImage}
                alt={`${project.title} - View ${activeImageIdx + 1}`}
                fill
                className="object-cover transition-opacity duration-300"
                priority
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
                Photo {activeImageIdx + 1} of {project.galleryImages.length}
              </div>
            </div>

            {/* Thumbnails */}
            {project.galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {project.galleryImages.map((img, idx) => (
                  <button
                    key={img + idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIdx === idx ? 'border-[#8C7355] ring-2 ring-[#8C7355]/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium block">Carpet Area</span>
              <span className="text-base font-semibold text-stone-900 flex items-center gap-1 mt-0.5">
                <Maximize2 size={15} className="text-[#8C7355]" />
                {project.areaSqFt.toLocaleString()} sq.ft
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium block">All-in Budget</span>
              <span className="text-base font-semibold text-stone-900 flex items-center gap-1 mt-0.5">
                <IndianRupee size={15} className="text-[#8C7355]" />
                {project.budgetString}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium block">Turnaround</span>
              <span className="text-base font-semibold text-stone-900 flex items-center gap-1 mt-0.5">
                <Clock size={15} className="text-[#8C7355]" />
                {project.turnaroundDays} Days Handover
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium block">Warranty</span>
              <span className="text-base font-semibold text-stone-900 flex items-center gap-1 mt-0.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                10-Year BWP
              </span>
            </div>
          </div>

          {/* Scope & Architecture Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-3.5 flex items-center gap-2">
                <CheckCircle size={16} className="text-[#8C7355]" />
                Turnkey Execution Scope
              </h4>
              <ul className="space-y-2.5">
                {project.scope.map((item) => (
                  <li key={item} className="text-sm text-stone-700 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355] mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {project.designerNotes && (
                <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-xs font-semibold text-stone-900 block mb-1">Architectural Design Narrative</span>
                  <p className="text-xs text-stone-600 leading-relaxed italic">{project.designerNotes}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-3.5">
                Materials &amp; Hardware Transparency
              </h4>
              <div className="space-y-2.5">
                {project.materials.map((mat) => (
                  <div key={mat.category} className="p-3 rounded-lg bg-stone-50 border border-stone-200/80 text-xs">
                    <span className="font-semibold text-stone-900 block">{mat.category}</span>
                    <span className="text-stone-600 mt-0.5 block">{mat.detail}</span>
                  </div>
                ))}
              </div>

              {project.clientTestimonial && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <div className="flex items-center gap-1 text-amber-500 mb-1.5">
                    {[...Array(project.clientTestimonial.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-stone-800 italic leading-relaxed">
                    &ldquo;{project.clientTestimonial.quote}&rdquo;
                  </p>
                  <p className="text-[11px] font-semibold text-[#8C7355] mt-2">
                    — {project.clientTestimonial.clientName} ({project.clientTestimonial.society})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 md:px-8 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-600">
            Want a similar interior transformation for your Bangalore home?
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors w-1/2 sm:w-auto"
            >
              Back to Portfolio
            </button>
            <a
              href="#book-consultation"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#171717] text-white hover:bg-black text-xs font-medium tracking-wide transition-colors shadow-sm w-1/2 sm:w-auto text-center"
            >
              Book Consultation for this Look
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
