'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { MapPin, Maximize2, Clock, Eye, Sparkles } from 'lucide-react';
import { PORTFOLIO_PROJECTS, type PortfolioProject } from '../../data/portfolio-projects';
import { ProjectDetailModal } from './project-detail-modal';

type FilterCategory =
  | 'all'
  | 'residential'
  | 'commercial'
  | 'office'
  | 'restaurant'
  | 'hotel'
  | 'retail'
  | 'villa'
  | 'kitchen';

interface FilterTab {
  id: FilterCategory;
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'residential', label: 'Residential Homes' },
  { id: 'office', label: 'Offices & Workspaces' },
  { id: 'restaurant', label: 'Restaurants & Cafés' },
  { id: 'hotel', label: 'Hotels & Hospitality' },
  { id: 'retail', label: 'Shops & Retail Showrooms' },
  { id: 'villa', label: 'Luxury Villas' },
  { id: 'kitchen', label: 'Modular Kitchens' },
];

interface PortfolioFilterGridProps {
  initialProjects?: PortfolioProject[];
}

export function PortfolioFilterGrid({ initialProjects }: PortfolioFilterGridProps = {}) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const projectsSource = initialProjects && initialProjects.length > 0 ? initialProjects : PORTFOLIO_PROJECTS;

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return projectsSource;
    if (activeCategory === 'residential') return projectsSource.filter((p) => p.sector !== 'commercial');
    if (activeCategory === 'commercial') return projectsSource.filter((p) => p.sector === 'commercial');
    return projectsSource.filter((p) => p.category === activeCategory);
  }, [activeCategory, projectsSource]);

  return (
    <section id="portfolio" className="py-20 md:py-28 bg-white scroll-mt-24">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-800 text-[12px] font-medium tracking-wide uppercase mb-4">
            <Sparkles size={13} className="text-[#8C7355]" />
            <span>Bengaluru Architecture &amp; Interiors Portfolio</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-light text-[#171717] tracking-tight mb-4">
            Residential, Commercial &amp; Hospitality Projects
          </h2>
          <p className="text-stone-600 text-base md:text-lg leading-relaxed font-light">
            Explore 12+ real Bengaluru projects across luxury residences, fine dining restaurants, boutique hotels, high-tech corporate workspaces, and retail showrooms.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-12">
          {FILTER_TABS.map((tab) => {
            const isSelected = activeCategory === tab.id;
            const count =
              tab.id === 'all'
                ? projectsSource.length
                : tab.id === 'residential'
                ? projectsSource.filter((p) => p.sector !== 'commercial').length
                : tab.id === 'commercial'
                ? projectsSource.filter((p) => p.sector === 'commercial').length
                : projectsSource.filter((p) => p.category === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
                aria-pressed={isSelected}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Projects Grid with Fixed Aspect Ratios (CLS = 0.00) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 min-h-[500px]">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-[#FAF9F6] rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Cover Image Container with 16:10 Ratio */}
              <div 
                className="relative aspect-[16/10] w-full overflow-hidden bg-stone-900 cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Gradient Scrim for WCAG Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Pinned Top Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium tracking-wide">
                    <MapPin size={11} className="text-amber-400" />
                    <span>{project.community.split(',')[0]}</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-stone-900 text-[11px] font-semibold">
                    {project.budgetString}
                  </span>
                </div>

                {/* Bottom Overlay Info on Image */}
                <div className="absolute bottom-3 inset-x-3 z-10 text-white">
                  <span className="text-[10px] uppercase tracking-wider text-amber-300/90 font-medium block mb-0.5">
                    {project.style}
                  </span>
                  <h3 className="text-lg font-serif font-medium text-white tracking-tight leading-snug">
                    {project.title}
                  </h3>
                </div>
              </div>

              {/* Card Meta Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
                    {project.subtitle}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-200/60 text-xs text-stone-700 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Maximize2 size={13} className="text-[#8C7355]" />
                      <span>{`${project.areaSqFt.toLocaleString()} sq.ft`}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#8C7355]" />
                      <span>{`${project.turnaroundDays}-Day Handover`}</span>
                    </span>
                  </div>
                </div>

                {/* Action Trigger */}
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-stone-900 hover:text-white border border-stone-300 text-stone-800 text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-2xs group/btn"
                >
                  <Eye size={14} className="text-[#8C7355] group-hover/btn:text-amber-400" />
                  <span>View Project Details &amp; Specs</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Popover */}
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    </section>
  );
}
