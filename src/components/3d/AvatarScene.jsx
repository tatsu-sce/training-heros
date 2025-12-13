import React, { useRef, Suspense } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows, Sphere, Cylinder, Box } from '@react-three/drei';

// A reusable body part component that can take any geometry as children or default primitives
const BodyPart = ({ position, rotation, scale, color, children }) => {
    return (
        <group position={position} rotation={rotation} scale={scale}>
            <mesh castShadow receiveShadow>
                {children}
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
            </mesh>
        </group>
    );
};

const AvatarBody = ({ muscleStats }) => {
    // Default stats if undefined
    const s = {
        chest: Math.max(Number(muscleStats?.chest) || 1, 1),
        arms: Math.max(Number(muscleStats?.arms) || 1, 1),
        legs: Math.max(Number(muscleStats?.legs) || 1, 1),
        abs: Math.max(Number(muscleStats?.abs) || 1, 1),
        shoulders: Math.max(Number(muscleStats?.shoulders) || 1, 1),
        back: Math.max(Number(muscleStats?.back) || 1, 1),
    };

    const baseColor = "#1e3a8a"; // Dark Blue Sportswear
    const skinColor = "#e0ac69"; // Natural Skin Tone
    const muscleHighlight = "#eaa65e"; // Slightly lighter skin

    // Growth Logic
    const chestScale = 1 + (s.chest - 1) * 0.2;
    const armScale = 1 + (s.arms - 1) * 0.2;
    const legScale = 1 + (s.legs - 1) * 0.2;
    const shoulderScale = 1 + (s.shoulders - 1) * 0.25;

    // Back influence: Lat spread (width of upper torso) and Trap height
    const latSpread = 1 + (s.back - 1) * 0.3;
    const trapSize = 1 + (s.back - 1) * 0.15;

    // Abs influence: Definition (simulated by segmentation or small spheres)
    // For now, simple scaling of mid-section
    const coreStrength = 1 + (s.abs - 1) * 0.15;

    // Materials should be less shiny for skin
    const SkinMaterial = <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0.1} />;

    return (
        <group position={[0, -0.2, 0]}>
            {/* --- HEAD & NECK --- */}
            <group position={[0, 1.75, 0]}>
                {/* Face */}
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.22, 32, 32]} />
                    {SkinMaterial}
                </mesh>
                {/* Ears */}
                <mesh position={[0.21, 0, 0]} rotation={[0, 0, -0.1]}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    {SkinMaterial}
                </mesh>
                <mesh position={[-0.21, 0, 0]} rotation={[0, 0, 0.1]}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    {SkinMaterial}
                </mesh>

                {/* Eyebrows */}
                <mesh position={[0.08, 0.12, 0.18]} rotation={[0, 0, -0.1]}>
                    <boxGeometry args={[0.06, 0.015, 0.01]} />
                    <meshStandardMaterial color="#3a2510" />
                </mesh>
                <mesh position={[-0.08, 0.12, 0.18]} rotation={[0, 0, 0.1]}>
                    <boxGeometry args={[0.06, 0.015, 0.01]} />
                    <meshStandardMaterial color="#3a2510" />
                </mesh>

                {/* Eyes */}
                <mesh position={[0.08, 0.05, 0.19]} castShadow>
                    <sphereGeometry args={[0.025, 16, 16]} />
                    <meshStandardMaterial color="#1f2937" roughness={0.1} />
                </mesh>
                <mesh position={[-0.08, 0.05, 0.19]} castShadow>
                    <sphereGeometry args={[0.025, 16, 16]} />
                    <meshStandardMaterial color="#1f2937" roughness={0.1} />
                </mesh>

                {/* Mouth (Smile) */}
                <mesh position={[0, -0.07, 0.19]} rotation={[0.1, 0, 0]}>
                    <torusGeometry args={[0.04, 0.008, 16, 32, 2.5]} />
                    <meshStandardMaterial color="#9f5a46" />
                </mesh>

                {/* Hair */}
                <group position={[0, 0.18, -0.05]}>
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.24, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                        <meshStandardMaterial color="#2d2a26" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, -0.05, 0.2]} rotation={[-0.2, 0, 0]}>
                        <sphereGeometry args={[0.23, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.15]} />
                        <meshStandardMaterial color="#2d2a26" roughness={0.8} />
                    </mesh>
                </group>

                {/* Traps (Trapezius) - Connects neck to shoulders */}
                <mesh position={[0, -0.22, 0]} scale={[1, trapSize, 1]}>
                    <coneGeometry args={[0.18, 0.2, 32]} />
                    {SkinMaterial}
                </mesh>
            </group>

            <BodyPart position={[0, 1.5, 0]} color={skinColor}>
                <cylinderGeometry args={[0.095, 0.11, 0.2, 16]} />
            </BodyPart>

            {/* --- TORSO --- */}
            <group position={[0, 1.1, 0]}>
                {/* Upper Chest / Back (Lats) */}
                <mesh position={[0, 0.15, 0]} scale={[latSpread, 1, chestScale]}>
                    {/* Wider top for lats */}
                    <cylinderGeometry args={[0.28, 0.18, 0.45, 16]} />
                    <meshStandardMaterial color={baseColor} />
                </mesh>

                {/* Abs / Core */}
                <mesh position={[0, -0.25, 0]} scale={[1, 1, coreStrength]}>
                    <cylinderGeometry args={[0.17, 0.16, 0.35, 16]} />
                    <meshStandardMaterial color={baseColor} />
                </mesh>

                {/* Pectorals (Chest Muscles) */}
                <mesh position={[0.1, 0.15, 0.15]} rotation={[0, 0, -0.1]} scale={[chestScale, chestScale, chestScale]}>
                    <boxGeometry args={[0.18, 0.16, 0.1]} />
                    <meshStandardMaterial color={baseColor} roughness={0.4} />
                </mesh>
                <mesh position={[-0.1, 0.15, 0.15]} rotation={[0, 0, 0.1]} scale={[chestScale, chestScale, chestScale]}>
                    <boxGeometry args={[0.18, 0.16, 0.1]} />
                    <meshStandardMaterial color={baseColor} roughness={0.4} />
                </mesh>

                {/* Abs definitions (Six pack visual) */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <group key={i} position={[0, -0.15 - (i * 0.08), 0.12]} scale={[1, 1, s.abs > 1.5 ? 1.2 : 1]}>
                        <mesh position={[0.05, 0, 0]}>
                            <sphereGeometry args={[0.035, 16, 16]} />
                            <meshStandardMaterial color={baseColor} />
                        </mesh>
                        <mesh position={[-0.05, 0, 0]}>
                            <sphereGeometry args={[0.035, 16, 16]} />
                            <meshStandardMaterial color={baseColor} />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* --- ARMS & SHOULDERS --- */}
            <group position={[0, 1.35, 0]}>
                {/* Shoulders (Deltoids) - New */}
                {/* Moved out further to avoid clipping with lats (0.28 -> 0.32) */}
                <group position={[0.32 * latSpread, 0, 0]}>
                    <mesh scale={[shoulderScale, shoulderScale, shoulderScale]}>
                        <sphereGeometry args={[0.14, 32, 32]} />
                        {SkinMaterial}
                    </mesh>
                    {/* Left Arm attached to shoulder - Horizontal (1.57 rad) */}
                    <group position={[0.05, -0.05, 0]} rotation={[0, 0, 1.57]} scale={[armScale, 1, armScale]}>
                        <mesh position={[0, -0.25, 0]}>
                            <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
                            {SkinMaterial}
                        </mesh>
                        {/* Forearm */}
                        <mesh position={[0, -0.65, 0]}>
                            <cylinderGeometry args={[0.075, 0.06, 0.5, 16]} />
                            {SkinMaterial}
                        </mesh>
                        <mesh position={[0, -0.9, 0]}>
                            <sphereGeometry args={[0.07, 16, 16]} />
                            {SkinMaterial}
                        </mesh>
                    </group>
                </group>

                <group position={[-0.32 * latSpread, 0, 0]}>
                    <mesh scale={[shoulderScale, shoulderScale, shoulderScale]}>
                        <sphereGeometry args={[0.14, 32, 32]} />
                        {SkinMaterial}
                    </mesh>
                    {/* Right Arm - Horizontal (-1.57 rad) */}
                    <group position={[-0.05, -0.05, 0]} rotation={[0, 0, -1.57]} scale={[armScale, 1, armScale]}>
                        <mesh position={[0, -0.25, 0]}>
                            <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
                            {SkinMaterial}
                        </mesh>
                        {/* Forearm */}
                        <mesh position={[0, -0.65, 0]}>
                            <cylinderGeometry args={[0.075, 0.06, 0.5, 16]} />
                            {SkinMaterial}
                        </mesh>
                        <mesh position={[0, -0.9, 0]}>
                            <sphereGeometry args={[0.07, 16, 16]} />
                            {SkinMaterial}
                        </mesh>
                    </group>
                </group>
            </group>

            {/* --- LEGS --- */}
            <group position={[0, 0.7, 0]}>
                {/* Hips/Pelvis */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.2, 16]} />
                    <meshStandardMaterial color={baseColor} />
                </mesh>

                {/* Left Leg - Spread wider (Positive Z rotation for Left side x>0) */}
                <group position={[0.15, -0.1, 0]} rotation={[0, 0, 0.25]} scale={[legScale, 1, legScale]}>
                    <mesh position={[0, -0.35, 0]}>
                        <cylinderGeometry args={[0.11, 0.09, 0.7, 16]} />
                        <meshStandardMaterial color={baseColor} />
                    </mesh>
                    <mesh position={[0, -0.85, 0]}>
                        <cylinderGeometry args={[0.085, 0.06, 0.6, 16]} />
                        {SkinMaterial}
                    </mesh>
                    <mesh position={[0, -1.15, 0.05]} scale={[1, 0.5, 1.5]}>
                        <boxGeometry args={[0.1, 0.1, 0.2]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </group>

                {/* Right Leg - Spread wider (Negative Z rotation for Right side x<0) */}
                <group position={[-0.15, -0.1, 0]} rotation={[0, 0, -0.25]} scale={[legScale, 1, legScale]}>
                    <mesh position={[0, -0.35, 0]}>
                        <cylinderGeometry args={[0.11, 0.09, 0.7, 16]} />
                        <meshStandardMaterial color={baseColor} />
                    </mesh>
                    <mesh position={[0, -0.85, 0]}>
                        <cylinderGeometry args={[0.085, 0.06, 0.6, 16]} />
                        {SkinMaterial}
                    </mesh>
                    <mesh position={[0, -1.15, 0.05]} scale={[1, 0.5, 1.5]}>
                        <boxGeometry args={[0.1, 0.1, 0.2]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

const AvatarScene = ({ muscleStats = { chest: 1, arms: 1, legs: 1, abs: 1 } }) => {
    return (
        <div style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}>
            <Canvas shadows dpr={[1, 2]}>
                <Suspense fallback={null}>
                    {/* Zoomed in camera */}
                    <PerspectiveCamera makeDefault position={[0, 1.3, 3.2]} fov={45} />
                    <ambientLight intensity={0.6} />
                    <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.2} castShadow />
                    <pointLight position={[-5, 5, -5]} intensity={0.8} color="#dbeafe" />

                    <group position={[0, -0.5, 0]}>
                        <AvatarBody muscleStats={muscleStats} />
                        <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.4} far={1} color="#000000" />
                    </group>

                    <OrbitControls enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
                    <Environment preset="studio" />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default AvatarScene;
