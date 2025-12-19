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
  const { stats: muscleStats, bodyStats, profile, trainMuscle, refreshProfile } = useMuscleStats();

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
  const isProcessingRef = React.useRef(false);

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

  const handleScanSuccess = async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    console.log(`Scan result: ${decodedText}`);
    
    // Check-in Logic (Dashboard only accepts check-in)
    if (decodedText === 'gym_check_in') {
      try {
        const { data, error } = await supabase.rpc('handle_occupancy', { 
          action_type: 'check_in' 
        });

        if (error) throw error;

        navigate('/workout');
        refreshProfile();
      } catch (err) {
        console.error('Error handling QR code:', err);
        alert(`Failed: ${err.message || 'Unknown error'}`);
      }
    } else if (decodedText === 'gym_check_out') {
      try {
        const { data, error } = await supabase.rpc('handle_occupancy', { 
          action_type: 'check_out' 
        });

        if (error) throw error;

        if (data?.duration !== undefined) {
          alert(`Check-out confirmed! You stayed for ${data.duration} minutes.`);
        }

        navigate('/');
        refreshProfile();
      } catch (err) {
        console.error('Error handling QR code:', err);
        alert(`Failed: ${err.message || 'Unknown error'}`);
      }
    } else {
      // Invalid QR code for check-in context
      setIsQRModalOpen(false);
      isProcessingRef.current = false;
      setTimeout(() => {
        alert('入室用QRコードのみ有効です');
      }, 100);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <HamburgerMenu
          onWorkout={() => navigate('/workout')}
          onProfile={() => setIsProfileModalOpen(true)}
          onSocial={() => setIsSocialModalOpen(true)}
          onSupport={() => setIsInquiryModalOpen(true)}
          onQR={() => setIsQRModalOpen(true)}
          onSignOut={handleSignOut}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setIsQRModalOpen(true)}
            style={{
              padding: '0.6rem 0.8rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
            title="Scan QR Code"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            📸
          </button>
          <div style={{ textAlign: 'right' }}>
            <h1 className="gradient-text" style={{ fontSize: window.innerWidth < 400 ? '1.5rem' : '1.8rem', marginBottom: '0.2rem', lineHeight: '1' }}>UniFit</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: 0 }}>Next-Gen Fitness Tracker</p>
            {profile?.is_present !== undefined && (
              <span style={{ 
                display: 'inline-block', 
                marginTop: '0.2rem',
                padding: '1px 8px', 
                borderRadius: '20px', 
                fontSize: '0.65rem', 
                fontWeight: 'bold',
                background: profile.is_present ? 'rgba(52, 211, 153, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                color: profile.is_present ? '#34d399' : '#9ca3af',
                border: `1px solid ${profile.is_present ? 'rgba(52, 211, 153, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`,
                letterSpacing: '0.02em'
              }}>
                {profile.is_present ? '● CHECKED IN' : '○ AWAY'}
              </span>
            )}
          </div>
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

      <Modal isOpen={isQRModalOpen} onClose={() => { setIsQRModalOpen(false); isProcessingRef.current = false; }} title="Access Check-in">
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Scan the QR code at the gym entrance to enter.</p>
          <QRScanner key={isQRModalOpen ? 'open' : 'closed'} onScanSuccess={handleScanSuccess} />
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        {/* Left Column: Summary & Friends */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <UsageSummary />
          <ActiveFriends onOpenSocial={() => setIsSocialModalOpen(true)} />
        </div>

        {/* Right Column: Avatar */}
        <div className="glass-panel" style={{ 
          padding: '0', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          minHeight: window.innerWidth < 600 ? '350px' : '450px', 
          position: 'relative' 
        }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <h3 style={{ fontSize: '1.1rem' }}>My Avatar</h3>
            <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 10px', borderRadius: '2rem' }}>LV. {Math.floor(Object.values(muscleStats).reduce((a, b) => a + b, 0))}</span>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <AvatarScene muscleStats={muscleStats} bodyStats={bodyStats} />
            <div style={{ position: 'absolute', bottom: '1.2rem', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0 0.8rem' }}>
              {[
                { label: 'Chest', key: 'chest' },
                { label: 'Arms', key: 'arms' },
                { label: 'Legs', key: 'legs' },
              ].map(part => (
                <button
                  key={part.key}
                  onClick={() => trainMuscle(part.key)}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '2rem',
                    fontSize: '0.8rem',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    zIndex: 10,
                    fontWeight: '600'
                  }}
                >
                  +{part.label}
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
