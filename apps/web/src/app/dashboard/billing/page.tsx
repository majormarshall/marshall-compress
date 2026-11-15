'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Zap, Shield, CheckCircle2, ArrowRight,
  BarChart3, HardDrive, FileArchive, MessageSquare,
  Sparkles, Lock, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { billingApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Static plan definitions ─── */
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the essentials.',
    highlight: false,
    badge: null,
    features: [
      '5 GB cloud storage',
      '10 compression jobs / month',
      '5 AI messages / day',
      '10 notes',
      'Community support',
    ],
    cta: 'Current plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: 'per month',
    description: 'Everything you need for serious work.',
    highlight: true,
    badge: 'Most popular',
    features: [
      '100 GB cloud storage',
      'Unlimited compression jobs',
      'Unlimited AI messages',
      'Unlimited notes',
      'Meeting transcription (10 hrs / mo)',
      'Priority support',
      'API access',
    ],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'per seat',
    description: 'Built for teams and organizations.',
    highlight: false,
    badge: null,
    features: [
      'Unlimited storage',
      'SSO / SAML',
      'Custom AI models',
      'SLA guarantee',
      'Dedicated support',
      'On-premise option',
    ],
    cta: 'Contact sales',
    ctaDisabled: false,
  },
];

/* ─── Usage data (stubbed) ─── */
const usageItems = [
  { label: 'Cloud storage', icon: HardDrive, used: 1.2, total: 5, unit: 'GB', color: 'from-blue-500 to-cyan-500' },
  { label: 'Compression jobs', icon: FileArchive, used: 3, total: 10, unit: 'jobs', color: 'from-purple-500 to-pink-500' },
  { label: 'AI messages today', icon: MessageSquare, used: 3, total: 5, unit: 'msgs', color: 'from-emerald-500 to-teal-500' },
];

/* ─── Invoice history (stubbed) ─── */
const invoices: { date: string; amount: string; status: 'paid' | 'pending' }[] = [];

export default function BillingPage() {
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
      const plan = params.get('plan') || 'Pro';
      toast.success(`🎉 Welcome to MARSHALL ${plan.toUpperCase()}! Your subscription is active.`);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('status') === 'cancelled') {
      toast.info('Checkout was cancelled. No charges were made.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    setUpgradingPlan(planId);
    try {
      const res = await billingApi.createCheckoutSession(planId);
      if (res.url) {
        if (res.isSimulated) {
          toast.success(`Upgraded to ${planId.toUpperCase()} (Development Mode)`);
        } else {
          window.location.href = res.url;
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initiate checkout session');
    } finally {
      setUpgradingPlan(null);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl">
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Billing & Plans</h1>
            <p className="text-sm text-slate-400">Manage your subscription, upgrade tiers, and monitor usage.</p>
          </div>
        </div>

        {/* Stripe banner */}
        <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5">
          <Sparkles className="h-5 w-5 text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-300">Secure Billing by Stripe</p>
            <p className="text-xs text-blue-400/80">
              Upgrade instantly with encrypted payments. Subscriptions can be managed or cancelled at any time.
            </p>
          </div>
        </div>
      </div>

      {/* ── Current Usage ── */}
      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-400" />
          Current Usage
          <Badge variant="outline" className="text-[10px] ml-auto">Free tier</Badge>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {usageItems.map((item) => {
            const Icon = item.icon;
            const pct = Math.min(100, Math.round((item.used / item.total) * 100));
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-white/8 bg-slate-900/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{item.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {item.used} / {item.total} {item.unit}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <p className="text-xs text-slate-500">{pct}% used</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Plan Cards ── */}
      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Available Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl border p-6 flex flex-col gap-5 transition-all duration-200',
                plan.highlight
                  ? 'border-blue-500/50 bg-blue-600/10 shadow-xl shadow-blue-500/10'
                  : 'border-white/8 bg-slate-900/60'
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
                  {plan.badge}
                </span>
              )}

              {/* Plan name + price */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-mono mb-1">{plan.name}</p>
                <div className="flex items-end gap-1.5">
                  <span className={cn('text-3xl font-extrabold', plan.highlight ? 'text-blue-300' : 'text-slate-100')}>
                    {plan.price}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span className="text-xs text-slate-500 mb-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                type="button"
                disabled={plan.ctaDisabled || Boolean(upgradingPlan)}
                onClick={() => !plan.ctaDisabled && handleUpgrade(plan.id)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                  plan.ctaDisabled
                    ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                    : plan.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20'
                    : 'border border-white/10 text-slate-200 hover:bg-white/5'
                )}
              >
                {upgradingPlan === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting to Stripe...
                  </>
                ) : (
                  <>
                    {plan.cta}
                    {!plan.ctaDisabled && <ArrowRight className="h-3.5 w-3.5" />}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Invoice History ── */}
      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-400" />
          Invoice History
        </h2>

        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-900/30 px-6 py-10 flex flex-col items-center gap-2 text-center">
            <CreditCard className="h-8 w-8 text-slate-700 mb-1" />
            <p className="text-sm text-slate-400 font-medium">No invoices yet</p>
            <p className="text-xs text-slate-600">Invoices will appear here once you have an active subscription.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            {invoices.map((inv, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0">
                <span className="text-sm text-slate-300">{inv.date}</span>
                <span className="text-sm text-slate-200 font-medium">{inv.amount}</span>
                <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
