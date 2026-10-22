import React, { useState, useEffect } from 'react';
import { HackathonProvider, useHackathon } from './context/HackathonContext';
import { Navbar } from './components/Navbar';
import { BottomDock } from './components/BottomDock';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { TracksSection } from './components/TracksSection';
import { PrizesSection } from './components/PrizesSection';
import { ScheduleSection } from './components/ScheduleSection';
import { RulesSection } from './components/RulesSection';
import { NewsSection } from './components/NewsSection';
import { LocationSection } from './components/LocationSection';
import { CoreTeamSection } from './components/CoreTeamSection';
import { FAQSection } from './components/FAQSection';
import { SponsorsGallerySection } from './components/SponsorsGallerySection';
import { Footer } from './components/Footer';
import { CoreTeamDrawer } from './components/CoreTeamDrawer';
import { RegistrationModal } from './components/RegistrationModal';
import { QRCodeModal } from './components/QRCodeModal';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { AdminPanel } from './components/AdminPanel';
import { TermsPrivacyModal } from './components/TermsPrivacyModal';
import { NotFoundPage } from './components/NotFoundPage';
import { Error500Page } from './components/Error500Page';

const HackathonApp: React.FC = () => {
  const {
    activeView,
    setActiveView,
    showRegisterModal,
    setShowRegisterModal,
  } = useHackathon();

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // Check URL parameters on mount (e.g. ?action=register or ?view=admin)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'register') {
        setShowRegisterModal(true);
      }
      if (params.get('view') === 'admin') {
        setActiveView('admin');
      }
      if (params.get('view') === 'dashboard') {
        setActiveView('dashboard');
      }
    }
  }, [setActiveView, setShowRegisterModal]);

  return (
    <div className="min-h-screen bg-[#050B1A] text-[#F2F6FF] flex flex-col font-sans selection:bg-[#35E0FF]/30 selection:text-[#35E0FF] relative">
      {/* Top Navbar */}
      <Navbar onOpenQR={() => setQrModalOpen(true)} />

      {/* Main View Switcher */}
      <main className="flex-grow">
        {activeView === 'home' && (
          <>
            <HeroSection onOpenQR={() => setQrModalOpen(true)} />
            <AboutSection />
            <TracksSection />
            <PrizesSection />
            <ScheduleSection />
            <RulesSection />
            <NewsSection />
            <LocationSection />
            <CoreTeamSection />
            <FAQSection />
            <SponsorsGallerySection />
          </>
        )}

        {activeView === 'dashboard' && <ParticipantDashboard />}

        {activeView === 'admin' && <AdminPanel />}

        {activeView === '404' && <NotFoundPage />}
        {activeView === '500' && <Error500Page onReset={() => setActiveView('home')} />}
      </main>

      {/* Universal Footer */}
      <Footer 
        onOpenTerms={() => setLegalModalType('terms')}
        onOpenPrivacy={() => setLegalModalType('privacy')}
      />

      {/* Floating Bottom-Left OS Dock */}
      <BottomDock />

      {/* Live Core Team Slide-Up Drawer */}
      <CoreTeamDrawer />

      {/* Multi-Step Registration Modal */}
      <RegistrationModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
      />

      {/* Event QR Code Generator Modal */}
      <QRCodeModal 
        isOpen={qrModalOpen} 
        onClose={() => setQrModalOpen(false)} 
      />

      {/* Terms & Privacy Dialog */}
      <TermsPrivacyModal 
        type={legalModalType} 
        onClose={() => setLegalModalType(null)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <HackathonProvider>
      <HackathonApp />
    </HackathonProvider>
  );
}
