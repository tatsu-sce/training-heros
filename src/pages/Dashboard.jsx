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
import QRGenerator from '../components/dashboard/QRGenerator';
import WorkoutTimer from '../components/dashboard/WorkoutTimer';
import ScheduleModal from '../components/dashboard/ScheduleModal';
import GoalSelectionModal from '../components/dashboard/GoalSelectionModal';
import InquiryModal from '../components/dashboard/InquiryModal';
import OccupancyChart from '../components/dashboard/OccupancyChart';
import EquipmentTimer from '../components/dashboard/EquipmentTimer';
import SocialModal from '../components/dashboard/SocialModal';
import UsageSummaryModal from '../components/dashboard/UsageSummaryModal'; // Imported
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
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false); // New State
  const [qrMode, setQrMode] = useState('scan');
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [mySchedule, setMySchedule] = useState([]);
  const [recommendation, setRecommendation] = useState("Loading recommendations...");

  const [currentGoal, setCurrentGoal] = useState('General Fitness');

  // Check Onboarding Status
  useEffect(() => {
    // If profile is loaded but has no display name, redirect to onboarding
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
    // 1: 09:00, 2: 10:45, 3: 13:00, 4: 14:45, 5: 16:30, 6: 18:15...
    // For simplicity, checking if current period is free.

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

  const workoutItems = [
    { name: 'ベンチプレス', reps: '3 x 10', description: 'ベンチに仰向けになり、足を床につけます。バーを胸まで下ろし、押し上げます。' },
    { name: 'インクライン・ダンベル・フライ', reps: '3 x 12', description: 'ベンチを30°に設定します。肘を少し曲げた状態でウェイトを下ろし、絞るように上げます。' },
    { name: 'トライセプス・プッシュダウン', reps: '3 x 15', description: '肘を脇に固定します。腕がまっすぐになるまでバーを押し下げます。' }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleScanSuccess = (decodedText) => {
    console.log(`Scan result: ${decodedText}`);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>UniFit</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>お帰りなさい、{profile?.display_name || user?.email?.split('@')[0].split('.')[0]} さん</p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setIsUsageModalOpen(true)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Report
          </button>
          <button className="btn-secondary" onClick={() => setIsSocialModalOpen(true)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Social
          </button>
          <button className="btn-secondary" onClick={() => setIsInquiryModalOpen(true)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Support
          </button>
          <button className="btn-secondary" onClick={() => setIsScheduleModalOpen(true)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Schedule
          </button>
          <button className="btn-secondary" onClick={handleSignOut} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Sign Out
          </button>
          <button className="btn-primary" onClick={() => setIsQRModalOpen(true)} style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
            {t('checkin')}
          </button>
        </div>
      </header>

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

      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Access & Equipment">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <button
            onClick={() => setQrMode('scan')}
            style={{
              color: qrMode === 'scan' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: qrMode === 'scan' ? '600' : '400',
              borderBottom: qrMode === 'scan' ? '2px solid var(--color-primary)' : 'none',
              paddingBottom: '0.5rem'
            }}
          >
            Scan QR
          </button>
          <button
            onClick={() => setQrMode('show')}
            style={{
              color: qrMode === 'show' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: qrMode === 'show' ? '600' : '400',
              borderBottom: qrMode === 'show' ? '2px solid var(--color-primary)' : 'none',
              paddingBottom: '0.5rem'
            }}
          >
            My Code
          </button>
        </div>

        {qrMode === 'scan' ? (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Scan the QR code at the gym entrance or equipment.</p>
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>
        ) : (
          <QRGenerator value={user?.id || "demo-id"} title="Student ID" />
        )}
      </Modal>

      <div style={{ marginBottom: '2rem' }}>
        <LiveStatusCard data={occupancyData} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ marginTop: '1rem', padding: '1.5rem' }}>
            <OccupancyChart />
          </div>
          <EquipmentTimer />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>

        {/* Avatar Card */}
        <div className="glass-panel card-hover" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '400px' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                { label: 'Back', key: 'back' },
                { label: 'Shldrs', key: 'shoulders' },
                { label: 'Abs', key: 'abs' },
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
                    zIndex: 10,
                    minWidth: '50px'
                  }}
                >
                  + {part.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workout Card */}
        <div className="glass-panel card-hover" style={{ padding: '1.5rem', position: 'relative', zIndex: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3>Recommended Workout</h3>
              <div style={{ margin: '0.5rem 0', padding: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)', fontSize: '0.9rem' }}>
                {recommendation}
              </div>
            </div>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              Goal: {currentGoal} ✎
            </button>
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Based on your goal: <strong>{currentGoal}</strong></p>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {workoutItems.map((item, i) => (
              <div
                key={i}
                onClick={() => setExpandedWorkout(expandedWorkout === i ? null : i)}
                style={{
                  padding: '0.8rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: '24px', height: '24px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{item.reps}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{expandedWorkout === i ? '▲' : '▼'}</div>
                </div>
                {expandedWorkout === i && (
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>

          <WorkoutTimer />

          <button
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, var(--color-primary), #a855f7)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              transform: 'translateY(0)',
              transition: 'transform 0.1s',
              position: 'relative',
              zIndex: 999
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Start Session Button CLICKED!");
              alert("🏁 トレーニングセッションを開始しました！\n(Session Started)");
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(2px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            START SESSION
          </button>


          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Recent Gains</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px' }}>Chest +0.2%</span>
              <span style={{ fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px' }}>Arms +0.1%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
