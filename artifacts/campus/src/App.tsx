import * as React from 'react';
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, ClipboardList, Dumbbell, GraduationCap, HeartPulse, History, LayoutDashboard,
  Library, Lightbulb, Lock, Mail, Menu, MessageCircle, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Settings, Shield, SlidersHorizontal,
  Trash2, Users, X, Zap, Clock,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { Redirect } from 'wouter';
import {
  getGetClientQueryKey, getGetSessionQueryKey, getGetDashboardSummaryQueryKey, getListAppointmentsQueryKey,
  getListClientsQueryKey, getListExercisesQueryKey, getListInvoicesQueryKey,
  getListNotificationsQueryKey, getListProgramsQueryKey, getListSessionsQueryKey,
  useArchiveClient, useCancelAppointment, useCreateAppointment, useCreateClient, useCreateInvoice,
  useCreateExercise, useCreateProgram, useDeleteExercise,
  useGetClient, useGetDashboardActivity, useGetDashboardSummary, useGetSession,
  useListAppointments, useListClients,
  useListExercises, useListInvoices, useListNotifications, useListPrograms,
  useListSessions, useUpdateClient, useUpdateSession,
  useMarkNotificationRead,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { CampusVoiceAssistant } from '@/components/campus-voice-assistant';
import { CookieBanner } from '@/components/cookie-banner';
import { AideDiagnostic } from '@/components/aide-diagnostic';
import { BillingHub } from '@/components/billing-hub';
import { ClientIntakeForm } from '@/components/client-intake-form';
import { computeTotals, loadFrenchInvoices } from '@/lib/french-invoices';
import { isSessionBilled } from '@/lib/billing-from-sessions';
import { ClientSessionCoach } from '@/components/client-session-coach';
import { FormationHub } from '@/components/formation-hub';
import { FormationProtocolPage } from '@/components/formation-protocol-page';
import { NewSessionForm } from '@/components/new-session-form';
import { AideHeaderButton } from '@/components/aide-header';
import {
  AppointmentReminderPopup,
  isRdvPopupEnabled,
  setRdvPopupEnabled,
} from '@/components/appointment-reminder-popup';
import { PinPad } from '@/components/pin-pad';
import { Awards } from '@/components/ui/award';
import { EXERCISE_CATEGORY_LABELS, PROGRAM_TEMPLATES } from '@/lib/campus-program-templates';
import { hasAppPin, setAppPin } from '@/lib/app-pin';
import { saveDisplayFirstName } from '@/lib/campus-assistant-actions';
import {
  cancelLocalAppointment,
  listLocalAppointments,
  mergeAppointmentLists,
  nextLocalAppointmentId,
  upcomingAppointments,
  upsertLocalAppointment,
} from '@/lib/local-appointments';
import {
  archiveLocalClient,
  createLocalClient,
  listLocalClients,
  mergeClientLists,
  updateLocalClientFields,
  upsertLocalClient,
} from '@/lib/local-clients';
import { FrenchDateTimeField, defaultAppointmentRange } from '@/components/french-datetime-field';
import { WelcomeModal } from '@/components/welcome-modal';
import { mergeSessionLists, listLocalSessions, deleteLocalSession } from '@/lib/local-sessions';
import { deleteSession } from '@/lib/session-actions';
import NotFound from '@/pages/not-found';
import { SessionProvider, useSession } from '@/lib/session';

const PLATFORM_TAGLINE =
  'Plateforme professionnelle de gestion, cartographie corporelle et suivi client pour les praticiens en thérapie manuelle et ventousothérapie.';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 60_000 },
  },
});
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function listOr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

const emptySummary = {
  todayAppointments: 0,
  nextAppointment: null as string | null,
  activeClients: 0,
  monthlySessions: 0,
  monthlyRevenue: 0,
  attendanceRate: 0,
  activePrograms: 0,
  unreadNotifications: 0,
  programsToSend: 0,
  invoicesDue: 0,
};

function mergeSummary(value: unknown) {
  const v = value && typeof value === 'object' && !('error' in (value as object)) ? (value as Record<string, unknown>) : null;
  if (!v) return { ...emptySummary };
  const num = (key: keyof typeof emptySummary) => {
    const n = Number(v[key]);
    return Number.isFinite(n) ? n : emptySummary[key] as number;
  };
  return {
    todayAppointments: num('todayAppointments'),
    nextAppointment: typeof v.nextAppointment === 'string' ? v.nextAppointment : null,
    activeClients: num('activeClients'),
    monthlySessions: num('monthlySessions'),
    monthlyRevenue: num('monthlyRevenue'),
    attendanceRate: num('attendanceRate'),
    activePrograms: num('activePrograms'),
    unreadNotifications: num('unreadNotifications'),
    programsToSend: num('programsToSend'),
    invoicesDue: num('invoicesDue'),
  };
}

function todayLabel() {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

function monthYearLabel() {
  const s = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function practitionerName(email: string) {
  const local = email.split('@')[0]?.replace(/[._-]/g, ' ') || 'Praticien';
  return local.split(' ').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function practitionerInitials(email: string) {
  return practitionerName(email).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function FrFlag({ className }: { className?: string }) {
  return (
    <span className={className || 'inline-block'} aria-hidden="true" title="France">
      <svg viewBox="0 0 3 2" className="h-[1em] w-[1.5em] overflow-hidden rounded-[2px] shadow-sm" preserveAspectRatio="none">
        <rect width="1" height="2" x="0" fill="#002395" />
        <rect width="1" height="2" x="1" fill="#fff" />
        <rect width="1" height="2" x="2" fill="#ED2939" />
      </svg>
    </span>
  );
}

function initials(name: string) { return name.split(' ').map((part) => part[0]).slice(0, 2).join(''); }
function dateLabel(value?: string | null, withTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', withTime ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}
function timeLabel(value: string) { return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function toDatetimeLocal(value: string) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function titleFor(path: string) {
  const exact: Record<string, string> = {
    '/': 'Vue d’ensemble',
    '/dashboard': 'Vue d’ensemble',
    '/agenda': 'Agenda',
    '/clients': 'Clients',
    '/sessions': 'Toutes les sessions',
    '/sessions/new': 'Nouvelle session',
    '/aide': 'Aide',
    '/formation': 'Formation',
    '/exercices': 'Exercices',
    '/programmes': 'Programmes',
    '/facturation': 'Facturation',
    '/notifications': 'Notifications',
    '/parametres': 'Paramètres',
    '/client': 'Mon espace',
    '/admin': 'Administration',
  };
  if (exact[path]) return exact[path];
  if (path.startsWith('/clients/')) return 'Dossier client';
  if (path.startsWith('/sessions/') && path !== '/sessions/new') return 'Détail session';
  if (path.startsWith('/formation/protocole/')) return 'Protocole ventouse';
  if (path.startsWith('/formation')) return 'Formation';
  return 'CAMPUS';
}

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
    <span className={`grid size-8 place-items-center rounded-[10px] ${light ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}><span className="relative block h-4 w-3.5 border-x-2 border-current rounded-[50%] rotate-45"><i className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" /></span></span>
    <span className={`text-[19px] font-semibold tracking-[-.04em] ${light ? 'text-sidebar-foreground' : 'text-foreground'}`}>CAMPUS</span>
  </Link>;
}

const navGroups = [
  { label: 'Espace', links: [
    { href: '/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { href: '/agenda', label: 'Agenda', icon: CalendarDays },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/sessions', label: 'Toutes les sessions', icon: History },
  ] },
  { label: 'Pratique', links: [
    { href: '/sessions/new', label: 'Nouvelle session', icon: Zap },
    { href: '/aide', label: 'Aide', icon: Lightbulb },
    { href: '/formation', label: 'Formation', icon: GraduationCap },
  ] },
  { label: 'Gestion', links: [
    { href: '/facturation', label: 'Facturation', icon: CircleDollarSign },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/parametres', label: 'Paramètres', icon: Settings },
  ] },
];

function isNavActive(location: string, href: string) {
  if (href === '/dashboard') return location === '/' || location === '/dashboard';
  if (href === '/clients') return location === '/clients' || location.startsWith('/clients/');
  if (href === '/sessions') return location.startsWith('/sessions') && !location.startsWith('/sessions/new');
  if (href === '/formation') return location.startsWith('/formation');
  if (href === '/aide') return location === '/aide' || location.startsWith('/aide/');
  return location === href || location.startsWith(`${href}/`);
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('campus-sidebar') === 'collapsed');
  const { session, logout } = useSession();
  const summaryQuery = useGetDashboardSummary();
  const unread = mergeSummary(summaryQuery.data).unreadNotifications;
  const name = session ? practitionerName(session.email) : 'Praticien';
  const userInitials = session ? practitionerInitials(session.email) : 'PR';
  const practice = session?.practiceName || 'Mon cabinet';
  const current = location.startsWith('/clients/') ? 'Dossier client' : titleFor(location.split('?')[0] || location);
  const sidebarW = collapsed ? 'w-[72px]' : 'w-[245px]';
  const mainPl = collapsed ? 'md:pl-[72px]' : 'md:pl-[245px]';
  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('campus-sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  }
  return <div className="min-h-[100dvh] app-canvas main-edge-glow">
    <aside className={`campus-sidebar fixed inset-y-0 left-0 z-40 flex ${sidebarW} flex-col px-3 py-5 transition-[width,transform] duration-300 ease-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className={`mb-8 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-2'}`}>
        {collapsed ? <Link href="/dashboard" className="grid size-9 place-items-center rounded-[10px] bg-accent text-accent-foreground" title="CAMPUS" data-testid="link-logo-collapsed"><span className="relative block h-4 w-3.5 border-x-2 border-current rounded-[50%] rotate-45"><i className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" /></span></Link> : <Logo light />}
        <button onClick={() => collapsed ? toggleCollapse() : setMobileOpen(false)} className={`rounded-lg p-1.5 hover:bg-white/10 ${collapsed ? 'hidden' : 'md:hidden'}`} data-testid="button-close-mobile-nav"><X size={18} /></button>
        <button onClick={toggleCollapse} className={`hidden rounded-lg p-1.5 hover:bg-white/10 md:grid ${collapsed ? '' : 'ml-auto'}`} title={collapsed ? 'Déplier le menu' : 'Réduire le menu'} data-testid="button-toggle-sidebar">{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
      </div>
      <div className="flex-1 space-y-7 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group) => <div key={group.label}>{!collapsed && <div className="nav-group-label mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.18em]">{group.label}</div>}<nav className="space-y-0.5">{group.links.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(location, href);
          return <Link key={href} href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} className={`nav-link group flex items-center rounded-lg py-2 text-[13px] ${collapsed ? 'justify-center px-2' : 'gap-3 px-2.5'} ${active ? 'nav-link-active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} strokeWidth={active ? 2 : 1.7} />{!collapsed && <span>{label}</span>}{!collapsed && href === '/notifications' && unread > 0 && <span className="ml-auto grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">{unread}</span>}</Link>;
        })}</nav></div>)}
      </div>
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link href="/parametres" className={`nav-link flex items-center rounded-lg py-2.5 hover:bg-white/10 ${collapsed ? 'justify-center px-2' : 'gap-3 px-2'}`} title={collapsed ? name : undefined} data-testid="link-practitioner-profile">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{userInitials}</span>
          {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{name}</span><span className="block truncate text-[11px] opacity-60">{practice}</span></span>}
          {!collapsed && <MoreHorizontal size={16} className="opacity-45" />}
        </Link>
        {!collapsed && <button type="button" onClick={logout} className="mt-2 w-full rounded-lg px-2 py-2 text-left text-[11px] opacity-60 transition hover:bg-white/10 hover:opacity-100" data-testid="button-logout">Se déconnecter</button>}
      </div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" data-testid="button-overlay-mobile-nav" />}
    <WelcomeModal />
    <main className={`min-h-[100dvh] transition-[padding] duration-300 ease-out ${mainPl}`}>
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/55 px-5 backdrop-blur-xl md:px-10" style={{ boxShadow: '0 1px 0 rgba(255,255,255,.8) inset, 0 8px 24px -18px rgba(15,23,42,.18)' }}>
        <div className="mx-auto flex min-h-[88px] max-w-[1440px] items-center gap-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="mr-1 rounded-lg p-1.5 transition hover:bg-muted md:hidden" data-testid="button-open-mobile-nav"><Menu size={20} /></button>
          <div className="min-w-0 shrink-0 basis-[160px] md:basis-[200px]">
            <p className="text-[11px] font-medium uppercase tracking-[.15em] text-muted-foreground">{capitalize(todayLabel())}</p>
            <h1 key={current} className="page-enter truncate text-[17px] font-semibold tracking-[-.02em]">{current}</h1>
          </div>
          <div className="hidden min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 lg:flex" data-testid="header-platform-center">
            <div className="flex items-center gap-2">
              <Awards variant="stamp" title="TOP 1" subtitle="FRANCE" recipient="France" date="2026" level="gold" className="!mx-0 h-14 w-14 scale-[0.55] origin-center" showIcon />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-gradient-to-r from-blue-600 via-white to-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900 shadow-sm" data-testid="badge-top1-france">
                <FrFlag className="inline-flex shrink-0 items-center" /> Top 1 France
              </span>
            </div>
            <p className="max-w-[420px] text-center text-[11px] leading-snug text-slate-600 xl:max-w-[520px] xl:text-[12px]">{PLATFORM_TAGLINE}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <AideHeaderButton path={`${location}${typeof window !== 'undefined' ? window.location.search : ''}`} />
            <Link href="/notifications" className="relative grid size-9 place-items-center rounded-xl border border-white/70 bg-white/50 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-white/80 hover:text-foreground" data-testid="link-header-notifications">
              <Bell size={17} />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-sky-500" />}
            </Link>
            <button className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition hover:bg-white md:flex" data-testid="button-workspace-menu">
              {name} <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 pb-2 lg:hidden">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-gradient-to-r from-blue-600 via-white to-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900 shadow-sm">
            <FrFlag className="inline-flex shrink-0 items-center" /> Top 1 France
          </span>
          <p className="text-center text-[10px] leading-snug text-slate-500">{PLATFORM_TAGLINE}</p>
        </div>
      </header>
      <div key={location} className="page-enter mx-auto max-w-[1440px] px-5 py-8 pb-24 md:px-10 md:pb-8 lg:px-12">{children}</div>
    </main>
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {voiceOpen && (
          <div className="w-[min(100vw-2rem,400px)] overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-b from-[#1a3350] to-[#0f1c2e] p-4 shadow-2xl shadow-sky-900/40 animate-enter">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                <MessageCircle size={16} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/70">Assistant IA</p>
                <p className="text-sm font-semibold text-white">CAMPUS · Chat</p>
              </div>
            </div>
            <button type="button" onClick={() => setVoiceOpen(false)} className="rounded-lg p-1.5 text-sky-200/70 transition hover:bg-white/10 hover:text-white" aria-label="Fermer"><X size={16} /></button>
          </div>
          <CampusVoiceAssistant onClose={() => setVoiceOpen(false)} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setVoiceOpen((v) => !v)}
        className={`grid size-14 place-items-center rounded-full shadow-lg transition duration-300 ${voiceOpen ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' : 'bg-[#132338] text-white ring-2 ring-sky-400/30 hover:scale-105'}`}
        title="Chat IA CAMPUS"
        data-testid="button-voice-assistant-fab"
      >
        <MessageCircle size={22} />
      </button>
    </div>
    <nav className="glass-tab-bar fixed inset-x-2 bottom-2 z-40 flex justify-around gap-0.5 rounded-2xl px-1.5 py-1.5 md:hidden" data-testid="mobile-tab-bar">
      {[
        { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
        { href: '/agenda', label: 'Agenda', icon: CalendarDays },
        { href: '/clients', label: 'Clients', icon: Users },
        { href: '/sessions', label: 'Sessions', icon: History },
        { href: '/parametres', label: 'Compte', icon: Settings },
      ].map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition ${isNavActive(location, href) ? 'glass-tab-active text-primary' : 'text-slate-600'}`}
          data-testid={`link-mobile-${label}`}
        >
          <Icon size={18} strokeWidth={isNavActive(location, href) ? 2.2 : 1.7} />
          <span className="truncate text-[10px] font-semibold leading-none">{label}</span>
        </Link>
      ))}
    </nav>
    <AppointmentReminderPopup />
  </div>;
}

function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-primary">{eyebrow}</p>}<h2 className="text-[28px] font-semibold tracking-[-.045em] md:text-[32px]">{title}</h2>{detail && <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>}</div>{action}</div>;
}
function Empty({ icon: Icon, title, body, action }: { icon: typeof Search; title: string; body: string; action?: ReactNode }) { return <div className="surface flex min-h-[260px] flex-col items-center justify-center rounded-2xl p-8 text-center"><span className="mb-4 grid size-11 place-items-center rounded-xl bg-secondary text-primary"><Icon size={21} /></span><h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">{body}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function Loading({ rows = 4 }: { rows?: number }) { return <div className="surface overflow-hidden rounded-2xl p-5">{Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton mb-4 h-12 rounded-lg last:mb-0" />)}</div>; }
function ErrorState({ retry }: { retry?: () => void }) { return <div className="surface rounded-2xl p-10 text-center"><span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-[#f8e3dc] text-destructive"><Activity size={18} /></span><h3 className="font-semibold">Impossible de charger cet espace</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Le serveur n'a pas répondu. Vos données restent intactes.</p>{retry && <button onClick={retry} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" data-testid="button-retry">Réessayer</button>}</div>; }
function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'orange' | 'red' }) { return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em] ${tone === 'green' ? 'bg-[#dcebe4] text-[#2d6a59]' : tone === 'orange' ? 'bg-[#f6e6d5] text-[#a96532]' : tone === 'red' ? 'bg-[#f8e1db] text-[#a44c3d]' : 'bg-muted text-muted-foreground'}`}>{children}</span>; }
function Avatar({ name, color = '#79A9A2', small = false }: { name: string; color?: string; small?: boolean }) { return <span className={`grid shrink-0 place-items-center rounded-full font-semibold text-[#173c3b] ${small ? 'size-7 text-[10px]' : 'size-10 text-xs'}`} style={{ backgroundColor: color }}>{initials(name)}</span>; }
function Modal({
  title,
  children,
  onClose,
  wide,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center p-3 sm:p-4" data-testid="modal-backdrop">
      <button
        type="button"
        aria-label="Fermer le fond"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}
      />
      <div
        className={`relative z-10 flex w-full flex-col overflow-hidden rounded-2xl shadow-2xl animate-enter ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        style={{
          maxHeight: 'min(90dvh, 880px)',
          marginTop: 'env(safe-area-inset-top, 0px)',
          background: 'linear-gradient(165deg, #ffffff 0%, #eef6fb 55%, #e5f0f8 100%)',
          border: '1px solid rgba(14, 116, 168, 0.28)',
          boxShadow: '0 24px 64px -20px rgba(15,42,72,0.45), 8px 0 40px -16px rgba(14,116,168,0.35)',
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sky-200/60 bg-[#132338] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
            data-testid="button-close-modal"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-sky-200/50 bg-sky-50/80 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-xs font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${className || ''}`}
    />
  );
}
function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[92px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${className || ''}`}
    />
  );
}
function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`btn-primary ${className || ''}`}>
      {children}
    </button>
  );
}
function GhostButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`btn-ghost ${className || ''}`}>
      {children}
    </button>
  );
}

function monthRevenueEuro(sessions: any[] = []) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const inMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === y && d.getMonth() === m;
  };

  let total = 0;

  // Factures du mois
  for (const inv of loadFrenchInvoices()) {
    if (inv.status === 'cancelled') continue;
    const when = inv.createdAt || '';
    if (!when || !inMonth(when)) continue;
    total += computeTotals(inv.lines, inv.sellerSnapshot.vatMode).totalTtc;
  }

  // Sessions du mois — ignorées si déjà facturées (évite le double comptage)
  for (const s of sessions) {
    if (!s?.occurredAt || !inMonth(s.occurredAt)) continue;
    if (isSessionBilled(Number(s.id))) continue;
    total += Number(s.price) || 0;
  }

  return Math.round(total * 100) / 100;
}

function Dashboard() {
  const { session } = useSession();
  const name = session ? practitionerName(session.email) : 'Praticien';
  const summaryQuery = useGetDashboardSummary();
  const activityQuery = useGetDashboardActivity();
  const appointmentsQuery = useListAppointments({});
  const clientsQ = useListClients({ status: 'active' });
  const sessionsQ = useListSessions();
  const s = mergeSummary(summaryQuery.data);
  const activity = listOr(activityQuery.data, []);
  const appointments = mergeAppointmentLists(listOr(appointmentsQuery.data, []), listLocalAppointments());
  const todayAppointments = upcomingAppointments(appointments, 5);
  const clients = mergeClientLists(listOr(clientsQ.data, []), listLocalClients());
  const sessions = mergeSessionLists(listOr(sessionsQ.data, []), listLocalSessions());
  const ca = Math.max(s.monthlyRevenue || 0, monthRevenueEuro(sessions));
  const activeClients = Math.max(s.activeClients || 0, clients.length);
  const monthSessions = Math.max(
    s.monthlySessions || 0,
    sessions.filter((x) => {
      const d = new Date(x.occurredAt);
      const n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
    }).length,
  );

  const recentLocal = [
    ...sessions.slice(0, 4).map((x) => ({
      id: `s-${x.id}`,
      title: `Session · ${x.clientName}`,
      detail: `${x.durationMinutes || 0} min · ressenti ${(x as any).beforeFeeling}/10 → ${(x as any).afterFeeling}/10`,
      createdAt: x.occurredAt,
    })),
    ...appointments
      .filter((a) => a.status !== 'cancelled')
      .slice(-3)
      .reverse()
      .map((a: any) => ({
        id: `a-${a.id}`,
        title: `RDV · ${a.clientName}`,
        detail: `${a.serviceName || 'Séance'} · ${Number(a.price) || 0} €`,
        createdAt: a.startsAt,
      })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const feed = activity.length > 0 ? activity : recentLocal;

  if (summaryQuery.isLoading && clients.length === 0) {
    return (
      <>
        <SectionHeading eyebrow="Votre rythme" title={`Bonjour ${name}`} detail="Voici ce qui mérite votre attention aujourd’hui." />
        <Loading rows={3} />
      </>
    );
  }

  return (
    <div className="animate-enter">
      <SectionHeading
        eyebrow={capitalize(todayLabel())}
        title={`Bonjour ${name}`}
        detail="Vue d’ensemble de votre cabinet — clients, agenda et chiffre d’affaires."
        action={
          <Link href="/sessions/new" className="btn-3d inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition" data-testid="link-new-session-dashboard">
            <Plus size={17} /> Documenter une session
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarDays} label="Rendez-vous aujourd’hui" value={Math.max(s.todayAppointments, todayAppointments.length)} detail={s.nextAppointment ? `Prochain à ${timeLabel(s.nextAppointment)}` : todayAppointments[0] ? `Prochain à ${timeLabel(todayAppointments[0].startsAt)}` : 'Aucun prochain rendez-vous'} tone="teal" />
        <Metric icon={Users} label="Clients actifs" value={activeClients} detail={activeClients === 0 ? 'Aucun client pour le moment' : 'Dans votre suivi'} tone="sand" />
        <Metric icon={Activity} label="Sessions ce mois" value={monthSessions} detail={monthSessions === 0 ? 'Aucune session ce mois' : monthYearLabel()} tone="lilac" />
        <Metric icon={CircleDollarSign} label="Chiffre d’affaires" value={`${ca.toLocaleString('fr-FR')} €`} detail={`Sessions + factures · ${monthYearLabel()}`} tone="peach" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface surface-3d overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Aujourd’hui</p>
              <p className="mt-0.5 text-xs text-slate-600">Vos prochains rendez-vous</p>
            </div>
            <Link href="/agenda" className="text-xs font-semibold text-primary hover:underline" data-testid="link-view-agenda">
              Voir l’agenda <ArrowRight className="ml-1 inline" size={13} />
            </Link>
          </div>
          {todayAppointments.length > 0 ? (
            <div className="divide-y divide-border/60">{todayAppointments.map((a: any) => <AppointmentRow key={a.id} appointment={a} />)}</div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-600">Aucun rendez-vous prévu aujourd’hui.</div>
          )}
        </div>

        <div className="surface surface-3d rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Votre mois en un regard</p>
              <p className="mt-0.5 text-xs text-slate-600">Chiffre d’affaires généré</p>
            </div>
            <span className="font-mono text-[10px] font-medium text-slate-600">{monthYearLabel()}</span>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{ca.toLocaleString('fr-FR')} €</p>
          <p className="mt-1 text-sm text-slate-700">
            {monthSessions} session{monthSessions > 1 ? 's' : ''} · {activeClients} client{activeClients > 1 ? 's' : ''}
          </p>
          <div className="mt-5 border-t border-border/70 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Activité récente</p>
              <Link href="/notifications" className="text-xs font-semibold text-primary hover:underline">Tout voir</Link>
            </div>
            {feed.length > 0 ? (
              <div className="space-y-3">
                {feed.slice(0, 5).map((item: any) => (
                  <div className="flex items-start gap-3" key={item.id}>
                    <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-secondary text-primary">
                      <Activity size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-600">{item.detail}</p>
                    </div>
                    <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{dateLabel(item.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-600">Aucune activité récente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof Activity; label: string; value: ReactNode; detail: string; tone: string }) {
  const bg: Record<string, string> = { teal: 'bg-secondary text-primary', sand: 'bg-[#f4e9d8] text-[#a56a37]', lilac: 'bg-[#e9e2ee] text-[#775c8b]', peach: 'bg-[#f5e0d8] text-[#a65343]' };
  return (
    <div className="surface surface-3d rounded-2xl p-4">
      <div className={`mb-4 grid size-9 place-items-center rounded-xl ${bg[tone]}`}>
        <Icon size={17} />
      </div>
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-.04em] text-slate-900">{value}</p>
      <p className="mt-1 font-mono text-[10px] text-slate-600">{detail}</p>
    </div>
  );
}
function AppointmentRow({ appointment: a }: { appointment: any }) { return <div className="group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/30"><div className="w-12 border-r border-border/80 pr-3 text-right"><p className="font-mono text-xs font-medium text-slate-900">{timeLabel(a.startsAt)}</p><p className="mt-1 font-mono text-[10px] text-slate-600">{timeLabel(a.endsAt)}</p></div><Avatar name={a.clientName} color={a.clientId === 1 ? '#D9A36A' : '#79A9A2'} small /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{a.clientName}</p><p className="mt-0.5 truncate text-xs text-slate-700">{a.serviceName}</p></div><Pill tone={a.status === 'confirmed' ? 'green' : 'orange'}>{a.status === 'confirmed' ? 'Confirmé' : 'En attente'}</Pill><MoreHorizontal size={16} className="text-slate-500" /></div>; }

function Clients() {
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(urlParams.get('search') || '');
  const [show, setShow] = useState(urlParams.get('ajouter') === '1' || urlParams.get('add') === '1');
  const [toast, setToast] = useState('');
  const [identity, setIdentity] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
  const [localTick, setLocalTick] = useState(0);
  const q = useListClients({ search: search || undefined, status: 'active' });
  const sessionsQ = useListSessions();
  const appointmentsQ = useListAppointments({});
  const create = useCreateClient();
  const update = useUpdateClient();
  const archive = useArchiveClient();
  const [editClient, setEditClient] = useState<any | null>(null);
  const [editTab, setEditTab] = useState<'identite' | 'suivi'>('identite');

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('ajouter') === '1' || p.get('add') === '1') setShow(true);
  }, []);

  const allSessions = mergeSessionLists(listOr(sessionsQ.data, []), listLocalSessions());
  const appointments: any[] = mergeAppointmentLists(listOr(appointmentsQ.data, []), listLocalAppointments());
  const now = Date.now();
  void localTick;

  const clients: any[] = mergeClientLists(listOr<any>(q.data, []), listLocalClients())
    .filter((c: any) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()))
    .map((c: any) => {
      const clientSessions = allSessions.filter((s: any) => s.clientId === c.id);
      const lastSessionAt = clientSessions[0]?.occurredAt || c.lastSessionAt || null;
      const nextAppt = appointments
        .filter((a: any) => a.clientId === c.id && new Date(a.startsAt).getTime() >= now && a.status !== 'cancelled')
        .sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
      return {
        ...c,
        lastSessionAt,
        nextAppointmentAt: nextAppt?.startsAt || c.nextAppointmentAt || null,
        sessionsCount: Math.max(Number(c.sessionsCount) || 0, clientSessions.length),
      };
    });

  function openAdd() {
    setIdentity({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
    setShow(true);
    setLocation('/clients?ajouter=1');
  }

  function closeAdd() {
    setShow(false);
    setLocation('/clients');
  }

  function finishAdd(created: any, localFallback = false) {
    const id = created?.id;
    queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    setLocalTick((n) => n + 1);
    setShow(false);
    setToast('Client ajouté');
    setLocation(id != null ? `/clients/${id}` : '/clients');
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = {
      firstName: identity.firstName.trim(),
      lastName: identity.lastName.trim(),
      email: identity.email.trim(),
      phone: identity.phone.trim(),
      notes: identity.notes.trim(),
    };
    if (!data.firstName || !data.lastName || !data.email) {
      setToast('Renseignez prénom, nom et e-mail');
      return;
    }
    create.mutate(
      { data } as any,
      {
        onSuccess: (created: any) => finishAdd(created, false),
        onError: () => {
          const local = createLocalClient(data);
          finishAdd(local, true);
        },
      },
    );
  }

  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editClient) return;
    const f = new FormData(e.currentTarget);
    update.mutate(
      {
        id: editClient.id,
        data: {
          firstName: String(f.get('firstName')),
          lastName: String(f.get('lastName')),
          email: String(f.get('email')),
          phone: String(f.get('phone') || ''),
          notes: String(f.get('notes') || ''),
        },
      } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          setEditClient(null);
          setToast('Client modifié');
        },
        onError: () => setToast('Impossible de modifier le client'),
      },
    );
  }

  return (
    <div className="animate-enter">
      <SectionHeading
        eyebrow="Carnet de pratique"
        title="Clients"
        detail={`${clients.length} personnes dans votre suivi`}
        action={<PrimaryButton onClick={openAdd} data-testid="button-add-client"><Plus size={17} /> Ajouter un client</PrimaryButton>}
      />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground" />
          <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom, une adresse…" className="!pl-10" data-testid="input-search-clients" />
        </div>
        <GhostButton data-testid="button-filter-clients"><SlidersHorizontal size={15} /> Filtres <ChevronDown size={14} /></GhostButton>
      </div>
      {q.isLoading && listLocalClients().length === 0 ? <Loading /> : clients.length === 0 ? (
        <Empty icon={Users} title="Aucun client trouvé" body="Essayez une autre recherche ou ajoutez votre premier client." action={<PrimaryButton onClick={openAdd} data-testid="button-add-first-client"><Plus size={16} /> Ajouter un client</PrimaryButton>} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.6fr_1.2fr_.75fr_.8fr_.5fr] border-b border-slate-100 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground md:grid">
            <span>Client</span><span>Dernière session</span><span>Sessions</span><span>Prochain rendez-vous</span><span />
          </div>
          <div className="divide-y divide-slate-100">
            {clients.map((client) => (
              <div key={client.id} className="group grid items-center gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[1.6fr_1.2fr_.75fr_.8fr_.5fr]" data-testid={`row-client-${client.id}`}>
                <Link href={`/clients/${client.id}`} className="flex min-w-0 items-center gap-3" data-testid={`link-client-${client.id}`}>
                  <Avatar name={`${client.firstName} ${client.lastName}`} color={client.avatarColor} />
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">{client.firstName} {client.lastName}</strong>
                    <span className="block truncate text-xs text-muted-foreground">{client.email}</span>
                  </span>
                </Link>
                <span className="text-xs text-muted-foreground">{dateLabel(client.lastSessionAt, true)}</span>
                <span className="text-sm font-medium">{client.sessionsCount}<span className="ml-1 text-xs font-normal text-muted-foreground">sessions</span></span>
                <span className="text-xs text-muted-foreground">{dateLabel(client.nextAppointmentAt, true)}</span>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTab('identite');
                      setEditClient(client);
                    }}
                    className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                    title="Modifier"
                    data-testid={`button-edit-client-${client.id}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm('Archiver ce client ?')) return;
                      if (client.id < 0 || client.localOnly) {
                        archiveLocalClient(client.id);
                        setLocalTick((n) => n + 1);
                        setToast('Client archivé');
                        return;
                      }
                      archive.mutate({ id: client.id }, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
                          setToast('Client archivé');
                        },
                        onError: () => {
                          archiveLocalClient(client.id);
                          setLocalTick((n) => n + 1);
                          setToast('Client archivé localement');
                        },
                      });
                    }}
                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-[#f8e1db] hover:text-destructive"
                    data-testid={`button-archive-client-${client.id}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {show && (
        <Modal
          title="Ajouter un client"
          onClose={closeAdd}
          footer={
            <>
              <GhostButton type="button" onClick={closeAdd} data-testid="button-cancel-client">Annuler</GhostButton>
              <PrimaryButton type="submit" form="add-client-form" disabled={create.isPending} data-testid="button-save-client">
                {create.isPending ? 'Ajout…' : 'Ajouter le client'}
              </PrimaryButton>
            </>
          }
        >
          <form id="add-client-form" onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-600">Identité uniquement. L’anamnèse et la fiche de suivi se font dans le dossier client ou en nouvelle session.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom"><TextInput value={identity.firstName} onChange={(e) => setIdentity((s) => ({ ...s, firstName: e.target.value }))} required placeholder="Louise" data-testid="input-client-first-name" /></Field>
              <Field label="Nom"><TextInput value={identity.lastName} onChange={(e) => setIdentity((s) => ({ ...s, lastName: e.target.value }))} required placeholder="Martin" data-testid="input-client-last-name" /></Field>
              <Field label="Adresse email"><TextInput value={identity.email} onChange={(e) => setIdentity((s) => ({ ...s, email: e.target.value }))} type="email" required placeholder="louise@exemple.fr" data-testid="input-client-email" /></Field>
              <Field label="Téléphone"><TextInput value={identity.phone} onChange={(e) => setIdentity((s) => ({ ...s, phone: e.target.value }))} type="tel" inputMode="tel" placeholder="06 00 00 00 00" data-testid="input-client-phone" /></Field>
            </div>
            <Field label="Notes rapides"><TextArea value={identity.notes} onChange={(e) => setIdentity((s) => ({ ...s, notes: e.target.value }))} placeholder="Contexte court (optionnel)…" data-testid="textarea-client-notes" /></Field>
          </form>
        </Modal>
      )}
      {editClient && (
        <Modal
          title="Modifier le client"
          wide
          onClose={() => setEditClient(null)}
          footer={
            editTab === 'identite' ? (
              <>
                <GhostButton type="button" onClick={() => setEditClient(null)}>Annuler</GhostButton>
                <PrimaryButton type="submit" form="edit-client-form" disabled={update.isPending}>
                  {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </PrimaryButton>
              </>
            ) : (
              <GhostButton type="button" onClick={() => setEditClient(null)}>Fermer</GhostButton>
            )
          }
        >
          <div className="mb-4 flex gap-2 rounded-xl bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setEditTab('identite')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${editTab === 'identite' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              Identité
            </button>
            <button
              type="button"
              onClick={() => setEditTab('suivi')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${editTab === 'suivi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              Fiche de suivi
            </button>
          </div>
          {editTab === 'identite' ? (
            <form id="edit-client-form" onSubmit={submitEdit} className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom"><TextInput name="firstName" required defaultValue={editClient.firstName} data-testid="input-edit-client-first" /></Field>
              <Field label="Nom"><TextInput name="lastName" required defaultValue={editClient.lastName} data-testid="input-edit-client-last" /></Field>
              <Field label="Adresse email"><TextInput name="email" type="email" required defaultValue={editClient.email} data-testid="input-edit-client-email" /></Field>
              <Field label="Téléphone">
                <TextInput
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={editClient.phone || ''}
                  onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                  placeholder="06 00 00 00 00"
                  data-testid="input-edit-client-phone"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes"><TextArea name="notes" defaultValue={editClient.notes || ''} data-testid="textarea-edit-client-notes" /></Field>
              </div>
            </form>
          ) : (
            <ClientIntakeForm
              clientKey={`id:${editClient.id}`}
              clientName={`${editClient.firstName} ${editClient.lastName}`}
              leaveOnSave={false}
              onSaved={() => setToast('Suivi enregistré')}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function Agenda() {
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState('');
  const [tick, setTick] = useState(0);
  const range0 = defaultAppointmentRange();
  const [startsAt, setStartsAt] = useState(range0.startsAt);
  const [endsAt, setEndsAt] = useState(range0.endsAt);
  const q = useListAppointments({});
  const create = useCreateAppointment();
  const cancel = useCancelAppointment();
  void tick;
  const appointments: any[] = mergeAppointmentLists(listOr(q.data, []), listLocalAppointments());
  const clientsQ = useListClients({ status: 'active' });
  const clients: any[] = mergeClientLists(listOr<any>(clientsQ.data, []), listLocalClients());

  function openNew() {
    const r = defaultAppointmentRange();
    setStartsAt(r.startsAt);
    setEndsAt(r.endsAt);
    setShow(true);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!startsAt || !endsAt) {
      setToast('Indiquez début et fin (JJ MM AAAA + heure)');
      return;
    }
    const f = new FormData(e.currentTarget);
    const clientId = Number(f.get('clientId'));
    const client = clients.find((c) => c.id === clientId);
    const payload = {
      clientId,
      title: String(f.get('title')),
      serviceName: String(f.get('serviceName')),
      startsAt,
      endsAt,
      price: Number(f.get('price')),
    };
    const local = {
      id: nextLocalAppointmentId(),
      clientId,
      clientName: client ? `${client.firstName} ${client.lastName}` : 'Client',
      title: payload.title,
      serviceName: payload.serviceName,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      price: payload.price,
      status: 'confirmed' as const,
      localOnly: true,
    };
    create.mutate(
      { data: payload } as any,
      {
        onSuccess: () => {
          // Pas de copie locale si l’API a bien créé — sinon doublon dans l’agenda
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
          setTick((n) => n + 1);
          setShow(false);
          setToast('Rendez-vous créé');
        },
        onError: () => {
          upsertLocalAppointment(local);
          setTick((n) => n + 1);
          setShow(false);
          setToast('Rendez-vous créé');
        },
      },
    );
  }

  const visible = appointments.filter((a) => a.status !== 'cancelled');

  return (
    <div className="animate-enter">
      <SectionHeading
        eyebrow="Votre semaine"
        title="Agenda"
        detail={`${capitalize(todayLabel())} · ${visible.length} rendez-vous`}
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href="https://calendar.google.com/calendar/u/0/r"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 text-sm font-semibold text-[#132338] shadow-sm hover:bg-sky-50"
              data-testid="button-google-calendar"
              title="Partenaire Google Calendar"
            >
              <CalendarDays size={16} className="text-primary" />
              Caler avec Google Calendar
            </a>
            <GhostButton data-testid="button-agenda-today">Aujourd’hui</GhostButton>
            <PrimaryButton onClick={openNew} data-testid="button-add-appointment">
              <Plus size={17} /> Nouveau rendez-vous
            </PrimaryButton>
          </div>
        }
      />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="surface overflow-hidden rounded-2xl">
        <div className="border-b border-border/70 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">{capitalize(todayLabel())}</p>
        </div>
        <div className="divide-y divide-border/60">
          {visible.length ? (
            visible.map((a) => (
              <div key={a.id} className="group flex min-h-[110px] gap-4 p-5 transition hover:bg-muted/20">
                <div className="w-14 shrink-0 pt-1 text-right font-mono text-xs text-muted-foreground">{timeLabel(a.startsAt)}</div>
                <div className={`w-1 rounded-full ${a.status === 'confirmed' ? 'bg-primary' : 'bg-accent'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Pill tone={a.status === 'confirmed' ? 'green' : 'orange'}>{a.status === 'confirmed' ? 'Confirmé' : 'En attente'}</Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.clientName} · {a.serviceName}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{dateLabel(a.startsAt, true)}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-sm">{a.price} €</span>
                  <button
                    onClick={() => {
                      if (!window.confirm('Annuler ce rendez-vous ?')) return;
                      if (a.localOnly || a.id < 0) {
                        cancelLocalAppointment(a.id);
                        setTick((n) => n + 1);
                        setToast('Rendez-vous annulé');
                        return;
                      }
                      cancel.mutate(
                        { id: a.id },
                        {
                          onSuccess: () => {
                            cancelLocalAppointment(a.id);
                            queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey({}) });
                            setTick((n) => n + 1);
                            setToast('Rendez-vous annulé');
                          },
                        },
                      );
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 hover:bg-[#f8e1db] hover:text-destructive group-hover:opacity-100"
                    data-testid={`button-cancel-appointment-${a.id}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <Empty
              icon={CalendarDays}
              title="Agenda libre"
              body="Aucun rendez-vous pour le moment."
              action={
                <PrimaryButton onClick={openNew} data-testid="button-add-first-appointment">
                  <Plus size={16} /> Créer un rendez-vous
                </PrimaryButton>
              }
            />
          )}
        </div>
      </div>
      {show && (
        <Modal title="Nouveau rendez-vous" onClose={() => setShow(false)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Client">
              <select name="clientId" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" data-testid="select-appointment-client" required>
                {clients.length === 0 ? (
                  <option value="">Aucun client — ajoutez-en un d’abord</option>
                ) : (
                  clients.map((c: any) => (
                    <option value={c.id} key={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))
                )}
              </select>
            </Field>
            <Field label="Intitulé">
              <TextInput name="title" required placeholder="Session de suivi" data-testid="input-appointment-title" />
            </Field>
            <Field label="Service">
              <TextInput name="serviceName" required placeholder="Massage & mobilité" data-testid="input-appointment-service" />
            </Field>
            <div className="grid gap-4">
              <FrenchDateTimeField
                label="Début"
                value={startsAt}
                onChange={setStartsAt}
                data-testid="input-appointment-start"
              />
              <FrenchDateTimeField
                label="Fin"
                value={endsAt}
                onChange={setEndsAt}
                data-testid="input-appointment-end"
              />
            </div>
            <Field label="Tarif">
              <TextInput name="price" type="number" min="0" defaultValue="75" data-testid="input-appointment-price" />
            </Field>
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setShow(false)} data-testid="button-cancel-appointment-form">
                Annuler
              </GhostButton>
              <PrimaryButton type="submit" disabled={create.isPending || clients.length === 0} data-testid="button-save-appointment">
                Créer le rendez-vous
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const q = useGetClient(clientId > 0 ? clientId : 0, { query: { queryKey: getGetClientQueryKey(clientId) } });
  const archive = useArchiveClient();
  const update = useUpdateClient();
  const [notesTick, setNotesTick] = useState(0);
  const localClient = listLocalClients().find((c) => c.id === clientId);
  const client: any = (clientId > 0 ? q.data : null) || localClient;
  const sessions: any[] = listOr(client?.sessions, []);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesToast, setNotesToast] = useState('');
  void notesTick;
  if (clientId > 0 && q.isLoading && !localClient) return <Loading />;
  if (!client) return <ErrorState retry={() => (clientId > 0 ? q.refetch() : undefined)} />;
  const localForClient = listLocalSessions().filter((s) => s.clientId === client.id);
  const allSessions = mergeSessionLists(sessions, localForClient);
  const displayNotes = (localClient?.notes ?? client.notes ?? '') as string;

  function openNotesEdit() {
    setNotesDraft(displayNotes);
    setEditingNotes(true);
  }

  function saveNotes() {
    const next = notesDraft.trim();
    if (client.id < 0 || client.localOnly) {
      updateLocalClientFields(client.id, { notes: next });
      setEditingNotes(false);
      setNotesTick((n) => n + 1);
      setNotesToast('Notes de suivi enregistrées');
      return;
    }
    update.mutate(
      {
        id: client.id,
        data: {
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone || '',
          notes: next,
        },
      } as any,
      {
        onSuccess: () => {
          upsertLocalClient({
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone || '',
            notes: next,
            status: 'active',
            avatarColor: client.avatarColor || '#79A9A2',
            sessionsCount: client.sessionsCount || 0,
            lastSessionAt: client.lastSessionAt || null,
            nextAppointmentAt: client.nextAppointmentAt || null,
            createdAt: client.createdAt || new Date().toISOString(),
            localOnly: true,
          });
          queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(client.id) });
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          setEditingNotes(false);
          setNotesTick((n) => n + 1);
          setNotesToast('Notes de suivi enregistrées');
        },
        onError: () => {
          updateLocalClientFields(client.id, { notes: next }) ||
            upsertLocalClient({
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              phone: client.phone || '',
              notes: next,
              status: 'active',
              avatarColor: client.avatarColor || '#79A9A2',
              sessionsCount: client.sessionsCount || 0,
              lastSessionAt: client.lastSessionAt || null,
              nextAppointmentAt: client.nextAppointmentAt || null,
              createdAt: client.createdAt || new Date().toISOString(),
              localOnly: true,
            });
          setEditingNotes(false);
          setNotesTick((n) => n + 1);
          setNotesToast('Notes de suivi enregistrées');
        },
      },
    );
  }

  return (
    <div className="animate-enter">
      {notesToast ? <Toast message={notesToast} onClose={() => setNotesToast('')} /> : null}
      <Link href="/clients" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="link-back-clients"><ArrowLeft size={14} /> Tous les clients</Link>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar name={`${client.firstName} ${client.lastName}`} color={client.avatarColor} />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Dossier actif</p>
            <h2 className="text-[30px] font-semibold tracking-[-.045em]">{client.firstName} {client.lastName}</h2>
            <p className="text-sm text-muted-foreground">{client.email} · {client.phone || 'Téléphone non renseigné'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {client.email ? (
            <a
              href={`mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent('CAMPUS — votre praticien')}`}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-primary/40"
              data-testid="link-client-email"
            >
              <Mail size={15} /> E-mail
            </a>
          ) : null}
          {client.phone ? (
            <a
              href={`sms:${String(client.phone).replace(/[^\d+]/g, '')}`}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:border-primary/40"
              data-testid="link-client-sms"
            >
              <MessageSquare size={15} /> Message
            </a>
          ) : null}
          <GhostButton
            onClick={() => {
              if (!window.confirm('Archiver ce dossier ?')) return;
              if (client.id < 0 || client.localOnly) {
                archiveLocalClient(client.id);
                window.location.href = '/clients';
                return;
              }
              archive.mutate({ id: client.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() }) });
            }}
            data-testid="button-archive-client-detail"
          >
            <Trash2 size={15} /> Archiver
          </GhostButton>
          <Link href={`/sessions/new?clientId=${client.id}`} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground" data-testid="link-new-session-client"><Plus size={16} /> Nouvelle session</Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Activity} label="Sessions documentées" value={allSessions.length || client.sessionsCount} detail={`Depuis ${dateLabel(client.firstSessionAt || client.lastSessionAt)}`} tone="teal" />
        <Metric icon={CalendarDays} label="Prochain rendez-vous" value={dateLabel(client.nextAppointmentAt)} detail={client.nextAppointmentAt ? timeLabel(client.nextAppointmentAt) : 'À planifier'} tone="sand" />
        <Metric icon={ClipboardList} label="Programme actif" value={client.activeProgramCount || 0} detail="À suivre ensemble" tone="lilac" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <div className="surface rounded-2xl">
            <div className="border-b border-border/70 px-5 py-4"><p className="text-sm font-semibold">Historique & évolution</p></div>
            <div className="divide-y divide-border/60">
              {allSessions.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Aucune session pour ce client.</p>
              ) : allSessions.map((s: any) => (
                <Link href={`/sessions/${s.id}`} key={s.id} className="group block px-5 py-5 transition hover:bg-sky-50/40" data-testid={`link-session-${s.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[.12em] text-primary">{dateLabel(s.occurredAt)}</p>
                      <h3 className="mt-1 font-semibold">Session de {s.durationMinutes} min</h3>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground transition group-hover:translate-x-1" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">{(s.zones || []).map((z: any) => <Pill key={z.label}>{z.label} · {z.technique}</Pill>)}</div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{s.observations}</p>
                  <div className="mt-3 flex gap-4 font-mono text-[10px] text-muted-foreground"><span>Avant {s.beforeFeeling}/10</span><span className="text-emerald-600">Après {s.afterFeeling}/10</span></div>
                </Link>
              ))}
            </div>
          </div>
          <ClientSessionCoach client={{ id: client.id, firstName: client.firstName, lastName: client.lastName, email: client.email, phone: client.phone, notes: client.notes }} />
        </div>
        <div className="space-y-6">
          <ClientIntakeForm clientKey={`id:${client.id}`} clientName={`${client.firstName} ${client.lastName}`} />
          <div className="surface rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Notes de suivi</p>
              {!editingNotes ? (
                <button
                  type="button"
                  onClick={openNotesEdit}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  data-testid="button-edit-client-notes"
                  aria-label="Modifier les notes"
                >
                  <Pencil size={14} />
                </button>
              ) : null}
            </div>
            {editingNotes ? (
              <div className="space-y-3">
                <TextArea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={5}
                  placeholder="Contexte, précautions, objectifs de suivi…"
                  data-testid="textarea-client-suivi-notes"
                />
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton type="button" onClick={saveNotes} data-testid="button-save-client-notes">
                    Enregistrer
                  </PrimaryButton>
                  <GhostButton type="button" onClick={() => setEditingNotes(false)} data-testid="button-cancel-client-notes">
                    Annuler
                  </GhostButton>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                {displayNotes || 'Aucune note pour le moment. Cliquez sur le crayon pour en ajouter.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewSession() {
  return (
    <NewSessionForm
      SectionHeading={SectionHeading}
      PrimaryButton={PrimaryButton}
      Field={Field}
      TextInput={TextInput}
      TextArea={TextArea}
      Avatar={Avatar}
      Empty={Empty}
      Toast={Toast}
      Link={Link}
    />
  );
}
function Step({ n, label, active }: { n: string; label: string; active?: boolean }) { return <span className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs ${active ? 'bg-secondary font-medium text-primary' : 'bg-muted text-muted-foreground'}`}><span className="font-mono text-[10px]">{n}</span>{label}</span>; }
function Toast({ message, onClose }: { message: string; onClose: () => void }) { return <button onClick={onClose} className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl bg-sidebar px-4 py-3 text-sm text-sidebar-foreground shadow-xl animate-enter" data-testid="status-toast"><CheckCircle2 size={16} className="text-sidebar-primary" />{message}<X size={14} className="ml-2 text-sidebar-foreground/50" /></button>; }

function AllSessions() {
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(urlParams.get('search') || '');
  const [toast, setToast] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const q = useListSessions();
  void tick;
  const sessions: any[] = mergeSessionLists(listOr(q.data, []), listLocalSessions())
    .filter((s) => !search || `${s.clientName}`.toLowerCase().includes(search.toLowerCase()));

  const byClient = sessions.reduce((acc: Record<string, number>, s: any) => {
    acc[s.clientName] = (acc[s.clientName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topClients = Object.entries(byClient).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Supprimer cette session ?')) return;
    setDeletingId(id);
    try {
      if (id < 0) {
        deleteLocalSession(id);
        setTick((t) => t + 1);
      } else {
        await deleteSession(id);
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      }
      setToast('Session supprimée');
    } catch {
      setToast('Impossible de supprimer la session');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="animate-enter">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <SectionHeading
        eyebrow="Historique de pratique"
        title="Toutes les sessions"
        detail={`${sessions.length} session${sessions.length > 1 ? 's' : ''} documentée${sessions.length > 1 ? 's' : ''}`}
        action={<Link href="/sessions/new" className="btn-primary inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold" data-testid="link-new-session-list"><Plus size={17} /> Nouvelle session</Link>}
      />
      {sessions.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="surface rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-700">Sessions documentées</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{sessions.length}</p>
          </div>
          <div className="surface rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-700">Clients suivis</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{Object.keys(byClient).length}</p>
          </div>
          <div className="surface rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-700">Top suivi</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{topClients[0] ? `${topClients[0][0]} · ${topClients[0][1]}` : '—'}</p>
          </div>
        </div>
      )}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par client…"
          className="pl-9"
          data-testid="input-search-sessions"
        />
      </div>
      {q.isLoading ? <Loading /> : sessions.length === 0 ? (
        <Empty icon={History} title="Aucune session" body={search ? `Aucun résultat pour « ${search} ».` : 'Documentez votre première session pour la retrouver ici.'} action={<Link href="/sessions/new" className="btn-primary inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold"><Plus size={16} /> Nouvelle session</Link>} />
      ) : (
        <div className="surface overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1.2fr_1fr_.7fr_.7fr_.3fr] border-b border-border/70 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground md:grid">
            <span>Client</span><span>Date & heure</span><span>Durée</span><span>Évolution</span><span />
          </div>
          <div className="divide-y divide-border/60">
            {sessions.map((s) => {
              const delta = (Number(s.afterFeeling) || 0) - (Number(s.beforeFeeling) || 0);
              return (
                <div key={s.id} className="group grid items-center gap-3 px-5 py-4 transition hover:bg-sky-50/40 md:grid-cols-[1.2fr_1fr_.7fr_.7fr_.3fr]" data-testid={`row-session-${s.id}`}>
                  <Link href={`/sessions/${s.id}`} className="flex min-w-0 items-center gap-3">
                    <Avatar name={s.clientName} small />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{s.clientName}</span>
                      {s.localOnly || s.id < 0 ? null : null}
                    </span>
                  </Link>
                  <Link href={`/sessions/${s.id}`} className="text-sm text-muted-foreground">{dateLabel(s.occurredAt, true)}</Link>
                  <Link href={`/sessions/${s.id}`} className="text-sm">{s.durationMinutes} min</Link>
                  <Link href={`/sessions/${s.id}`} className="text-sm font-semibold text-emerald-700">
                    {s.afterFeeling}/10{delta !== 0 ? ` ${delta > 0 ? '+' : ''}${delta}` : ''}
                  </Link>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, s.id)}
                      disabled={deletingId === s.id}
                      className="rounded-lg p-2 text-muted-foreground opacity-70 transition hover:bg-[#f8e1db] hover:text-destructive group-hover:opacity-100"
                      title="Supprimer la session"
                      data-testid={`button-delete-session-${s.id}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionDetail() {
  const id = Number(useParams<{ id: string }>().id);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');
  const q = useGetSession(id, { query: { queryKey: getGetSessionQueryKey(id) } });
  const update = useUpdateSession();
  const s: any = q.data;

  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!s) return;
    const f = new FormData(e.currentTarget);
    update.mutate({
      id: s.id,
      data: {
        clientId: s.clientId,
        occurredAt: new Date(String(f.get('occurredAt'))).toISOString(),
        durationMinutes: Number(f.get('duration')) || s.durationMinutes,
        beforeFeeling: Number(f.get('before')) || s.beforeFeeling,
        afterFeeling: Number(f.get('after')) || s.afterFeeling,
        mobilityBefore: Number(f.get('mobilityBefore')) || s.mobilityBefore,
        mobilityAfter: Number(f.get('mobilityAfter')) || s.mobilityAfter,
        zones: s.zones || [],
        techniques: s.techniques || [],
        observations: String(f.get('observations') ?? s.observations),
        practitionerRecommendations: String(f.get('recommendations') ?? s.practitionerRecommendations),
      },
    } as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        setEditing(false);
        setToast('Session mise à jour');
      },
      onError: () => setToast('Impossible de modifier la session'),
    });
  }

  if (q.isLoading) return <Loading rows={5} />;
  if (!s) return <ErrorState retry={() => q.refetch()} />;

  return (
    <div className="animate-enter">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <Link href="/sessions" className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="link-back-sessions"><ArrowLeft size={14} /> Toutes les sessions</Link>
      <Link href={`/clients/${s.clientId}`} className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="link-back-session"><ArrowLeft size={14} /> Dossier de {s.clientName}</Link>
      <SectionHeading
        eyebrow={`Session · ${dateLabel(s.occurredAt)}`}
        title={s.clientName}
        detail={`${s.durationMinutes} minutes de pratique documentée`}
        action={<GhostButton onClick={() => setEditing(true)} data-testid="button-edit-session"><Pencil size={15} /> Modifier</GhostButton>}
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <div className="surface rounded-2xl p-5">
            <p className="mb-5 text-sm font-semibold">Évolution ressentie</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[['Sensation', s.beforeFeeling, s.afterFeeling], ['Mobilité', s.mobilityBefore, s.mobilityAfter]].map(([label, before, after]) => (
                <div key={String(label)} className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="mt-3 flex items-end gap-3">
                    <strong className="text-3xl tracking-[-.06em]">{after ?? '—'}</strong>
                    <span className="mb-1 text-xs text-muted-foreground">/10 après</span>
                    <span className="mb-1 ml-auto font-mono text-xs text-primary">avant {before ?? '—'}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Number(after || 0) * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="mb-4 text-sm font-semibold">Observations</p>
            <p className="text-sm leading-7 text-muted-foreground">{s.observations || '—'}</p>
            <div className="my-5 border-t border-border/70" />
            <p className="mb-4 text-sm font-semibold">Recommandations praticien</p>
            <p className="text-sm leading-7 text-muted-foreground">{s.practitionerRecommendations || '—'}</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="surface rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Zones & techniques</p>
              <span className="font-mono text-[10px] text-muted-foreground">{s.zones?.length || 0} ZONES</span>
            </div>
            <div className="space-y-3">
              {(s.zones || []).map((z: any) => (
                <div className="rounded-xl border border-border/70 p-3" key={z.zoneId}>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">{z.label}</strong>
                    <Pill tone="green">{z.technique}</Pill>
                  </div>
                  <div className="mt-2 flex gap-4 font-mono text-[10px] text-muted-foreground">
                    <span>Intensité {z.intensity}/10</span>
                    <span>{z.durationMinutes} min</span>
                  </div>
                  {z.note && <p className="mt-2 text-xs leading-5 text-muted-foreground">{z.note}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[#f4e9d8] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#a56a37]">Techniques utilisées</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(s.techniques || []).map((t: string) => (
                <span key={t} className="rounded-full bg-[#fbf3e6] px-3 py-1.5 text-xs font-medium text-[#85572f]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {editing && (
        <Modal title="Modifier la session" onClose={() => setEditing(false)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <Field label="Date & heure">
              <TextInput name="occurredAt" type="datetime-local" required defaultValue={toDatetimeLocal(s.occurredAt)} data-testid="input-edit-session-datetime" />
            </Field>
            <Field label="Durée (minutes)">
              <TextInput name="duration" type="number" min="1" defaultValue={s.durationMinutes} data-testid="input-edit-session-duration" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sensation avant /10"><TextInput name="before" type="number" min="0" max="10" defaultValue={s.beforeFeeling} /></Field>
              <Field label="Sensation après /10"><TextInput name="after" type="number" min="0" max="10" defaultValue={s.afterFeeling} /></Field>
              <Field label="Mobilité avant /10"><TextInput name="mobilityBefore" type="number" min="0" max="10" defaultValue={s.mobilityBefore ?? 5} /></Field>
              <Field label="Mobilité après /10"><TextInput name="mobilityAfter" type="number" min="0" max="10" defaultValue={s.mobilityAfter ?? 7} /></Field>
            </div>
            <Field label="Observations"><TextArea name="observations" defaultValue={s.observations} data-testid="textarea-edit-session-observations" /></Field>
            <Field label="Recommandations"><TextArea name="recommendations" defaultValue={s.practitionerRecommendations} data-testid="textarea-edit-session-recommendations" /></Field>
            <div className="flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setEditing(false)}>Annuler</GhostButton>
              <PrimaryButton type="submit" disabled={update.isPending}>{update.isPending ? 'Enregistrement…' : 'Enregistrer'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Formation() {
  return <FormationHub />;
}
function FormationProtocolRoute() {
  const { number } = useParams<{ number: string }>();
  return <FormationProtocolPage protocolNumber={Number(number)} />;
}

function Exercises() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState('');
  const q = useListExercises({ search: search || undefined });
  const create = useCreateExercise();
  const remove = useDeleteExercise();
  const exercises: any[] = listOr(q.data, []);
  const categories = [
    { key: '', label: 'Tous' },
    { key: 'recovery', label: 'Récupération' },
    { key: 'breathing', label: 'Respiration' },
    { key: 'relaxation', label: 'Relaxation' },
    { key: 'mobility', label: 'Mobilité' },
    { key: 'stretching', label: 'Étirements' },
  ];
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create.mutate({ data: { name: String(f.get('name')), category: String(f.get('category')), objective: String(f.get('objective')), instructions: String(f.get('instructions')), durationSeconds: Number(f.get('duration')) || 60, repetitions: String(f.get('repetitions')), frequency: String(f.get('frequency')), precautions: String(f.get('precautions')) } } as any, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey({}) }); setShow(false); setToast('Exercice ajouté à la bibliothèque'); } });
  }
  const filtered = exercises.filter((ex) => {
    const matchCat = !category || ex.category === category;
    const term = search.toLowerCase();
    const matchSearch = !term || ex.name.toLowerCase().includes(term) || ex.objective?.toLowerCase().includes(term);
    return matchCat && matchSearch;
  });
  return (
    <div className="animate-enter">
      <SectionHeading eyebrow="Votre boîte à outils" title="Exercices & protocoles" detail={`${exercises.length} protocoles ventouses et outils d’évaluation issus de vos guides.`} action={<PrimaryButton onClick={() => setShow(true)} data-testid="button-add-exercise"><Plus size={17} /> Créer un exercice</PrimaryButton>} />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un protocole…" className="pl-9" data-testid="input-search-exercises" /></div>
        <div className="flex gap-1 overflow-x-auto">{categories.map((cat) => <button key={cat.key} onClick={() => setCategory(cat.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${category === cat.key ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-category-${cat.key || 'all'}`}>{cat.label}</button>)}</div>
      </div>
      {q.isLoading ? <Loading /> : filtered.length === 0 ? <Empty icon={Dumbbell} title="Aucun exercice" body="Rechargez la page pour charger les protocoles de référence, ou créez le vôtre." action={<PrimaryButton onClick={() => setShow(true)} data-testid="button-add-first-exercise"><Plus size={16} /> Créer un exercice</PrimaryButton>} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((ex) => (
          <div className="surface flex min-h-[225px] flex-col rounded-2xl p-5" key={ex.id} data-testid={`card-exercise-${ex.id}`}>
            <div className="flex items-start justify-between">
              <span className="grid size-9 place-items-center rounded-xl bg-[#f4e9d8] text-[#a56a37]"><Dumbbell size={17} /></span>
              <div className="flex items-center gap-1">{ex.isCustom && <Pill tone="orange">Personnel</Pill>}<button onClick={() => { if (window.confirm('Supprimer cet exercice ?')) remove.mutate({ id: ex.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey({}) }); setToast('Exercice supprimé'); } }); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-[#f8e1db] hover:text-destructive" data-testid={`button-delete-exercise-${ex.id}`}><Trash2 size={14} /></button></div>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{EXERCISE_CATEGORY_LABELS[ex.category] || ex.category}</p>
            <h3 className="mt-1 font-semibold">{ex.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{ex.objective}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-border/70 pt-3 font-mono text-[10px] text-muted-foreground"><span>{Math.round(ex.durationSeconds / 60) || 1} min</span><span>·</span><span>{ex.frequency}</span></div>
          </div>
        ))}</div>
      )}
      {show && <Modal title="Créer un exercice" onClose={() => setShow(false)}><form onSubmit={submit} className="space-y-4"><Field label="Nom"><TextInput name="name" required placeholder="Mobilité de la cheville" data-testid="input-exercise-name" /></Field><Field label="Catégorie"><select name="category" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" data-testid="select-exercise-category">{categories.slice(1).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Field><Field label="Objectif"><TextInput name="objective" required placeholder="Explorer l’amplitude sans charge" data-testid="input-exercise-objective" /></Field><Field label="Instructions"><TextArea name="instructions" required placeholder="Décrivez le protocole…" data-testid="textarea-exercise-instructions" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Durée (secondes)"><TextInput name="duration" type="number" defaultValue="60" data-testid="input-exercise-duration" /></Field><Field label="Répétitions"><TextInput name="repetitions" defaultValue="6 par côté" data-testid="input-exercise-repetitions" /></Field></div><Field label="Fréquence"><TextInput name="frequency" defaultValue="3 fois / semaine" data-testid="input-exercise-frequency" /></Field><Field label="Précautions"><TextInput name="precautions" defaultValue="Rester confortable." data-testid="input-exercise-precautions" /></Field><div className="flex justify-end gap-2"><GhostButton type="button" onClick={() => setShow(false)} data-testid="button-cancel-exercise">Annuler</GhostButton><PrimaryButton type="submit" disabled={create.isPending} data-testid="button-save-exercise">Créer l’exercice</PrimaryButton></div></form></Modal>}
    </div>
  );
}

function Programs() {
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState('');
  const [template, setTemplate] = useState<(typeof PROGRAM_TEMPLATES)[number] | null>(null);
  const q = useListPrograms();
  const create = useCreateProgram();
  const programs: any[] = listOr(q.data, []);
  const clientsQ = useListClients({ status: "active" });
  const programClients = listOr(clientsQ.data, []);
  const exercisesQ = useListExercises({});
  const allExercises: any[] = listOr(exercisesQ.data, []);

  function openTemplate(t: (typeof PROGRAM_TEMPLATES)[number]) {
    setTemplate(t);
    setShow(true);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const exerciseItems = template
      ? template.exerciseNames.map((name) => {
          const ex = allExercises.find((x) => x.name === name);
          return { exerciseId: ex?.id ?? 0, exerciseName: name, dosage: ex?.repetitions || ex?.frequency || "Selon protocole" };
        }).filter((x) => x.exerciseId)
      : [];
    const startsOn = String(f.get('startsOn'));
    const durationDays = Number(f.get('durationDays')) || 21;
    const startDate = new Date(startsOn);
    const endsOn = String(f.get('endsOn')) || new Date(startDate.getTime() + durationDays * 86400000).toISOString().slice(0, 10);
    create.mutate({ data: { clientId: Number(f.get('clientId')), name: String(f.get('name')), durationDays, objective: String(f.get('objective')), message: String(f.get('message')), startsOn, endsOn, exercises: exerciseItems } } as any, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() }); setShow(false); setTemplate(null); setToast('Programme créé'); } });
  }

  return (
    <div className="animate-enter">
      <SectionHeading eyebrow="Accompagner entre deux séances" title="Programmes" detail={`${programs.length} programmes actifs · modèles issus de vos guides PDF`} action={<PrimaryButton onClick={() => { setTemplate(null); setShow(true); }} data-testid="button-create-program"><Plus size={17} /> Nouveau programme</PrimaryButton>} />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="mb-8">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[.14em] text-primary">Modèles recommandés</p>
        <div className="grid gap-4 md:grid-cols-2">{PROGRAM_TEMPLATES.map((t) => (
          <div className="surface rounded-2xl p-5" key={t.name}>
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{t.durationDays} jours</p>
            <h3 className="mt-1 text-lg font-semibold">{t.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.objective}</p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{t.exerciseNames.map((n) => <li key={n}>· {n}</li>)}</ul>
            <button type="button" onClick={() => openTemplate(t)} className="mt-4 text-xs font-semibold text-primary hover:underline" data-testid={`button-use-template-${t.name.slice(0, 12)}`}>Utiliser ce modèle</button>
          </div>
        ))}</div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {programs.length === 0 ? <Empty icon={ClipboardList} title="Aucun programme client" body="Choisissez un modèle ci-dessus ou créez un programme personnalisé." action={<PrimaryButton onClick={() => setShow(true)} data-testid="button-add-first-program"><Plus size={16} /> Nouveau programme</PrimaryButton>} /> : programs.map((p) => (
          <div className="surface rounded-2xl p-5" key={p.id} data-testid={`card-program-${p.id}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">{p.clientName}</p><h3 className="mt-1 text-lg font-semibold">{p.name}</h3></div><Pill tone={p.status === 'active' ? 'green' : 'orange'}>{p.status === 'active' ? 'Actif' : 'Envoyé'}</Pill></div>
            <p className="mt-3 text-sm text-muted-foreground">{p.objective}</p>
            <div className="mt-5"><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Progression</span><strong>{p.completionRate}%</strong></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.completionRate}%` }} /></div></div>
            <div className="mt-5 space-y-2 border-t border-border/70 pt-4">{p.exercises?.map((e: any, i: number) => <div className="flex items-center gap-2 text-xs" key={i}><CheckCircle2 size={14} className="text-primary" /><span className="flex-1">{e.exerciseName}</span><span className="text-muted-foreground">{e.dosage}</span></div>)}</div>
            <div className="mt-5 flex items-center justify-between text-[10px] text-muted-foreground"><span>{dateLabel(p.startsOn)} → {dateLabel(p.endsOn)}</span></div>
          </div>
        ))}
      </div>
      {show && (
        <Modal title={template ? `Créer : ${template.name}` : 'Nouveau programme'} onClose={() => { setShow(false); setTemplate(null); }}>
          <form onSubmit={submit} className="space-y-4" key={template?.name || 'blank'}>
            <Field label="Client"><select name="clientId" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" data-testid="select-program-client">{programClients.map((c: any) => <option value={c.id} key={c.id}>{c.firstName} {c.lastName}</option>)}</select></Field>
            <Field label="Nom du programme"><TextInput name="name" required defaultValue={template?.name} placeholder="Retrouver de l’espace" data-testid="input-program-name" /></Field>
            <Field label="Objectif"><TextInput name="objective" required defaultValue={template?.objective} placeholder="Une intention concrète pour la suite" data-testid="input-program-objective" /></Field>
            <Field label="Message au client"><TextArea name="message" defaultValue={template?.message} placeholder="Quelques mots pour accompagner l’envoi…" data-testid="textarea-program-message" /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Durée (jours)"><TextInput name="durationDays" type="number" defaultValue={template?.durationDays ?? 21} data-testid="input-program-duration" /></Field><Field label="Début"><TextInput name="startsOn" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} data-testid="input-program-start" /></Field></div>
            <Field label="Fin"><TextInput name="endsOn" type="date" data-testid="input-program-end" /></Field>
            <div className="flex justify-end gap-2"><GhostButton type="button" onClick={() => { setShow(false); setTemplate(null); }} data-testid="button-cancel-program">Annuler</GhostButton><PrimaryButton type="submit" disabled={create.isPending} data-testid="button-save-program">Créer le programme</PrimaryButton></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Billing() {
  const clientsQ = useListClients({ status: 'active' });
  const sessionsQ = useListSessions();
  const create = useCreateInvoice();
  const clients: any[] = listOr<any>(clientsQ.data, []);
  const sessions = mergeSessionLists(listOr(sessionsQ.data, []), listLocalSessions());

  return (
    <BillingHub
      clients={clients.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
      }))}
      sessions={sessions}
      SectionHeading={SectionHeading}
      PrimaryButton={PrimaryButton}
      GhostButton={GhostButton}
      Metric={Metric}
      Pill={Pill}
      Toast={Toast}
      onSyncApi={(payload) => {
        create.mutate({ data: payload } as any, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          },
        });
      }}
    />
  );
}

function Notifications() {
  const q = useListNotifications();
  const mark = useMarkNotificationRead();
  const clientsQ = useListClients({ status: 'active' });
  const notifications: any[] = listOr(q.data, []);
  const clients = mergeClientLists(listOr(clientsQ.data, []), listLocalClients());
  const localSessions = listLocalSessions();
  const unread = notifications.filter((n) => !n.read).length;
  const [popupOn, setPopupOn] = useState(() => isRdvPopupEnabled());

  function toggleRdvPopup() {
    const next = !popupOn;
    setRdvPopupEnabled(next);
    setPopupOn(next);
  }

  const followUps = localSessions.slice(0, 6).map((s) => ({
    id: `local-${s.id}`,
    title: `Suivi client · ${s.clientName}`,
    body: `Dernière séance le ${dateLabel(s.occurredAt, true)} — ressenti ${s.beforeFeeling}/10 → ${s.afterFeeling}/10.`,
    href: `/clients/${s.clientId}`,
    createdAt: s.occurredAt,
  }));

  return (
    <div className="animate-enter">
      <SectionHeading
        eyebrow="Votre fil d’attention"
        title="Notifications"
        detail={`${clients.length} client${clients.length > 1 ? 's' : ''} · relances utiles pour votre pratique`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleRdvPopup}
              className={`inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                popupOn
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:text-rose-700'
                  : 'border-primary/40 bg-primary text-primary-foreground'
              }`}
              data-testid="button-toggle-rdv-popup"
            >
              <Clock size={15} />
              {popupOn ? 'Enlever les notifications' : 'Activer les notifications'}
            </button>
            {unread > 0 ? (
              <GhostButton
                onClick={() => notifications.filter((n) => !n.read).forEach((n) => mark.mutate({ id: n.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) }))}
                data-testid="button-mark-all-read"
              >
                <Check size={15} /> Tout marquer comme lu
              </GhostButton>
            ) : null}
          </div>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="surface rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-700">Clients suivis</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{clients.length}</p>
        </div>
        <div className="surface rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-700">Relances suivi</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{followUps.length}</p>
        </div>
        <div className="surface rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-700">Alertes</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{unread}</p>
        </div>
      </div>

      {followUps.length > 0 && (
        <div className="mb-6 surface overflow-hidden rounded-2xl">
          <div className="border-b border-border/70 px-5 py-3">
            <p className="text-sm font-semibold text-slate-900">Suivi client</p>
            <p className="text-xs text-slate-600">Basé sur vos dernières sessions</p>
          </div>
          <div className="divide-y divide-border/60">
            {followUps.map((f) => (
              <Link key={f.id} href={f.href} className="flex gap-4 p-5 transition hover:bg-sky-50/60">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700"><HeartPulse size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-slate-900">{f.title}</strong>
                    <span className="font-mono text-[10px] text-slate-500">{dateLabel(f.createdAt)}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-700">{f.body}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="surface overflow-hidden rounded-2xl">
        {notifications.length === 0 ? (
          <Empty icon={Bell} title="Pas d’alerte système" body="Le suivi client ci-dessus suffit pour démarrer." />
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && mark.mutate({ id: n.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) })}
              className={`flex w-full gap-4 border-b border-border/60 p-5 text-left transition last:border-0 hover:bg-muted/30 ${!n.read ? 'bg-sky-50/50' : ''}`}
              data-testid={`notification-${n.id}`}
            >
              <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${n.type === 'invoice' ? 'bg-[#f5e0d8] text-[#a65343]' : n.type === 'program' ? 'bg-[#f4e9d8] text-[#a56a37]' : 'bg-secondary text-primary'}`}>
                {n.type === 'invoice' ? <CircleDollarSign size={16} /> : n.type === 'program' ? <ClipboardList size={16} /> : <Bell size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-slate-900">{n.title}</strong>
                  <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">{dateLabel(n.createdAt)}</span>
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-700">{n.body}</span>
              </span>
              {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-sky-500" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { session, login, logout } = useSession();
  const [tab, setTab] = useState<'profil' | 'preferences' | 'securite'>('profil');
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [displayName, setDisplayName] = useState(() => (session ? practitionerName(session.email) : ''));
  const [practice, setPractice] = useState(() => session?.practiceName || '');
  const [email, setEmail] = useState(() => session?.email || '');
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campus-prefs') || '{}') as {
        denseAgenda?: boolean;
        emailReminders?: boolean;
        followUpDays?: number;
      };
    } catch {
      return {};
    }
  });
  const [pinSetup, setPinSetup] = useState<string | null>(null);
  const [pinMsg, setPinMsg] = useState('');
  const initials = session ? practitionerInitials(session.email) : 'PR';

  function saveProfile() {
    login({ email: email || session?.email || 'praticien@campus.fr', practiceName: practice || 'Mon cabinet' });
    saveDisplayFirstName(displayName || practitionerName(email || session?.email || ''));
    setSaved(true);
    setToast('Profil enregistré');
    setTimeout(() => setSaved(false), 2000);
  }

  function savePrefs() {
    localStorage.setItem('campus-prefs', JSON.stringify(prefs));
    setSaved(true);
    setToast('Préférences enregistrées');
    setTimeout(() => setSaved(false), 2000);
  }

  function onPinDigit(code: string) {
    if (!pinSetup) {
      setPinSetup(code);
      setPinMsg('Confirmez le même code PIN');
      return;
    }
    if (code !== pinSetup) {
      setPinSetup(null);
      setPinMsg('Les codes ne correspondent pas. Réessayez.');
      return;
    }
    try {
      setAppPin(code);
      setPinSetup(null);
      setPinMsg('Code PIN enregistré — protège aussi la facturation.');
      setToast('Sécurité mise à jour');
    } catch (e: any) {
      setPinMsg(e?.message || 'Code invalide');
    }
  }

  return (
    <div className="animate-enter">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <SectionHeading
        eyebrow="Votre espace"
        title="Paramètres"
        detail="Profil, préférences et sécurité PIN."
        action={saved ? <span className="flex items-center gap-1.5 text-xs font-medium text-primary"><CheckCircle2 size={15} /> Enregistré</span> : undefined}
      />
      <div className="grid gap-6 lg:grid-cols-[.55fr_1.45fr]">
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-sky-500 text-lg font-semibold text-white">{initials}</span>
            <div>
              <p className="font-semibold">{displayName || 'Praticien'}</p>
              <p className="text-xs text-muted-foreground">{practice || 'Mon cabinet'}</p>
            </div>
          </div>
          <div className="mt-6 glass-tab-bar flex flex-col gap-1 rounded-2xl p-1.5">
            {([
              { id: 'profil' as const, label: 'Profil', icon: Users },
              { id: 'preferences' as const, label: 'Préférences', icon: SlidersHorizontal },
              { id: 'securite' as const, label: 'Sécurité', icon: Shield },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${tab === id ? 'glass-tab-active' : 'text-slate-600 hover:bg-white/60'}`}
                data-testid={`button-settings-${id}`}
              >
                <span className="flex items-center gap-2"><Icon size={15} /> {label}</span>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            data-testid="button-logout-settings"
          >
            Se déconnecter
          </button>
        </div>
        <div className="surface rounded-2xl p-6">
          {tab === 'profil' && (
            <>
              <p className="mb-5 text-sm font-semibold">Informations professionnelles</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nom affiché"><TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="input-settings-first-name" /></Field>
                <Field label="Adresse email"><TextInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" data-testid="input-settings-email" /></Field>
                <Field label="Nom du cabinet"><TextInput value={practice} onChange={(e) => setPractice(e.target.value)} data-testid="input-settings-practice" /></Field>
              </div>
              <div className="mt-6 flex justify-end">
                <PrimaryButton type="button" onClick={saveProfile} data-testid="button-save-settings"><Check size={15} /> Enregistrer le profil</PrimaryButton>
              </div>
            </>
          )}
          {tab === 'preferences' && (
            <>
              <p className="mb-5 text-sm font-semibold">Préférences de pratique</p>
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4 text-sm">
                  <span>Agenda compact</span>
                  <input type="checkbox" checked={!!prefs.denseAgenda} onChange={(e) => setPrefs((p) => ({ ...p, denseAgenda: e.target.checked }))} data-testid="input-pref-dense" />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4 text-sm">
                  <span>Rappels e-mail (local)</span>
                  <input type="checkbox" checked={!!prefs.emailReminders} onChange={(e) => setPrefs((p) => ({ ...p, emailReminders: e.target.checked }))} data-testid="input-pref-email" />
                </label>
                <Field label="Délai de relance suivi (jours)">
                  <TextInput
                    type="number"
                    min={1}
                    max={90}
                    value={prefs.followUpDays ?? 14}
                    onChange={(e) => setPrefs((p) => ({ ...p, followUpDays: Number(e.target.value) || 14 }))}
                    data-testid="input-pref-followup"
                  />
                </Field>
              </div>
              <div className="mt-6 flex justify-end">
                <PrimaryButton type="button" onClick={savePrefs} data-testid="button-save-preferences"><Check size={15} /> Enregistrer les préférences</PrimaryButton>
              </div>
            </>
          )}
          {tab === 'securite' && (
            <>
              <p className="mb-2 text-sm font-semibold">Code PIN à 5 chiffres</p>
              <p className="mb-5 text-xs text-muted-foreground">Protège l’accès à la facturation. {hasAppPin() ? 'Un PIN est déjà configuré — saisissez-en un nouveau pour le remplacer.' : 'Aucun PIN configuré pour le moment.'}</p>
              {pinMsg && <p className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">{pinMsg}</p>}
              <div className="mx-auto max-w-xs">
                <PinPad
                  title={pinSetup ? 'Confirmer le PIN' : hasAppPin() ? 'Nouveau code PIN' : 'Créer un code PIN'}
                  subtitle="5 chiffres"
                  error={pinMsg.includes('correspondent') ? pinMsg : undefined}
                  onComplete={onPinDigit}
                />
              </div>
              {pinSetup && (
                <button type="button" className="mt-3 text-xs text-muted-foreground underline" onClick={() => { setPinSetup(null); setPinMsg(''); }}>
                  Annuler
                </button>
              )}
              {hasAppPin() && (
                <p className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><Lock size={14} /> PIN actif — vérifié localement sur cet appareil.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function ClientPortal() { const programsQ = useListPrograms(); const programs: any[] = listOr(programsQ.data, []); const program = programs[0]; return <div className="mx-auto min-h-[100dvh] max-w-3xl bg-background px-5 py-8 md:px-8"><div className="mb-14 flex items-center justify-between"><Logo /><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-client-portal-settings"><Settings size={17} /></button></div><div className="mb-8"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Votre espace CAMPUS</p><h1 className="mt-2 text-[34px] font-semibold tracking-[-.05em]">Bonjour</h1><p className="mt-2 text-sm text-muted-foreground">Votre pratique, entre deux rendez-vous.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-primary p-5 text-primary-foreground"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary-foreground/60">Prochain rendez-vous</p><p className="mt-3 text-lg font-semibold">Aucun rendez-vous planifié</p><p className="mt-1 text-sm text-primary-foreground/70">Votre praticien vous contactera</p><button className="mt-6 rounded-lg bg-primary-foreground/10 px-3 py-2 text-xs font-semibold hover:bg-primary-foreground/20" data-testid="button-client-reschedule">Gérer le rendez-vous</button></div><div className="surface rounded-2xl p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Cette semaine</p><p className="mt-3 text-lg font-semibold">Aucune activité</p><p className="mt-1 text-sm text-muted-foreground">Commencez votre programme pour suivre votre progression.</p><div className="mt-5 flex gap-1.5">{Array.from({ length: 7 }, () => 0).map((_, i) => <span key={i} className="h-1.5 flex-1 rounded-full bg-muted" />)}</div></div></div><div className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Votre programme</p><h2 className="mt-1 text-xl font-semibold">{program?.name || "Aucun programme actif"}</h2></div><span className="font-mono text-sm text-primary">{program?.completionRate ?? 0}%</span></div><div className="mb-5 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${program?.completionRate ?? 0}%` }} /></div><div className="space-y-3">{(program?.exercises || []).map((e: any, i: number) => <div className="surface flex items-center gap-3 rounded-xl p-4" key={i}><button className="grid size-7 shrink-0 place-items-center rounded-full border border-border hover:border-primary hover:bg-secondary" data-testid={`button-complete-exercise-${i}`}><Check size={14} className="text-primary" /></button><div className="flex-1"><p className="text-sm font-medium">{e.exerciseName}</p><p className="mt-1 text-xs text-muted-foreground">{e.dosage}</p></div><ArrowRight size={15} className="text-muted-foreground" /></div>)}</div></div><div className="mt-8 rounded-2xl bg-[#f4e9d8] p-5"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#a56a37]">Votre retour compte</p><p className="mt-2 text-sm leading-6 text-[#6c4c32]">Comment vous sentez-vous depuis la dernière séance ?</p><button className="mt-4 rounded-lg bg-[#a56a37] px-3 py-2 text-xs font-semibold text-[#fff8ed]" data-testid="button-client-feedback">Partager mon ressenti</button></div></div>; }
function Admin() { const clientsQ = useListClients({ status: 'all' }); const exercisesQ = useListExercises({}); return <div className="animate-enter"><SectionHeading eyebrow="CAMPUS interne" title="Administration" detail="Santé du contenu et activité de la plateforme." /><div className="grid gap-4 sm:grid-cols-3"><Metric icon={Users} label="Utilisateurs actifs" value={listOr(clientsQ.data, []).length} detail="Clients enregistrés" tone="teal" /><Metric icon={Library} label="Exercices publiés" value={listOr(exercisesQ.data, []).length} detail="Dans la bibliothèque" tone="sand" /><Metric icon={Activity} label="Sessions cette semaine" value="0" detail="Cette semaine" tone="lilac" /></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="surface rounded-2xl p-5"><div className="mb-5 flex items-center justify-between"><p className="text-sm font-semibold">Contenu à relire</p><Pill tone="neutral">0 élément</Pill></div>{[].map((x, i) => <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0" key={x}><span className="grid size-7 place-items-center rounded-lg bg-muted font-mono text-xs">{i + 1}</span><span className="flex-1 text-sm">{x}</span><button className="text-xs font-semibold text-primary" data-testid={`button-review-content-${i}`}>Relire</button></div>)}</div><div className="rounded-2xl bg-sidebar p-5 text-sidebar-foreground"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/50">Note produit</p><p className="mt-3 font-display text-[28px] leading-tight">L’outil doit rester au service du geste.</p><p className="mt-4 text-sm leading-6 text-sidebar-foreground/65">CAMPUS documente les décisions des praticiens. Il ne diagnostique pas, ne prescrit pas.</p></div></div></div>; }
function CampusPhonePreview() {
  return (
    <div className="relative mx-auto w-[260px] shrink-0 select-none xl:w-[280px]" aria-hidden="true">
      <div className="pointer-events-none absolute -inset-10 rounded-[4rem] bg-sky-400/25 blur-3xl" />
      <div
        className="relative overflow-hidden rounded-[2.4rem] bg-[#11141a] p-[6px]"
        style={{
          aspectRatio: '9 / 18.8',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 40px 80px -24px rgba(0,0,0,0.85)',
        }}
      >
        <div className="absolute left-1/2 top-2.5 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex h-full flex-col overflow-hidden rounded-[1.95rem] bg-[#f3f6fa]">
          <div className="flex items-center justify-between px-4 pb-1 pt-8">
            <span className="text-[11px] font-bold text-slate-900">9:41</span>
            <span className="h-2 w-4 rounded-sm border border-slate-700/60" />
          </div>

          <div className="mx-3 rounded-2xl border border-white bg-white px-3.5 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-slate-400">Jeudi 25 sept.</p>
                <p className="text-[15px] font-extrabold tracking-tight text-slate-900">Bonjour Ada</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 via-white to-rose-500 px-2 py-1 text-[8px] font-extrabold uppercase text-slate-900">
                <FrFlag /> Top 1
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 px-3">
            <div className="rounded-2xl border border-white bg-white p-3 shadow-sm">
              <span className="mb-2 grid size-7 place-items-center rounded-xl bg-sky-50 text-sky-700">
                <CalendarDays size={14} />
              </span>
              <p className="text-[9px] text-slate-400">RDV du jour</p>
              <p className="text-[22px] font-extrabold tracking-tight text-slate-900">3</p>
            </div>
            <div className="rounded-2xl border border-white bg-white p-3 shadow-sm">
              <span className="mb-2 grid size-7 place-items-center rounded-xl bg-[#f4e9d8] text-[#a56a37]">
                <Users size={14} />
              </span>
              <p className="text-[9px] text-slate-400">Clients</p>
              <p className="text-[22px] font-extrabold tracking-tight text-slate-900">12</p>
            </div>
          </div>

          <div className="mx-3 mt-3 flex-1 overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
              <p className="text-[12px] font-bold text-slate-900">Clients</p>
              <span className="text-[10px] font-bold text-sky-600">+ Ajouter</span>
            </div>
            {[
              { init: 'CD', name: 'Claire Dupont', sub: '5 sessions', color: 'bg-sky-100 text-sky-800' },
              { init: 'LM', name: 'Louise Martin', sub: '4 sessions', color: 'bg-[#f4e9d8] text-[#a56a37]' },
            ].map((c, i) => (
              <div key={c.name} className={`flex items-center gap-2.5 px-3.5 py-3 ${i === 0 ? 'border-b border-slate-50' : ''}`}>
                <span className={`grid size-8 place-items-center rounded-full text-[10px] font-bold ${c.color}`}>{c.init}</span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-slate-900">{c.name}</span>
                  <span className="block text-[10px] text-slate-400">{c.sub}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="m-3 mt-auto rounded-2xl bg-sky-600 px-3.5 py-3.5 text-white">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-sky-100">Nouvelle session</p>
            <p className="mt-1 text-[14px] font-extrabold tracking-tight">Anxiété et stress</p>
            <div className="mt-2.5 flex justify-end">
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-sky-700">Ouvrir →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function AccessPage() {
  const [, setLocation] = useLocation();
  const { session, login } = useSession();
  if (session) return <Redirect to="/dashboard" />;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login({
      email: String(form.get('email')),
      practiceName: String(form.get('practice')),
    });
    setLocation('/dashboard');
  }

  return (
    <div className="app-canvas grid min-h-[100dvh] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="campus-sidebar relative hidden overflow-hidden lg:flex lg:flex-col">
        <div className="relative z-10 flex flex-1 flex-col p-8 xl:p-10">
          <Logo light />

          <div className="mt-10 flex flex-1 items-center gap-6 xl:gap-10">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-gradient-to-r from-blue-700 via-white to-rose-600 px-3.5 py-1.5 shadow-lg shadow-black/20">
                <FrFlag className="inline-flex shrink-0 items-center text-base" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900">Top 1 France</span>
              </div>
              <h2 className="mt-6 max-w-[18ch] font-display text-[2.15rem] leading-[1.08] tracking-[-0.03em] text-white xl:text-[2.65rem]">
                L’appli n°1 des praticiens en thérapie manuelle &amp; ventouses.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                Suivi client, protocoles et cartographie corporelle — dans la poche, comme sur le bureau.
              </p>
            </div>
            <CampusPhonePreview />
          </div>

          <p className="relative z-10 mt-8 font-mono text-[10px] text-sidebar-foreground/40">Espace praticien</p>
        </div>

        <div className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full orb-3d opacity-40" />
        <div className="pointer-events-none absolute -right-16 top-24 size-64 rounded-full bg-sky-500/15 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="surface surface-3d w-full max-w-[390px] rounded-2xl p-8">
          <div className="mb-6 lg:hidden">
            <Logo />
            <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 w-fit">
              <FrFlag className="inline-flex shrink-0 items-center" />
              <span className="text-xs font-semibold text-foreground">Top 1 France</span>
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-.05em]">Entrer dans CAMPUS</h1>
          <p className="mt-2 text-sm text-muted-foreground">E-mail, mot de passe et nom du cabinet. C&apos;est tout.</p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Field label="Adresse e-mail">
              <TextInput name="email" type="email" required placeholder="vous@cabinet.fr" data-testid="input-auth-email" />
            </Field>
            <Field label="Mot de passe">
              <TextInput name="password" type="password" required placeholder="••••••••" data-testid="input-auth-password" />
            </Field>
            <Field label="Nom du cabinet">
              <TextInput name="practice" required placeholder="Studio Sillage" data-testid="input-auth-practice" />
            </Field>
            <PrimaryButton type="submit" className="mt-2 w-full" data-testid="button-auth-submit">
              Entrer dans CAMPUS <ArrowRight size={16} />
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
}
function HomeRedirect() {
  const { session } = useSession();
  if (session) return <Redirect to="/dashboard" />;
  return <AccessPage />;
}
function Protected({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (!session) return <Redirect to="/" />;
  return children;
}
function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/sign-in"><Redirect to="/" /></Route>
    <Route path="/sign-up"><Redirect to="/" /></Route>
    <Route path="/"><HomeRedirect /></Route>
    <Route path="/client"><ClientPortal /></Route>
    <Route path="/dashboard"><Protected><Shell><Dashboard /></Shell></Protected></Route>
    <Route path="/agenda"><Protected><Shell><Agenda /></Shell></Protected></Route>
    <Route path="/clients"><Protected><Shell><Clients /></Shell></Protected></Route>
    <Route path="/clients/:id"><Protected><Shell><ClientDetail /></Shell></Protected></Route>
    <Route path="/sessions/new"><Protected><Shell><NewSession /></Shell></Protected></Route>
    <Route path="/aide"><Protected><Shell><AideDiagnostic /></Shell></Protected></Route>
    <Route path="/sessions"><Protected><Shell><AllSessions /></Shell></Protected></Route>
    <Route path="/sessions/:id"><Protected><Shell><SessionDetail /></Shell></Protected></Route>
    <Route path="/anatomie"><Redirect to="/formation" /></Route>
    <Route path="/formation"><Protected><Shell><Formation /></Shell></Protected></Route>
    <Route path="/formation/protocole/:number"><Protected><Shell><FormationProtocolRoute /></Shell></Protected></Route>
    <Route path="/exercices"><Protected><Shell><Exercises /></Shell></Protected></Route>
    <Route path="/programmes"><Protected><Shell><Programs /></Shell></Protected></Route>
    <Route path="/facturation"><Protected><Shell><Billing /></Shell></Protected></Route>
    <Route path="/notifications"><Protected><Shell><Notifications /></Shell></Protected></Route>
    <Route path="/parametres"><Protected><Shell><SettingsPage /></Shell></Protected></Route>
    <Route path="/admin"><Protected><Shell><Admin /></Shell></Protected></Route>
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}
function App() {
  return (
    <WouterRouter base={basePath}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
          <CookieBanner />
        </QueryClientProvider>
      </SessionProvider>
    </WouterRouter>
  );
}
export default App;