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

const AvatarBody = ({ muscleStats, bodyStats }) => {
    // Default stats if undefined
    const s = {
        chest: Math.max(Number(muscleStats?.chest) || 1, 1),
        arms: Math.max(Number(muscleStats?.arms) || 1, 1),
        legs: Math.max(Number(muscleStats?.legs) || 1, 1),
        abs: Math.max(Number(muscleStats?.abs) || 1, 1),
        shoulders: Math.max(Number(muscleStats?.shoulders) || 1, 1),
        back: Math.max(Number(muscleStats?.back) || 1, 1),
    };

    // Body Stats Logic
    const heightVal = Number(bodyStats?.height) || 170;
    const fatVal = Number(bodyStats?.bodyFat) || 15;

    // Height Scaling (170cm = 1.0)
    // Scale vertically more than horizontally to show height diff, or uniform?
    // Let's do uniform scale for size difference, maybe slight Y bias.
    const heightScale = heightVal / 170;

    // Fat Scaling (15% = 1.0)
    // Fat affects waist (core) and hips mostly here.
    const fatFactor = Math.max(0, fatVal - 15); // excess fat
    const waistScale = 1 + (fatFactor * 0.015); // 1.5% wider per 1% bodyfat above 15
    const bellyBulge = 1 + (fatFactor * 0.02); // Belly sticks out more

    const baseColor = "#1e3a8a"; // Dark Blue Sportswear
    const skinColor = "#e0ac69"; // Natural Skin Tone

    // Muscle Growth Logic
    const chestScale = 1 + (s.chest - 1) * 0.2;
    const armScale = 1 + (s.arms - 1) * 0.2;
    const legScale = 1 + (s.legs - 1) * 0.2;
    const shoulderScale = 1 + (s.shoulders - 1) * 0.25;
    const latSpread = 1 + (s.back - 1) * 0.3;
    const trapSize = 1 + (s.back - 1) * 0.15;
    const coreStrength = (1 + (s.abs - 1) * 0.15);
    // Abs definition reduced by fat (visual trick: just scale core width up for fat)

    const SkinMaterial = <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0.1} />;

    return (
        <group position={[0, -0.2, 0]} scale={[heightScale, heightScale, heightScale]}>
            {/* --- HEAD & NECK --- */}
            <group position={[0, 1.75, 0]}>
                {/* Face */}
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.22 * (1 + (fatFactor * 0.005)), 32, 32]} />
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

                {/* Traps */}
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
                    <cylinderGeometry args={[0.28, 0.18, 0.45, 16]} />
                    <meshStandardMaterial color={baseColor} />
                </mesh>

                {/* Abs / Core - Affected by Body Fat */}
                <mesh position={[0, -0.25, 0]} scale={[waistScale, 1, bellyBulge * coreStrength]}>
                    <cylinderGeometry args={[0.17, 0.16, 0.35, 16]} />
                    <meshStandardMaterial color={baseColor} />
                </mesh>

                {/* Pectorals */}
                <mesh position={[0.1, 0.15, 0.15]} rotation={[0, 0, -0.1]} scale={[chestScale, chestScale, chestScale]}>
                    <boxGeometry args={[0.18, 0.16, 0.1]} />
                    <meshStandardMaterial color={baseColor} roughness={0.4} />
                </mesh>
                <mesh position={[-0.1, 0.15, 0.15]} rotation={[0, 0, 0.1]} scale={[chestScale, chestScale, chestScale]}>
                    <boxGeometry args={[0.18, 0.16, 0.1]} />
                    <meshStandardMaterial color={baseColor} roughness={0.4} />
                </mesh>

                {/* Abs definitions (Six pack) - Hide/Scale down if fat is high */}
                {fatVal < 20 && Array.from({ length: 3 }).map((_, i) => (
                    <group key={i} position={[0, -0.15 - (i * 0.08), 0.12 * bellyBulge]} scale={[1, 1, s.abs > 1.5 ? 1.2 : 1]}>
                        <mesh position={[0.05 * waistScale, 0, 0]}>
                            <sphereGeometry args={[0.035, 16, 16]} />
                            <meshStandardMaterial color={baseColor} />
                        </mesh>
                        <mesh position={[-0.05 * waistScale, 0, 0]}>
                            <sphereGeometry args={[0.035, 16, 16]} />
                            <meshStandardMaterial color={baseColor} />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* --- ARMS & SHOULDERS --- */}
            <group position={[0, 1.35, 0]}>
                {/* Shoulders */}
                <group position={[0.32 * latSpread, 0, 0]}>
                    <mesh scale={[shoulderScale, shoulderScale, shoulderScale]}>
                        <sphereGeometry args={[0.14, 32, 32]} />
                        {SkinMaterial}
                    </mesh>
                    {/* Left Arm */}
                    <group position={[0.05, -0.05, 0]} rotation={[0, 0, 1.57]} scale={[armScale, 1, armScale]}>
                        <mesh position={[0, -0.25, 0]}>
                            <cylinderGeometry args={[0.09 * (1 + fatFactor * 0.005), 0.08 * (1 + fatFactor * 0.005), 0.55, 16]} />
                            {SkinMaterial}
                        </mesh>
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
                    {/* Right Arm */}
                    <group position={[-0.05, -0.05, 0]} rotation={[0, 0, -1.57]} scale={[armScale, 1, armScale]}>
                        <mesh position={[0, -0.25, 0]}>
                            <cylinderGeometry args={[0.09 * (1 + fatFactor * 0.005), 0.08 * (1 + fatFactor * 0.005), 0.55, 16]} />
                            {SkinMaterial}
                        </mesh>
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
                {/* Hips/Pelvis - Affected by Weight */}
                <mesh position={[0, 0, 0]} scale={[waistScale, 1, bellyBulge]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.2, 16]} />
                    <meshStandardMaterial color={baseColor} />
                </mesh>

                {/* Left Leg */}
                <group position={[0.15 * waistScale, -0.1, 0]} rotation={[0, 0, 0.25]} scale={[legScale, 1, legScale]}>
                    <mesh position={[0, -0.35, 0]}>
                        <cylinderGeometry args={[0.11 * (1 + fatFactor * 0.008), 0.09, 0.7, 16]} />
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

                {/* Right Leg */}
                <group position={[-0.15 * waistScale, -0.1, 0]} rotation={[0, 0, -0.25]} scale={[legScale, 1, legScale]}>
                    <mesh position={[0, -0.35, 0]}>
                        <cylinderGeometry args={[0.11 * (1 + fatFactor * 0.008), 0.09, 0.7, 16]} />
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

const AvatarScene = ({ muscleStats = { chest: 1, arms: 1, legs: 1, abs: 1 }, bodyStats }) => {
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
                        <AvatarBody muscleStats={muscleStats} bodyStats={bodyStats} />
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
