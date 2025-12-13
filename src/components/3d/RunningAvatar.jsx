/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';

const BodyPart = ({ position, rotation, scale, color, children, forwardRef }) => {
    return (
        <group ref={forwardRef} position={position} rotation={rotation} scale={scale}>
            <mesh castShadow receiveShadow>
                {children}
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
            </mesh>
        </group>
    );
};

const RunningAvatar = ({ muscleStats, bodyStats }) => {
    // Refs for animation
    const groupRef = useRef();
    const leftArmRef = useRef();
    const rightArmRef = useRef();
    const leftLegRef = useRef();
    const rightLegRef = useRef();
    const bodyRef = useRef();

    // Default stats if undefined
    const s = useMemo(() => ({
        chest: Math.max(Number(muscleStats?.chest) || 1, 1),
        arms: Math.max(Number(muscleStats?.arms) || 1, 1),
        legs: Math.max(Number(muscleStats?.legs) || 1, 1),
        abs: Math.max(Number(muscleStats?.abs) || 1, 1),
        shoulders: Math.max(Number(muscleStats?.shoulders) || 1, 1),
        back: Math.max(Number(muscleStats?.back) || 1, 1),
    }), [muscleStats]);

    // Body Stats Logic
    const heightVal = Number(bodyStats?.height) || 170;
    const fatVal = Number(bodyStats?.bodyFat) || 15;

    // Height Scaling (170cm = 1.0)
    const heightScale = heightVal / 170;

    // Fat Scaling (15% = 1.0)
    const fatFactor = Math.max(0, fatVal - 15);
    const waistScale = 1 + (fatFactor * 0.015);
    const bellyBulge = 1 + (fatFactor * 0.02);

    const baseColor = "#1e3a8a"; // Dark Blue Sportswear
    const skinColor = "#e0ac69"; // Natural Skin Tone
    const SkinMaterial = <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0.1} />;

    // Muscle Growth Logic (Simplified from AvatarScene)
    const chestScale = 1 + (s.chest - 1) * 0.2;
    const armScale = 1 + (s.arms - 1) * 0.2;
    const legScale = 1 + (s.legs - 1) * 0.2;
    const shoulderScale = 1 + (s.shoulders - 1) * 0.25;
    const latSpread = 1 + (s.back - 1) * 0.3;
    const trapSize = 1 + (s.back - 1) * 0.15;
    const coreStrength = (1 + (s.abs - 1) * 0.15);

    // Animation Loop
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime() * 10; // Speed of running

        // Arms Swing (Opposite to legs)
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t) * 0.8;
        if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t + Math.PI) * 0.8;

        // Legs Move
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.8;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t) * 0.8;

        // Body Bouncing
        if (bodyRef.current) {
            bodyRef.current.position.y = -0.2 + Math.abs(Math.cos(t)) * 0.1;
            // Slight rotation for dynamic feel
            bodyRef.current.rotation.z = Math.sin(t) * 0.05;
        }
    });

    return (
        <group ref={groupRef} scale={[heightScale, heightScale, heightScale]}>
            {/* Bouncing Group */}
            <group ref={bodyRef} position={[0, -0.2, 0]}>

                {/* --- HEAD & NECK --- */}
                <group position={[0, 1.75, 0]}>
                    <mesh castShadow receiveShadow>
                        <sphereGeometry args={[0.22 * (1 + (fatFactor * 0.005)), 32, 32]} />
                        {SkinMaterial}
                    </mesh>
                    {/* Hair - Simplified */}
                    <mesh position={[0, 0.1, 0]}>
                        <sphereGeometry args={[0.24, 32, 32]} />
                        <meshStandardMaterial color="#2d2a26" roughness={0.8} />
                    </mesh>
                    {/* Neck */}
                    <mesh position={[0, -0.22, 0]} scale={[1, trapSize, 1]}>
                        <cylinderGeometry args={[0.09, 0.11, 0.2, 16]} />
                        {SkinMaterial}
                    </mesh>
                </group>

                {/* --- TORSO --- */}
                <group position={[0, 1.1, 0]}>
                    {/* Chest */}
                    <mesh position={[0, 0.15, 0]} scale={[latSpread, 1, chestScale]}>
                        <cylinderGeometry args={[0.28, 0.18, 0.45, 16]} />
                        <meshStandardMaterial color={baseColor} />
                    </mesh>
                    {/* Abs */}
                    <mesh position={[0, -0.25, 0]} scale={[waistScale, 1, bellyBulge * coreStrength]}>
                        <cylinderGeometry args={[0.17, 0.16, 0.35, 16]} />
                        <meshStandardMaterial color={baseColor} />
                    </mesh>
                </group>

                {/* --- ARMS --- */}
                <group position={[0, 1.35, 0]}>
                    {/* Left Arm Group */}
                    <group position={[0.32 * latSpread, 0, 0]}>
                        <mesh scale={[shoulderScale, shoulderScale, shoulderScale]}>
                            <sphereGeometry args={[0.14, 16, 16]} />
                            {SkinMaterial}
                        </mesh>
                        {/* Pivot Point for Arm Swing */}
                        <group ref={leftArmRef} position={[0, 0, 0]}>
                            <group position={[0.05, -0.25, 0]} rotation={[0, 0, 0.2]} scale={[armScale, 1, armScale]}>
                                <mesh>
                                    <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
                                    {SkinMaterial}
                                </mesh>
                                {/* Forearm */}
                                <mesh position={[0, -0.4, 0.2]} rotation={[0.5, 0, 0]}>
                                    <cylinderGeometry args={[0.075, 0.06, 0.5, 16]} />
                                    {SkinMaterial}
                                </mesh>
                            </group>
                        </group>
                    </group>

                    {/* Right Arm Group */}
                    <group position={[-0.32 * latSpread, 0, 0]}>
                        <mesh scale={[shoulderScale, shoulderScale, shoulderScale]}>
                            <sphereGeometry args={[0.14, 16, 16]} />
                            {SkinMaterial}
                        </mesh>
                        {/* Pivot Point */}
                        <group ref={rightArmRef} position={[0, 0, 0]}>
                            <group position={[-0.05, -0.25, 0]} rotation={[0, 0, -0.2]} scale={[armScale, 1, armScale]}>
                                <mesh>
                                    <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
                                    {SkinMaterial}
                                </mesh>
                                {/* Forearm */}
                                <mesh position={[0, -0.4, 0.2]} rotation={[0.5, 0, 0]}>
                                    <cylinderGeometry args={[0.075, 0.06, 0.5, 16]} />
                                    {SkinMaterial}
                                </mesh>
                            </group>
                        </group>
                    </group>
                </group>

                {/* --- LEGS --- */}
                <group position={[0, 0.7, 0]}>
                    {/* Hips */}
                    <mesh position={[0, 0, 0]} scale={[waistScale, 1, bellyBulge]}>
                        <cylinderGeometry args={[0.16, 0.16, 0.2, 16]} />
                        <meshStandardMaterial color={baseColor} />
                    </mesh>

                    {/* Left Leg */}
                    <group position={[0.15 * waistScale, -0.1, 0]}>
                        <group ref={leftLegRef} position={[0, 0, 0]}>
                            <group position={[0, -0.35, 0]} scale={[legScale, 1, legScale]}>
                                <mesh>
                                    <cylinderGeometry args={[0.11, 0.09, 0.7, 16]} />
                                    <meshStandardMaterial color={baseColor} />
                                </mesh>
                                {/* Lower Leg */}
                                <mesh position={[0, -0.5, -0.1]} rotation={[-0.2, 0, 0]}>
                                    <cylinderGeometry args={[0.085, 0.06, 0.6, 16]} />
                                    {SkinMaterial}
                                </mesh>
                                {/* Foot */}
                                <mesh position={[0, -0.8, 0.1]}>
                                    <boxGeometry args={[0.1, 0.1, 0.25]} />
                                    <meshStandardMaterial color="#333" />
                                </mesh>
                            </group>
                        </group>
                    </group>

                    {/* Right Leg */}
                    <group position={[-0.15 * waistScale, -0.1, 0]}>
                        <group ref={rightLegRef} position={[0, 0, 0]}>
                            <group position={[0, -0.35, 0]} scale={[legScale, 1, legScale]}>
                                <mesh>
                                    <cylinderGeometry args={[0.11, 0.09, 0.7, 16]} />
                                    <meshStandardMaterial color={baseColor} />
                                </mesh>
                                {/* Lower Leg */}
                                <mesh position={[0, -0.5, -0.1]} rotation={[-0.2, 0, 0]}>
                                    <cylinderGeometry args={[0.085, 0.06, 0.6, 16]} />
                                    {SkinMaterial}
                                </mesh>
                                {/* Foot */}
                                <mesh position={[0, -0.8, 0.1]}>
                                    <boxGeometry args={[0.1, 0.1, 0.25]} />
                                    <meshStandardMaterial color="#333" />
                                </mesh>
                            </group>
                        </group>
                    </group>
                </group>

            </group>

            <ContactShadows resolution={512} scale={10} blur={2} opacity={0.4} color="#000000" />
        </group>
    );
};

export default RunningAvatar;
