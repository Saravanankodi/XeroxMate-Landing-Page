import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon,
  Mail,
  Send,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Shield,
  RefreshCw,
} from 'lucide-react';
import type { Lead } from '../types';
import {
  initAuth,
  getAccessToken,
  type User,
} from '../lib/firebase';
import {
  createGoogleSheet,
  appendLeadToGoogleSheet,
  getSavedSpreadsheetId,
  saveSpreadsheetId,
} from '../lib/sheetsService';

const LEADS_STORAGE_KEY = 'xeroxmate_leads_data';

export default function ConductCard() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Leads state (stored locally & synced to Google Sheet)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load saved leads and spreadsheet ID on mount
  useEffect(() => {
    try {
      const storedLeads = localStorage.getItem(LEADS_STORAGE_KEY);
      if (storedLeads) {
        setLeads(JSON.parse(storedLeads));
      }
    } catch (e) {
      console.error('Failed to load stored leads:', e);
    }

    const savedId = getSavedSpreadsheetId();
    if (savedId) {
      setSpreadsheetId(savedId);
    }

    // Auth state listener to acquire token if owner signed in
    const unsubscribe = initAuth(
      (_user: User, token: string) => {
        if (token) setAccessToken(token);
      },
      () => {
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save leads to localStorage
  const persistLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updatedLeads));
    } catch (e) {
      console.error('Failed to persist leads:', e);
    }
  };

  // Sync a lead to Google Sheet in the background
  const syncLeadToGoogleSheet = async (lead: Lead) => {
    try {
      const token = accessToken || (await getAccessToken());
      if (!token) return; // Will be synced once owner connects

      let activeSheetId = spreadsheetId || getSavedSpreadsheetId();
      if (!activeSheetId) {
        activeSheetId = await createGoogleSheet(token);
        setSpreadsheetId(activeSheetId);
        saveSpreadsheetId(activeSheetId);
      }

      await appendLeadToGoogleSheet(token, activeSheetId, lead);

      // Mark this lead as synced
      lead.syncedToSheets = true;
      const updated = leads.map((l) => (l.id === lead.id ? { ...l, syncedToSheets: true } : l));
      persistLeads(updated);
    } catch (err) {
      console.warn('Background Google Sheet sync notice:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setErrorMessage('Please provide both your name and email.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Check if already registered
    const existing = leads.find((l) => l.email.toLowerCase() === trimmedEmail.toLowerCase());
    if (existing) {
      setSubmittedLead(existing);
      return;
    }

    setSubmitting(true);

    const newLead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      email: trimmedEmail,
      timestamp: new Date().toISOString(),
      syncedToSheets: false,
    };

    const updatedLeads = [newLead, ...leads];
    persistLeads(updatedLeads);
    setSubmittedLead(newLead);
    setName('');
    setEmail('');

    // Attempt direct background sync to Google Sheet
    await syncLeadToGoogleSheet(newLead);

    setSubmitting(false);
  };

  return (
    <section
      id="conduct-card"
      className="py-14 sm:py-20 md:py-24 bg-[#07090e] relative overflow-hidden border-t border-slate-800/80"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[400px] bg-gradient-to-tr from-blue-600/10 via-indigo-600/15 to-purple-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP CONDUCT CARD</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-['Outfit'] tracking-tight">
            Register Your Interest
          </h2>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            Interested in the future of smart printing? Leave your name and email to receive early beta access, launch credits, and instant release notifications.
          </p>
        </div>

        {/* Clean, Focused Conduct Card */}
        <div className="max-w-2xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative p-5 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0c1220]/95 to-slate-950/95 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          >
            {/* Gradient Top Border Accent */}
            <div className="absolute inset-x-6 sm:inset-x-8 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-full" />

            <div className="space-y-1 pb-4 sm:pb-6 border-b border-slate-800 text-center">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
                Early Access Registration
              </h3>
              <p className="text-xs text-slate-400">
                Guaranteed priority queue token and exclusive launch benefits
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              {/* Input 1: Name */}
              <div>
                <label
                  htmlFor="conduct-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2"
                >
                  1. Name <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    id="conduct-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Input 2: Email */}
              <div>
                <label
                  htmlFor="conduct-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2"
                >
                  2. Email <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    id="conduct-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                id="conduct-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 border border-blue-400/40 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Interest</span>
                  </>
                )}
              </button>

              {/* Privacy text */}
              <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400 pt-1 text-center">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero spam. Direct priority invite sent prior to launch.</span>
              </div>
            </form>

            {/* Success Celebration Banner */}
            <AnimatePresence>
              {submittedLead && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm space-y-1.5 text-center"
                >
                  <div className="flex items-center justify-center gap-2 font-bold text-emerald-300">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    <span>Thank You, {submittedLead.name}!</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    Your interest has been recorded successfully for{' '}
                    <span className="font-semibold text-white">{submittedLead.email}</span>. You will receive exclusive early launch access.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
