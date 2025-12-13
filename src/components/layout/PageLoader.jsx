import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import RunningAvatar from '../3d/RunningAvatar';
import { useMuscleStats } from '../../hooks/useMuscleStats';

const PageLoader = () => {
    const { stats, bodyStats } = useMuscleStats();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            background: 'var(--color-bg-deep)', // Or a gradient
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)'
        }}>
            <div style={{ width: '300px', height: '400px' }}>
                <Canvas shadows dpr={[1, 2]}>
                    <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault position={[2, 1, 3]} fov={50} />
                        <ambientLight intensity={0.6} />
                        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow />

                        <RunningAvatar muscleStats={stats} bodyStats={bodyStats} />

                        <Environment preset="studio" />
                        {/* Auto rotate slightly to show dimensionality? */}
                        <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
                    </Suspense>
                </Canvas>
            </div>
            <h2 className="gradient-text" style={{ marginTop: '1rem', animation: 'pulse 1.5s infinite' }}>Loading...</h2>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default PageLoader;
