/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProofStrip from './components/ProofStrip';
import HowItWorks from './components/HowItWorks';
import InteractiveSimulator from './components/InteractiveSimulator';
import FeatureBento from './components/FeatureBento';
import ComparisonSection from './components/ComparisonSection';
import ConductCard from './components/ConductCard';
import Footer from './components/Footer';

export default function App() {
  const scrollToConduct = useCallback(() => {
    const el = document.getElementById('conduct-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToCalculator = useCallback(() => {
    const el = document.getElementById('print-simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* 1. Header & Navigation */}
      <Navbar onScrollToConduct={scrollToConduct} />

      {/* 2. Main Page Flow */}
      <main className="flex-grow">
        {/* Hero with Countdown */}
        <Hero
          onScrollToConduct={scrollToConduct}
          onScrollToCalculator={scrollToCalculator}
        />

        {/* Proof Strip */}
        <ProofStrip />

        {/* How It Works */}
        <HowItWorks />

        {/* Interactive Print Estimator & Shop Comparison */}
        <InteractiveSimulator onScrollToConduct={scrollToConduct} />

        {/* Key Features Bento */}
        <FeatureBento />

        {/* Old Way vs XEROXMATE Standard */}
        <ComparisonSection />

        {/* Conduct Card: Placed before the footer, collects Name & Email, syncs with Google Sheets & Excel */}
        <ConductCard />
      </main>

      {/* 3. Footer */}
      <Footer onScrollToConduct={scrollToConduct} />
    </div>
  );
}
