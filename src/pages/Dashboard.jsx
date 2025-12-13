import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useOccupancy } from '../hooks/useOccupancy';
import { useMuscleStats } from '../hooks/useMuscleStats';
import LiveStatusCard from '../components/dashboard/LiveStatusCard';
import AvatarScene from '../components/3d/AvatarScene';
import Modal from '../components/ui/Modal';
import QRScanner from '../components/dashboard/QRScanner';

import ScheduleModal from '../components/dashboard/ScheduleModal';
import GoalSelectionModal from '../components/dashboard/GoalSelectionModal';
import InquiryModal from '../components/dashboard/InquiryModal';
import OccupancyChart from '../components/dashboard/OccupancyChart';
import SocialModal from '../components/dashboard/SocialModal';
import ProfileModal from '../components/dashboard/ProfileModal';
import UsageSummaryModal from '../components/dashboard/UsageSummaryModal';
import UsageSummary from '../components/dashboard/UsageSummary';
import ActiveFriends from '../components/dashboard/ActiveFriends';
import HamburgerMenu from '../components/dashboard/HamburgerMenu';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const occupancyData = useOccupancy();
  const { stats: muscleStats, bodyStats, profile, trainMuscle } = useMuscleStats();

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [mySchedule, setMySchedule] = useState([]);
  const [recommendation, setRecommendation] = useState("Loading recommendations...");
  const [currentGoal, setCurrentGoal] = useState('General Fitness');

  // Check Onboarding Status
  useEffect(() => {
    if (profile && !profile.display_name) {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (profile?.fitness_goal) {
      setCurrentGoal(profile.fitness_goal);
    }
  }, [profile]);

  useEffect(() => {
    if (user) refreshSchedule();
  }, [user]);

  const refreshSchedule = async () => {
    const { data } = await supabase.from('user_schedules').select('*').eq('user_id', user.id);
    if (data) {
      setMySchedule(data);
      updateRecommendation(data);
    }
  };

  const updateRecommendation = (schedule) => {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[now.getDay()];
    // Simple period mapping: 1限 starts 9:00, periods are 90mins + 15mins break.
    // Logic: Find next free period today
    if (currentDay === 'Sun' || currentDay === 'Sat') {
      setRecommendation("It's the weekend! Great time for a full workout.");
      return;
    }

    // Find busy periods for today
    const busyPeriods = schedule.filter(s => s.day_of_week === currentDay).map(s => s.period);

    // Suggest first free period out of 1-6 (most common)
    const freePeriods = [1, 2, 3, 4, 5, 6].filter(p => !busyPeriods.includes(p));

    if (freePeriods.length > 0) {
      setRecommendation(`You have free time at Period ${freePeriods.join(', ')} today!`);
    } else {
      setRecommendation("Busy day today! Maybe a quick session in the evening?");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleScanSuccess = (decodedText) => {
    console.log(`Scan result: ${decodedText}`);
    // Navigate to Equipment Session on successful entry scan
    setIsQRModalOpen(false);
    navigate('/workout');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <HamburgerMenu
          onWorkout={() => navigate('/workout')}
          onProfile={() => setIsProfileModalOpen(true)}
          onSocial={() => setIsSocialModalOpen(true)}
          onSupport={() => setIsInquiryModalOpen(true)}
          onQR={() => setIsQRModalOpen(true)}
          onSignOut={handleSignOut}
        />

        <div style={{ textAlign: 'right' }}>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>UniFit</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Next-Gen Fitness Tracker</p>
        </div>
      </header>

      {/* Modals */}
      <ScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} onScheduleUpdate={refreshSchedule} />
      <InquiryModal isOpen={isInquiryModalOpen} onClose={() => setIsInquiryModalOpen(false)} />
      <SocialModal isOpen={isSocialModalOpen} onClose={() => setIsSocialModalOpen(false)} />
      <UsageSummaryModal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} />
      <GoalSelectionModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={currentGoal}
        onUpdate={(newGoal) => setCurrentGoal(newGoal)}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        profile={profile}
        currentGoal={currentGoal}
        mySchedule={mySchedule}
        onEditSchedule={() => setIsScheduleModalOpen(true)}
      />

      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Access Check-in">
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Scan the QR code at the gym entrance to enter.</p>
          <QRScanner onScanSuccess={handleScanSuccess} />
        </div>
      </Modal>

      {/* 1. Status & Chart (Top) */}
      <div style={{ marginBottom: '2rem' }}>
        <LiveStatusCard data={occupancyData} />
        <div className="glass-panel" style={{ marginTop: '1rem', padding: '1.5rem' }}>
          <OccupancyChart />
        </div>
      </div>

      {/* 2. Summary & Avatar (Middle) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Summary & Friends */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <UsageSummary />
          <ActiveFriends onOpenSocial={() => setIsSocialModalOpen(true)} />
        </div>

        {/* Right Column: Avatar */}
        <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '400px', position: 'relative' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <h3>My Avatar</h3>
            <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px' }}>Lv. {Math.floor(Object.values(muscleStats).reduce((a, b) => a + b, 0))}</span>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <AvatarScene muscleStats={muscleStats} bodyStats={bodyStats} />
            <div style={{ position: 'absolute', bottom: '1rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0 0.5rem' }}>
              {[
                { label: 'Chest', key: 'chest' },
                { label: 'Arms', key: 'arms' },
                { label: 'Legs', key: 'legs' },
              ].map(part => (
                <button
                  key={part.key}
                  onClick={() => trainMuscle(part.key)}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                >
                  + {part.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
