import { useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Shield,
  RefreshCw,
} from 'lucide-react';
import {
  CONTACT_LIMITS,
  describeConfigError,
  submitContact,
  validateContact,
} from '../lib/contact';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ConductCard() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devNote, setDevNote] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const submitting = status === 'submitting';
  const succeeded = status === 'success';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Prevent accidental double submission (double-click / Enter spam).
    if (submittingRef.current) return;

    setErrorMessage(null);
    setDevNote(null);

    const validation = validateContact({ name, email, website });
    if (!validation.ok) {
      setStatus('error');
      setErrorMessage(validation.error);
      return;
    }

    submittingRef.current = true;
    setStatus('submitting');

    try {
      await submitContact({ name, email, website });
      // Reset form; success state never echoes submitted data.
      setName('');
      setEmail('');
      setWebsite('');
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save contact';
      const described = describeConfigError(message);
      setStatus('error');
      setErrorMessage(described.title);
      setDevNote(described.detail);
    } finally {
      submittingRef.current = false;
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage(null);
    setDevNote(null);
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
            <span>XEROXMATE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-['Outfit'] tracking-tight">
            Be the first to know when we launch.
          </h2>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            Join the launch list and we&apos;ll notify you when XEROXMATE goes live. Don&apos;t miss
            the launch on Wednesday, September 16, 2026 at 7:00 PM IST.
          </p>
        </div>

        {/* Launch-notification card */}
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
                Get launch updates
              </h3>
              <p className="text-xs text-slate-400">
                Leave your details and we&apos;ll let you know when the full application goes live.
              </p>
            </div>

            {succeeded ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                role="status"
                aria-live="polite"
                className="mt-5 sm:mt-6 p-6 sm:p-8 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-center space-y-2"
              >
                <div className="flex items-center justify-center gap-2 font-bold text-emerald-300 text-base sm:text-lg">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" aria-hidden="true" />
                  <span>&#10003; You&apos;re on the list!</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm">
                  We&apos;ll let you know when XEROXMATE launches.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
                {/* Input 1: Name */}
                <div>
                  <label
                    htmlFor="conduct-name"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2"
                  >
                    Name <span className="text-blue-400" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    </div>
                    <input
                      id="conduct-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={CONTACT_LIMITS.nameMax}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onInput={handleRetry}
                      placeholder="Enter your name"
                      disabled={submitting}
                      aria-required="true"
                      aria-invalid={status === 'error' ? true : undefined}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Input 2: Email */}
                <div>
                  <label
                    htmlFor="conduct-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2"
                  >
                    Email <span className="text-blue-400" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    </div>
                    <input
                      id="conduct-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={CONTACT_LIMITS.emailMax}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onInput={handleRetry}
                      placeholder="Enter your email"
                      disabled={submitting}
                      aria-required="true"
                      aria-invalid={status === 'error' ? true : undefined}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-400 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Honeypot: hidden from sighted + assistive-tech users */}
                <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="conduct-website">Website</label>
                  <input
                    id="conduct-website"
                    name="website"
                    type="text"
                    autoComplete="off"
                    tabIndex={-1}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {status === 'error' && errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      role="alert"
                      aria-live="assertive"
                      className="p-3 sm:p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
                      <span>
                        {errorMessage}
                        {devNote && (
                          <span className="block mt-1 text-[11px] text-rose-400/80">{devNote}</span>
                        )}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  id="conduct-submit-btn"
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 border border-blue-400/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>

                {/* Privacy text */}
                <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400 pt-1 text-center">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Zero spam. We&apos;ll only email you about the launch.</span>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
