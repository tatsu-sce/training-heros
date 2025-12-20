import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useOccupancy } from '../hooks/useOccupancy';
import { useMuscleStats } from '../hooks/useMuscleStats';
import { useOccupancyHistory } from '../hooks/useOccupancyHistory';
import LiveStatusCard from '../components/dashboard/LiveStatusCard';
import AvatarScene from '../components/3d/AvatarScene';
import Modal from '../components/ui/Modal';
import QRScanner from '../components/dashboard/QRScanner';

import ScheduleModal from '../components/dashboard/ScheduleModal';
import GoalSelectionModal from '../components/dashboard/GoalSelectionModal';
import InquiryModal from '../components/dashboard/InquiryModal';
import CampusSelector from '../components/dashboard/CampusSelector'; // Add import
import OccupancyChart from '../components/dashboard/OccupancyChart';


import SocialModal from '../components/dashboard/SocialModal';
import ProfileModal from '../components/dashboard/ProfileModal';
import UsageSummaryModal from '../components/dashboard/UsageSummaryModal';
import UsageSummary from '../components/dashboard/UsageSummary';
import ActiveFriends from '../components/dashboard/ActiveFriends';
import HamburgerMenu from '../components/dashboard/HamburgerMenu';
import CheckoutCorrectionModal from '../components/dashboard/CheckoutCorrectionModal';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const occupancyData = useOccupancy();
  const { stats: muscleStats, bodyStats, profile, trainMuscle, refreshProfile } = useMuscleStats();


   const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState('shibuya');
  const { historyData } = useOccupancyHistory(selectedCampus, occupancyData.counts ? (occupancyData.counts[selectedCampus] || 0) : 0);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);


  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [mySchedule, setMySchedule] = useState([]);
  const [recommendation, setRecommendation] = useState("Loading recommendations...");
  const [currentGoal, setCurrentGoal] = useState('General Fitness');
  const isProcessingRef = React.useRef(false);

  // Check Onboarding & Stale Sessions
  useEffect(() => {
    if (profile && !profile.display_name) {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (profile?.is_present && profile?.last_check_in_at && !isCorrectionModalOpen) {
      const checkStale = () => {
        const lastCheckIn = new Date(profile.last_check_in_at).getTime();
        const thresholdMs = 2 * 60 * 60 * 1000; // Threshold (2 hours)
        const timeElapsed = Date.now() - lastCheckIn;

        if (timeElapsed > thresholdMs) {
          setIsCorrectionModalOpen(true);
        } else {
          // Schedule a check for the moment it becomes stale
          const timer = setTimeout(() => {
            setIsCorrectionModalOpen(true);
          }, thresholdMs - timeElapsed + 100);
          return () => clearTimeout(timer);
        }
      };
      return checkStale();
    }
  }, [profile, isCorrectionModalOpen]);

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

    // Time mapping
    const TIME_LABELS = {
      1: '10:00-10:30', 2: '10:30-11:00', 3: '11:00-11:30', 4: '11:30-12:00',
      5: '12:00-12:30', 6: '12:30-13:00', 7: '13:00-13:30', 8: '13:30-14:00',
      9: '14:00-14:30', 10: '14:30-15:00', 11: '15:00-15:30', 12: '15:30-16:00',
      13: '16:00-16:30', 14: '16:30-17:00', 15: '17:00-17:30', 16: '17:30-18:00'
    };

    if (currentDay === 'Sun') {
      setRecommendation("今日はトレセンがお休みです。自宅でストレッチしましょう！");
      return;
    }

    const todayFreeSlots = schedule
      .filter(s => s.day_of_week === currentDay.substring(0, 3) && s.is_occupied)
      .map(s => s.period)
      .sort((a, b) => a - b);

    if (todayFreeSlots.length === 0) {
      setRecommendation("今日の空き時間が登録されていません。スケジュールを更新してみましょう！");
    } else {
      // Find slots that are still in the future
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTimeVal = currentHour * 60 + currentMin;

      const futureSlots = todayFreeSlots.filter(period => {
        const [h, m] = TIME_LABELS[period].split(':').map(Number);
        return (h * 60 + m) > currentTimeVal;
      });

      if (futureSlots.length > 0) {
        const nextTime = TIME_LABELS[futureSlots[0]];
        setRecommendation(`今日は ${nextTime} からトレーニングに行ける予定ですね！準備はいいですか？`);
      } else {
        setRecommendation("今日の予定していたトレーニング時間は終了しました。お疲れ様でした！");
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleScanSuccess = async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    console.log(`Scan result: ${decodedText}`);

    // Check-in/out Logic
    let action = '';
    let campus = selectedCampus;

    if (decodedText.endsWith('_check_in')) {
        action = 'check_in';
        const prefix = decodedText.replace('_check_in', '');
        if (['ookayama', 'suzukakedai'].includes(prefix)) {
            campus = prefix;
            setSelectedCampus(prefix); // Switch view to that campus
        }
    } else if (decodedText.endsWith('_check_out')) {
        action = 'check_out';
        const prefix = decodedText.replace('_check_out', '');
        if (['ookayama', 'suzukakedai'].includes(prefix)) {
            campus = prefix;
            setSelectedCampus(prefix);
        }
    } else if (decodedText === 'gym_check_in') {
        action = 'check_in';
    } else if (decodedText === 'gym_check_out') {
        action = 'check_out';
    }

    if (action) {
      try {
        const { data, error } = await supabase.rpc('handle_occupancy', {
          action_type: action,
          location_name: campus
        });

        if (error) throw error;

        if (action === 'check_in') {
            navigate('/workout');
        } else {
            if (data?.duration_seconds !== undefined) {
                const unit = data.duration_seconds < 60 ? 'seconds' : 'minutes';
                const value = data.duration_seconds < 60 ? data.duration_seconds : data.duration_minutes;
                alert(`Check-out confirmed! You stayed for ${value} ${unit}.`);
            }
            navigate('/');
        }
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="pulse-glow"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            title="Scan QR Code"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 25px rgba(99, 102, 241, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.3)';
            }}
          >
            {/* Premium QR SVG Icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H9V9H3V3ZM5 5V7H7V5H5Z" fill="currentColor" />
              <path d="M3 15H9V21H3V15ZM5 17V19H7V17H5Z" fill="currentColor" />
              <path d="M15 3H21V9H15V3ZM17 5V7H19V5H17Z" fill="currentColor" />
              <path d="M15 15H17V17H15V15Z" fill="currentColor" />
              <path d="M17 17H19V19H17V17Z" fill="currentColor" />
              <path d="M19 15H21V17H19V15Z" fill="currentColor" />
              <path d="M15 19H17V21H15V19Z" fill="currentColor" />
              <path d="M19 19H21V21H19V19Z" fill="currentColor" />
              <path d="M11 11H13V13H11V11Z" fill="currentColor" />
              <path d="M11 3H13V9H11V3Z" fill="currentColor" />
              <path d="M3 11H9V13H3V11Z" fill="currentColor" />
              <path d="M15 11H21V13H15V11Z" fill="currentColor" />
              <path d="M11 15H13V21H11V15Z" fill="currentColor" />
            </svg>

            {/* Subtle Inner Glow Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
              pointerEvents: 'none'
            }} />
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
      <CheckoutCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        lastCheckInAt={profile?.last_check_in_at}
        onCorrectionComplete={refreshProfile}
      />

      <Modal isOpen={isQRModalOpen} onClose={() => { setIsQRModalOpen(false); isProcessingRef.current = false; }} title="Access Check-in">
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Scan the QR code at the gym entrance to enter.</p>
          <QRScanner key={isQRModalOpen ? 'open' : 'closed'} onScanSuccess={handleScanSuccess} />
        </div>
      </Modal>

      {/* 1. Status & Chart (Top) */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
             <CampusSelector selectedCampus={selectedCampus} onSelect={setSelectedCampus} />
        </div>
        <LiveStatusCard data={occupancyData} campus={selectedCampus} />

        {/* Recommendation Message */}
        <div className="glass-panel" style={{
          marginTop: '1rem',
          padding: '1.25rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.2rem' }}>Next Session Suggestion</p>
            <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {recommendation}
            </p>
          </div>
        </div>



        <div className="glass-panel" style={{ marginTop: '1rem', padding: '1.5rem' }}>
          <OccupancyChart 
              campusId={selectedCampus} 
              currentOccupancy={occupancyData.counts ? (occupancyData.counts[selectedCampus] || 0) : 0} 
              historyData={historyData}
          />
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
