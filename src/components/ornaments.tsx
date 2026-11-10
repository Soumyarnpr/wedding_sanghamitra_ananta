import type { ReactNode } from 'react';

export function Motif({ kind = 'lotus', className = '' }: { kind?: string; className?: string }) {
  const shapes: Record<string, ReactNode> = {
    lotus: <><path d="M32 46c-11-8-10-20 0-30 10 10 11 22 0 30Z"/><path d="M32 46c-15-1-23-11-22-21 11 1 18 9 22 21Zm0 0c15-1 23-11 22-21-11 1-18 9-22 21Z"/><path d="M32 46C20 52 9 46 4 35q7-2 13 3m15 8c12 6 23 0 28-11q-7-2-13 3M24 54h16"/></>,
    kalash: <><path d="M22 27h20m-18 0v5c-12 4-13 20 0 23h16c13-3 12-19 0-23v-5M26 25c-4-5-2-13 6-18 8 5 10 13 6 18M23 27q-11-2-14-13 12 0 17 10m15 3q11-2 14-13-12 0-17 10"/><path d="M19 43h26m-21 6h16m-16 9h16"/></>,
    mandap: <><path d="M7 54h50M11 50V25m42 25V25M16 50V26m32 24V26M6 22h52l-6-8H12Zm12-8 6-8h16l6 8M19 27q13 15 26 0M24 32v9m16-9v9M31 35v11m-4 3h8"/></>,
    diya: <><path d="M8 35h48Q52 53 32 53T8 35Zm4 6h40M24 58h16M32 32c-11-3-6-15 2-24-1 9 9 12 5 20q-2 3-7 4Zm0 0q-4-6 1-11"/><path d="M17 19l-4-4m35 4 4-4M32 3v-1"/></>,
  };
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">{shapes[kind] || shapes.lotus}</svg>;
}

export function Flourish() {
  return <div className="flourish" aria-hidden="true"><span/><Motif/><span/></div>;
}

export function SectionTitle({ label, title, description }: { label: string; title: string; description?: string }) {
  return <div className="section-title" data-enter>
    <p className="kicker">{label}</p>
    <h2>{title}</h2>
    <Flourish />
    {description && <p className="section-description">{description}</p>}
  </div>;
}
