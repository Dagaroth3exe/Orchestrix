"use client";

import { Suspense, useEffect, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, RoundedBox, useTexture } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { RecordItem } from "@/lib/records";
import {
  badgeTexture,
  brushedTexture,
  feltTexture,
  grooveBump,
  grooveTexture,
  legendTexture,
  walnutTexture,
} from "./textures";

/* ═══════════════════════════ public API ═══════════════════════════ */

export type SceneHandle = {
  /** Crate → platter: pull sleeve, extract vinyl, fly, seat on spindle, swing arm to the lead-in groove. */
  load: (i: number, onSeated?: () => void) => Promise<void>;
  /** Arm to rest, wait for the platter to stop, lift the vinyl and return it to its sleeve. Needle must be up. */
  unload: () => Promise<void>;
  lowerNeedle: () => Promise<void>;
  raiseNeedle: () => Promise<void>;
  setSpinning: (on: boolean) => void;
  /** 0–1 position through the side; the tonearm tracks inward. */
  setProgress: (p: number) => void;
};

type Props = {
  records: RecordItem[];
  apiRef: Ref<SceneHandle>;
  playing: boolean;
  onHover: (i: number | null) => void;
  onPick: (i: number) => void;
  onReady?: () => void;
};

/* ═══════════════════════════ dimensions (scene units ≈ 1 = 14 cm) ═══════════════════════════ */

const DECK_Y = 0.3;
const PLINTH = { x: -1.55, z: 0, w: 3.9, d: 3.0, h: DECK_Y };
const C = new THREE.Vector3(-2.05, 0, 0.05); // spindle axis (x, z)
const PLATTER_R = 1.13;
const PLATTER_H = 0.09;
const MAT_TOP = DECK_Y + PLATTER_H + 0.012;
const VINYL_R = 1.06;
const HOLE_R = 0.028;
const VINYL_T = 0.016;
const BEVEL = 0.003;
const LABEL_R = 0.36;
const PIVOT = new THREE.Vector3(-0.08, DECK_Y, -0.95);
const ARM_H = 0.52; // tonearm bearing height
const ARM_L = 1.85;
const STYLUS_Y = MAT_TOP + VINYL_T + BEVEL * 2; // stylus touches the vinyl surface here
const STYLUS_DROP = ARM_H - STYLUS_Y;
const ARM_UP = -0.06; // pitch when the stylus is raised (radians)
const ARM_REST = 0;
const CRATE = { x: 2.05, z: 0.15, w: 1.78, d: 2.46, h: 0.72, floor: 0.06 };
const SLEEVE = 2.2;
const SLEEVE_T = 0.034;
const STAND_TILT = -0.06; // records lean gently against each other
const STAND_YAW = -Math.PI / 2; // stored sideways: spines face the viewer
const RPM_33 = (33.333 / 60) * Math.PI * 2; // rad/s

// tonearm angles: where the stylus meets the lead-in groove and where it nears the label
function armAngleFor(radius: number) {
  for (let a = 0; a > -1.6; a -= 0.0015) {
    const x = PIVOT.x + ARM_L * Math.sin(a);
    const z = PIVOT.z + ARM_L * Math.cos(a);
    if (Math.hypot(x - C.x, z - C.z) <= radius) return a;
  }
  return -0.5;
}
const ARM_CUE = armAngleFor(VINYL_R * 0.94);
const ARM_END = armAngleFor(LABEL_R + 0.14);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// keep the choreography on real time even if a slow device drops frames (stays in sync with the audio)
gsap.ticker.lagSmoothing(0);

/* ═══════════════════════════ shared materials ═══════════════════════════ */

function useMaterials() {
  return useMemo(() => {
    const walnut = walnutTexture();
    const crateWood = walnutTexture("#5b3d27", "#7a5638");
    const brushed = brushedTexture();
    const grooves = grooveTexture();
    const bump = grooveBump();
    // the extruded disc's UVs are its own XY coordinates (−R…R) → map onto 0…1
    for (const t of [grooves, bump]) {
      t.repeat.set(1 / (VINYL_R * 2), 1 / (VINYL_R * 2));
      t.offset.set(0.5, 0.5);
    }
    return {
      walnut: new THREE.MeshStandardMaterial({ map: walnut, color: "#9b7a63", roughness: 0.52, metalness: 0 }),
      crate: new THREE.MeshStandardMaterial({ map: crateWood, color: "#b08a6c", roughness: 0.62 }),
      deck: new THREE.MeshStandardMaterial({ color: "#121212", roughness: 0.42, metalness: 0.35 }),
      table: new THREE.MeshStandardMaterial({ map: walnutTexture("#1b130d", "#2a1d14"), color: "#6b5546", roughness: 0.8 }),
      aluminium: new THREE.MeshStandardMaterial({ map: brushed, color: "#d8d8da", roughness: 0.32, metalness: 0.92 }),
      chrome: new THREE.MeshStandardMaterial({ color: "#e8e8ea", roughness: 0.12, metalness: 1 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: "#2b2b2e", roughness: 0.35, metalness: 0.8 }),
      felt: new THREE.MeshStandardMaterial({ map: feltTexture(), roughness: 0.95 }),
      rubber: new THREE.MeshStandardMaterial({ color: "#0d0d0d", roughness: 0.85 }),
      vinylFace: new THREE.MeshPhysicalMaterial({
        map: grooves,
        bumpMap: bump,
        bumpScale: 0.35,
        roughness: 0.38,
        metalness: 0,
        clearcoat: 0.55,
        clearcoatRoughness: 0.32,
        color: "#ffffff",
      }),
      vinylEdge: new THREE.MeshStandardMaterial({ color: "#0a0a0b", roughness: 0.3 }),
      cardboard: new THREE.MeshStandardMaterial({ color: "#2b241f", roughness: 0.9 }),
      gold: new THREE.MeshStandardMaterial({ color: "#c9a45c", roughness: 0.3, metalness: 0.9 }),
      badge: new THREE.MeshStandardMaterial({ map: badgeTexture(), roughness: 0.35, metalness: 0.7 }),
    };
  }, []);
}
type Mats = ReturnType<typeof useMaterials>;

/* ═══════════════════════════ geometry ═══════════════════════════ */

function useVinylGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, VINYL_R, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, HOLE_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: VINYL_T,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 2,
      curveSegments: 128,
    });
    g.translate(0, 0, BEVEL); // bottom face sits on z = 0
    return g;
  }, []);
}

/** A 12" record in its own space: centre at the origin, face pointing +Z, bottom at z = 0. */
function Vinyl({ cover, accent, mats, geometry }: { cover: THREE.Texture; accent: string; mats: Mats; geometry: THREE.BufferGeometry }) {
  const labelMats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6 });
    const face = new THREE.MeshStandardMaterial({ map: cover, roughness: 0.62 });
    return [side, face, face];
  }, [cover, accent]);
  const top = VINYL_T + BEVEL * 2;
  return (
    <group>
      <mesh geometry={geometry} material={[mats.vinylFace, mats.vinylEdge]} castShadow receiveShadow />
      {[top + 0.0012, -0.0012].map((z, k) => (
        <mesh key={k} position={[0, 0, z]} rotation={[k ? -Math.PI / 2 : Math.PI / 2, 0, 0]} material={labelMats}>
          <cylinderGeometry args={[LABEL_R, LABEL_R, 0.0018, 64]} />
        </mesh>
      ))}
      {/* the centre hole's lining */}
      <mesh position={[0, 0, top / 2]} rotation={[Math.PI / 2, 0, 0]} material={mats.vinylEdge}>
        <cylinderGeometry args={[HOLE_R + 0.004, HOLE_R + 0.004, top + 0.004, 24, 1, true]} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════ turntable ═══════════════════════════ */

function Turntable({ mats, playing, platterRef }: { mats: Mats; playing: boolean; platterRef: React.RefObject<THREE.Group | null> }) {
  const legendStart = useMemo(() => legendTexture("START · STOP"), []);
  const legendSpeed = useMemo(() => legendTexture("33   45"), []);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dt) => {
    const m = led.current;
    if (!m) return;
    const target = playing ? 2.4 : 0.05;
    m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 4);
  });

  const px = PLINTH.x;
  return (
    <group>
      {/* walnut plinth with rounded, bevelled edges */}
      <RoundedBox args={[PLINTH.w, PLINTH.h, PLINTH.d]} radius={0.06} smoothness={5} position={[px, PLINTH.h / 2, PLINTH.z]} material={mats.walnut} castShadow receiveShadow />
      {/* matte black deck plate */}
      <RoundedBox args={[PLINTH.w - 0.16, 0.012, PLINTH.d - 0.16]} radius={0.004} smoothness={2} position={[px, DECK_Y + 0.006, PLINTH.z]} material={mats.deck} receiveShadow />
      {/* feet */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], k) => (
        <mesh key={k} position={[px + sx * (PLINTH.w / 2 - 0.3), -0.035, sz * (PLINTH.d / 2 - 0.3)]} material={mats.rubber} castShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.07, 32]} />
        </mesh>
      ))}
      {/* dust-cover hinges */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.32, 0.08, 0.1]} radius={0.02} position={[px + s * 1.2, DECK_Y + 0.02, -PLINTH.d / 2 + 0.02]} material={mats.darkMetal} castShadow />
      ))}

      {/* platter (rotates) */}
      <group ref={platterRef} position={[C.x, DECK_Y + 0.012, C.z]}>
        <mesh position={[0, PLATTER_H / 2, 0]} material={mats.aluminium} castShadow receiveShadow>
          <cylinderGeometry args={[PLATTER_R, PLATTER_R * 0.985, PLATTER_H, 128]} />
        </mesh>
        {/* strobe dots on the rim */}
        {Array.from({ length: 72 }).map((_, k) => {
          const a = (k / 72) * Math.PI * 2;
          return (
            <mesh key={k} position={[Math.cos(a) * (PLATTER_R + 0.001), PLATTER_H * 0.55, Math.sin(a) * (PLATTER_R + 0.001)]} rotation={[0, -a, 0]} material={mats.darkMetal}>
              <boxGeometry args={[0.004, 0.018, 0.022]} />
            </mesh>
          );
        })}
        {/* felt mat */}
        <mesh position={[0, PLATTER_H + 0.006, 0]} material={mats.felt} receiveShadow>
          <cylinderGeometry args={[PLATTER_R - 0.03, PLATTER_R - 0.03, 0.012, 96]} />
        </mesh>
      </group>
      {/* spindle */}
      <mesh position={[C.x, MAT_TOP + 0.05, C.z]} material={mats.chrome} castShadow>
        <cylinderGeometry args={[HOLE_R * 0.9, HOLE_R * 0.9, 0.1, 24]} />
      </mesh>
      <mesh position={[C.x, MAT_TOP + 0.1, C.z]} material={mats.chrome}>
        <sphereGeometry args={[HOLE_R * 0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* engraved brass badge */}
      <mesh position={[px - 1.15, DECK_Y + 0.013, -1.22]} rotation={[-Math.PI / 2, 0, 0]} material={mats.badge}>
        <planeGeometry args={[1.0, 0.19]} />
      </mesh>

      {/* start/stop button */}
      <mesh position={[px - 1.55, DECK_Y + 0.03, 1.18]} material={mats.darkMetal} castShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.04, 40]} />
      </mesh>
      <mesh position={[px - 1.55, DECK_Y + 0.052, 1.18]} material={mats.aluminium}>
        <cylinderGeometry args={[0.12, 0.12, 0.006, 40]} />
      </mesh>
      <mesh position={[px - 1.55, DECK_Y + 0.013, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.15]} />
        <meshBasicMaterial map={legendStart} transparent toneMapped={false} />
      </mesh>
      {/* 33 / 45 */}
      {[0, 1].map((k) => (
        <RoundedBox key={k} args={[0.16, 0.035, 0.11]} radius={0.012} position={[px - 0.98 + k * 0.22, DECK_Y + 0.03, 1.2]} material={k === 0 ? mats.aluminium : mats.darkMetal} castShadow />
      ))}
      <mesh position={[px - 0.87, DECK_Y + 0.013, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.125]} />
        <meshBasicMaterial map={legendSpeed} transparent toneMapped={false} />
      </mesh>
      {/* pitch slider */}
      <mesh position={[px + 1.62, DECK_Y + 0.013, 0.35]} material={mats.rubber}>
        <boxGeometry args={[0.05, 0.004, 0.9]} />
      </mesh>
      <RoundedBox args={[0.14, 0.05, 0.08]} radius={0.015} position={[px + 1.62, DECK_Y + 0.035, 0.35]} material={mats.aluminium} castShadow />
      {/* power LED */}
      <mesh position={[px + 1.62, DECK_Y + 0.025, 1.22]}>
        <sphereGeometry args={[0.03, 16, 12]} />
        <meshStandardMaterial ref={led} color="#3a2a12" emissive="#ffb84a" emissiveIntensity={0.05} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Tonearm({ mats, yawRef, pitchRef }: { mats: Mats; yawRef: React.RefObject<THREE.Group | null>; pitchRef: React.RefObject<THREE.Group | null> }) {
  const postH = ARM_H - DECK_Y;
  return (
    <group>
      {/* bearing base */}
      <mesh position={[PIVOT.x, DECK_Y + 0.03, PIVOT.z]} material={mats.darkMetal} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.26, 0.06, 48]} />
      </mesh>
      <mesh position={[PIVOT.x, DECK_Y + postH / 2, PIVOT.z]} material={mats.chrome} castShadow>
        <cylinderGeometry args={[0.05, 0.055, postH, 24]} />
      </mesh>
      {/* arm rest */}
      <mesh position={[PIVOT.x, DECK_Y + (ARM_H - DECK_Y - 0.03) / 2, PIVOT.z + ARM_L * 0.74]} material={mats.darkMetal} castShadow>
        <cylinderGeometry args={[0.025, 0.03, ARM_H - DECK_Y - 0.03, 16]} />
      </mesh>
      <mesh position={[PIVOT.x, ARM_H - 0.03, PIVOT.z + ARM_L * 0.74]} rotation={[0, 0, Math.PI / 2]} material={mats.rubber}>
        <torusGeometry args={[0.035, 0.012, 8, 16, Math.PI]} />
      </mesh>

      {/* the moving part: yaw (swing) → pitch (lift) */}
      <group ref={yawRef} position={[PIVOT.x, ARM_H, PIVOT.z]} rotation={[0, ARM_REST, 0]}>
        {/* gimbal */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.chrome} castShadow>
          <torusGeometry args={[0.075, 0.018, 12, 32]} />
        </mesh>
        <group ref={pitchRef} rotation={[ARM_UP, 0, 0]}>
          {/* tube */}
          <mesh position={[0, 0, ARM_L / 2 - 0.06]} rotation={[Math.PI / 2, 0, 0]} material={mats.aluminium} castShadow>
            <cylinderGeometry args={[0.019, 0.019, ARM_L - 0.12, 20]} />
          </mesh>
          {/* counterweight */}
          <mesh position={[0, 0, -0.36]} rotation={[Math.PI / 2, 0, 0]} material={mats.darkMetal} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.18, 32]} />
          </mesh>
          <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]} material={mats.chrome}>
            <cylinderGeometry args={[0.022, 0.022, 0.2, 12]} />
          </mesh>
          {/* headshell */}
          <group position={[0, 0, ARM_L - 0.06]}>
            <RoundedBox args={[0.13, 0.022, 0.26]} radius={0.008} position={[0.02, -0.01, 0.06]} rotation={[0, 0.22, 0]} material={mats.darkMetal} castShadow />
            {/* finger lift */}
            <mesh position={[0.1, 0, 0.14]} rotation={[0, 0, Math.PI / 2]} material={mats.chrome}>
              <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
            </mesh>
            {/* cartridge */}
            <RoundedBox args={[0.075, STYLUS_DROP - 0.03, 0.12]} radius={0.01} position={[0, -(STYLUS_DROP - 0.03) / 2 - 0.02, 0.06]} material={mats.gold} castShadow />
            {/* stylus */}
            <mesh position={[0, -STYLUS_DROP + 0.006, 0.06]} rotation={[Math.PI, 0, 0]} material={mats.chrome}>
              <coneGeometry args={[0.006, 0.014, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function Crate({ mats }: { mats: Mats }) {
  const { x, z, w, d, h } = CRATE;
  const t = 0.07;
  return (
    <group>
      <mesh position={[x, CRATE.floor / 2, z]} material={mats.crate} castShadow receiveShadow>
        <boxGeometry args={[w, CRATE.floor, d]} />
      </mesh>
      {/* sides */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[t, h, d]} radius={0.015} position={[x + (s * (w - t)) / 2, h / 2, z]} material={mats.crate} castShadow receiveShadow />
      ))}
      {/* back (taller) and low front, so the records stay visible */}
      <RoundedBox args={[w, h * 1.08, t]} radius={0.015} position={[x, (h * 1.08) / 2, z - (d - t) / 2]} material={mats.crate} castShadow receiveShadow />
      <RoundedBox args={[w, h * 0.62, t]} radius={0.015} position={[x, (h * 0.62) / 2, z + (d - t) / 2]} material={mats.crate} castShadow receiveShadow />
      {/* hand-hole in the front panel */}
      <mesh position={[x, h * 0.42, z + d / 2 + 0.001]} material={mats.rubber}>
        <planeGeometry args={[0.5, 0.1]} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════ sleeves ═══════════════════════════ */

const slotX = (i: number, n: number) => CRATE.x - 0.62 + (n > 1 ? (i * 1.24) / (n - 1) : 0);

function Sleeve({
  rec, index, n, cover, mats, groupRef, vinylRef, onOver, onOut, onPick,
}: {
  rec: RecordItem;
  index: number;
  n: number;
  cover: THREE.Texture;
  mats: Mats;
  groupRef: (g: THREE.Group | null) => void;
  vinylRef: (g: THREE.Group | null) => void;
  onOver: (i: number) => void;
  onOut: (i: number) => void;
  onPick: (i: number) => void;
}) {
  const faces = useMemo(() => {
    const front = new THREE.MeshStandardMaterial({ map: cover, roughness: 0.55 });
    const back = new THREE.MeshStandardMaterial({ map: cover, color: "#6f6a64", roughness: 0.7 });
    const spine = new THREE.MeshStandardMaterial({ color: new THREE.Color(rec.label).multiplyScalar(0.55), roughness: 0.7 });
    // box face order: +x (spine, faces the viewer when stored), −x, +y, −y, +z (front cover), −z (back cover)
    return [spine, mats.cardboard, mats.cardboard, mats.cardboard, front, back];
  }, [cover, mats.cardboard, rec.label]);
  const peek = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0c0c0d", roughness: 0.35 }), []);
  const labelPeek = useMemo(() => new THREE.MeshStandardMaterial({ color: rec.label, roughness: 0.6 }), [rec.label]);

  const zone = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), []);
  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onOver(index); },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onOut(index); },
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPick(index); },
  };
  return (
    <>
    {/* invisible, fixed hover zone at the record's slot */}
    <mesh position={[slotX(index, n), CRATE.floor + SLEEVE / 2, CRATE.z]} rotation={new THREE.Euler(STAND_TILT, STAND_YAW, 0, "YXZ")} material={zone} {...handlers}>
      <boxGeometry args={[SLEEVE, SLEEVE, 0.2]} />
    </mesh>
    <group
      ref={(g) => {
        if (g) g.rotation.order = "YXZ";
        groupRef(g);
      }}
      position={[slotX(index, n), CRATE.floor, CRATE.z]}
      rotation={new THREE.Euler(STAND_TILT, STAND_YAW, 0, "YXZ")}
      {...handlers}
    >
      <mesh position={[0, SLEEVE / 2, 0]} material={faces} castShadow receiveShadow>
        <boxGeometry args={[SLEEVE, SLEEVE, SLEEVE_T]} />
      </mesh>
      {/* the record inside, its edge peeking out of the top of the sleeve */}
      <group ref={vinylRef}>
        <mesh position={[0, SLEEVE / 2 + 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={peek} castShadow>
          <cylinderGeometry args={[VINYL_R, VINYL_R, VINYL_T * 0.9, 96]} />
        </mesh>
        <mesh position={[0, SLEEVE / 2 + 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={labelPeek}>
          <cylinderGeometry args={[LABEL_R, LABEL_R, VINYL_T, 48]} />
        </mesh>
      </group>
    </group>
    </>
  );
}

/* ═══════════════════════════ camera ═══════════════════════════ */

const TARGET = new THREE.Vector3(-0.1, 0.7, 0.25);
const ELEVATION = 0.58; // ~33°

function CameraRig() {
  const { camera, size, controls } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const dist = Math.max(8.2, 15.4 / aspect);
    camera.position.set(TARGET.x + 0.6, TARGET.y + Math.sin(ELEVATION) * dist, TARGET.z + Math.cos(ELEVATION) * dist);
    camera.lookAt(TARGET);
    (controls as unknown as { update?: () => void } | null)?.update?.();
  }, [camera, size.width, size.height, controls]);
  return null;
}

/* ═══════════════════════════ the world ═══════════════════════════ */

function World({ records, apiRef, playing, onHover, onPick, onReady }: Props) {
  const mats = useMaterials();
  const vinylGeometry = useVinylGeometry();
  const covers = useTexture(records.map((r) => r.cover)) as THREE.Texture[];
  useMemo(() => covers.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }), [covers]);
  const { camera } = useThree();

  const platterRef = useRef<THREE.Group>(null);
  const yawRef = useRef<THREE.Group>(null);
  const pitchRef = useRef<THREE.Group>(null);
  const flyRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const sleeves = useRef<(THREE.Group | null)[]>([]);
  const sleeveVinyls = useRef<(THREE.Group | null)[]>([]);
  const flyIndex = useRef<number | null>(null);
  const flyMeshes = useRef<(THREE.Group | null)[]>([]);
  const locked = useRef(new Set<number>());
  const vel = useRef(0);
  const targetVel = useRef(0);

  useEffect(() => { onReady?.(); }, [onReady]);

  /* platter physics — spins up and coasts down; record turns with it, clockwise at 33⅓ */
  useFrame((_, dt) => {
    const d = Math.min(0.05, dt);
    const k = targetVel.current > vel.current ? 1.8 : 0.9;
    vel.current += (targetVel.current - vel.current) * Math.min(1, d * k);
    if (Math.abs(vel.current) < 1e-3) return;
    if (platterRef.current) platterRef.current.rotation.y -= vel.current * d;
    if (spinRef.current) spinRef.current.rotation.z -= vel.current * d;
  });

  /* poses */
  const n = records.length;
  const standPose = (i: number) => ({
    pos: new THREE.Vector3(slotX(i, n), CRATE.floor, CRATE.z),
    rot: new THREE.Euler(STAND_TILT, STAND_YAW, 0, "YXZ"),
  });
  /** Slid out along its own plane (parallel to its neighbours) until it clears the crate — no rotation yet. */
  const clearPose = (i: number) => ({
    pos: new THREE.Vector3(slotX(i, n), CRATE.floor + 0.55, CRATE.z + CRATE.d / 2 + SLEEVE / 2 + 0.25),
    rot: new THREE.Euler(STAND_TILT, STAND_YAW, 0, "YXZ"),
  });
  /** Out of the crate and turned towards the viewer so the artwork reads clearly. */
  const pulledPose = (i: number) => {
    const base = new THREE.Vector3(slotX(i, n) - 0.2, CRATE.floor + 0.9, 0);
    const centre = base.clone().add(new THREE.Vector3(0, SLEEVE / 2, CRATE.z + CRATE.d / 2));
    const dir = camera.position.clone().sub(centre);
    const yaw = Math.atan2(dir.x, dir.z) * 0.9;
    const pitch = -Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) * 0.75;
    // it leans back as it faces you: stand it far enough forward that its top clears the records behind
    const lean = SLEEVE * Math.sin(Math.abs(pitch));
    const rowFront = CRATE.z + SLEEVE / 2 + SLEEVE * Math.sin(Math.abs(STAND_TILT));
    base.z = rowFront + lean + 0.15;
    return { pos: base, rot: new THREE.Euler(pitch, yaw, 0, "YXZ") };
  };
  const sleeveTl = useRef<(gsap.core.Timeline | null)[]>([]);
  /** Pull a sleeve out: slide in-plane until clear, then turn to face the viewer. */
  const moveOut = (i: number, speed = 1) => {
    const g = sleeves.current[i];
    if (!g) return Promise.resolve();
    sleeveTl.current[i]?.kill();
    const clear = clearPose(i);
    const pulled = pulledPose(i);
    const tl = gsap.timeline();
    // if it's still (partly) in the crate, finish turning back to sideways before sliding
    tl.to(g.rotation, { x: clear.rot.x, y: clear.rot.y, z: 0, duration: 0.25 * speed, ease: "power1.out" }, 0);
    tl.to(g.position, { x: clear.pos.x, y: clear.pos.y, z: clear.pos.z, duration: 0.7 * speed, ease: "power2.inOut" }, 0);
    tl.to(g.rotation, { x: pulled.rot.x, y: pulled.rot.y, z: 0, duration: 0.55 * speed, ease: "power2.inOut" }, ">");
    tl.to(g.position, { x: pulled.pos.x, y: pulled.pos.y, z: pulled.pos.z, duration: 0.5 * speed, ease: "power2.out" }, ">-0.1");
    sleeveTl.current[i] = tl;
    return tl.then(() => undefined);
  };
  /** Put a sleeve back: turn to sideways while still clear of the crate, then slide home in-plane. */
  const moveIn = (i: number, speed = 1) => {
    const g = sleeves.current[i];
    if (!g) return Promise.resolve();
    sleeveTl.current[i]?.kill();
    const clear = clearPose(i);
    const stand = standPose(i);
    const outside = g.position.z > CRATE.z + CRATE.d / 2 + 0.1;
    const tl = gsap.timeline();
    if (outside) {
      tl.to(g.position, { x: clear.pos.x, y: clear.pos.y, z: clear.pos.z, duration: 0.4 * speed, ease: "power2.inOut" }, 0);
      tl.to(g.rotation, { x: clear.rot.x, y: clear.rot.y, z: 0, duration: 0.45 * speed, ease: "power2.inOut" }, ">");
    } else {
      tl.to(g.rotation, { x: stand.rot.x, y: stand.rot.y, z: 0, duration: 0.25 * speed, ease: "power1.out" }, 0);
    }
    tl.to(g.position, { x: stand.pos.x, y: stand.pos.y, z: stand.pos.z, duration: 0.75 * speed, ease: "power2.inOut" }, ">");
    sleeveTl.current[i] = tl;
    return tl.then(() => undefined);
  };
  const inSleeve = (pose: { pos: THREE.Vector3; rot: THREE.Euler }, upBy = 0) => {
    const dummy = new THREE.Object3D();
    dummy.rotation.order = "YXZ";
    dummy.position.copy(pose.pos);
    dummy.rotation.copy(pose.rot);
    dummy.updateMatrixWorld(true);
    return {
      pos: dummy.localToWorld(new THREE.Vector3(0, SLEEVE / 2 + upBy, -VINYL_T / 2 - 0.004)),
      quat: new THREE.Quaternion().setFromEuler(pose.rot),
    };
  };
  const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

  const showFlyer = (i: number | null) => {
    flyIndex.current = i;
    flyMeshes.current.forEach((m, k) => { if (m) m.visible = k === i; });
    if (flyRef.current) flyRef.current.visible = i !== null;
  };

  /* hover */
  const hoveredRef = useRef<number | null>(null);
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const over = (i: number) => {
    if (outTimer.current) { clearTimeout(outTimer.current); outTimer.current = null; }
    document.body.style.cursor = "pointer";
    if (hoveredRef.current === i) return;
    const prev = hoveredRef.current;
    hoveredRef.current = i;
    onHover(i);
    if (prev !== null && !locked.current.has(prev)) void moveIn(prev);
    if (!locked.current.has(i)) void moveOut(i);
  };
  const out = (i: number) => {
    if (outTimer.current) clearTimeout(outTimer.current);
    outTimer.current = setTimeout(() => {
      if (hoveredRef.current !== i) return;
      hoveredRef.current = null;
      onHover(null);
      document.body.style.cursor = "";
      if (!locked.current.has(i)) void moveIn(i);
    }, 180);
  };
  useEffect(() => () => { document.body.style.cursor = ""; }, []);

  /* the choreography */
  useImperativeHandle(apiRef, () => ({
    async load(i, onSeated) {
      const s = sleeves.current[i];
      const fly = flyRef.current;
      const spin = spinRef.current;
      const yaw = yawRef.current;
      if (!s || !fly || !spin || !yaw) return;
      locked.current.add(i);

      // 1 · slide the sleeve out of the row, then turn it towards you
      const pulled = pulledPose(i);
      await moveOut(i);

      // 2 · draw the vinyl up out of the sleeve
      const start = inSleeve(pulled);
      const above = inSleeve(pulled, SLEEVE * 0.66);
      fly.position.copy(start.pos);
      fly.quaternion.copy(start.quat);
      spin.rotation.z = 0;
      showFlyer(i);
      const sv = sleeveVinyls.current[i];
      if (sv) sv.visible = false;
      await gsap.to(fly.position, { x: above.pos.x, y: above.pos.y, z: above.pos.z, duration: 0.8, ease: "power2.out" });

      // 3 · the empty sleeve slides home while the record arcs over to the turntable, levelling out
      void moveIn(i, 1.1).then(() => locked.current.delete(i));
      const qa = fly.quaternion.clone();
      const p = { t: 0 };
      const hoverY = MAT_TOP + 0.32;
      const tl = gsap.timeline();
      tl.to(fly.position, { x: C.x, z: C.z, duration: 1.45, ease: "power2.inOut" }, 0);
      tl.to(fly.position, { keyframes: { y: [fly.position.y, Math.max(fly.position.y + 0.25, MAT_TOP + 1.25), hoverY] }, duration: 1.45, ease: "none" }, 0);
      tl.to(p, { t: 1, duration: 1.3, ease: "power2.inOut", onUpdate: () => { fly.quaternion.slerpQuaternions(qa, FLAT, p.t); } }, 0.05);
      await tl;

      // 4 · hole over the spindle — lower it gently onto the mat
      await gsap.to(fly.position, { y: MAT_TOP, duration: 0.7, ease: "power2.out" });
      onSeated?.();
      await wait(250);

      // 5 · tonearm swings out to the lead-in groove (stylus still raised)
      await gsap.to(yaw.rotation, { y: ARM_CUE, duration: 1.15, ease: "power2.inOut" });
    },

    async unload() {
      const i = flyIndex.current;
      const fly = flyRef.current;
      const spin = spinRef.current;
      const yaw = yawRef.current;
      if (i === null || !fly || !spin || !yaw) return;
      const s = sleeves.current[i];
      if (!s) return;
      locked.current.add(i);

      // 1 · arm home, platter coasts to a stop
      targetVel.current = 0;
      await gsap.to(yaw.rotation, { y: ARM_REST, duration: 1.05, ease: "power2.inOut" });
      for (let t = 0; t < 40 && vel.current > 0.08; t++) await wait(50);

      // 2 · lift the record off the spindle
      await gsap.to(fly.position, { y: MAT_TOP + 0.4, duration: 0.55, ease: "power2.out" });

      // 3 · its sleeve comes out; the record flies back above it, turning to match
      const pulled = pulledPose(i);
      const pullTween = moveOut(i);
      const above = inSleeve(pulled, SLEEVE * 0.66);
      const inside = inSleeve(pulled);
      const qa = fly.quaternion.clone();
      const p = { t: 0 };
      const tl = gsap.timeline();
      tl.to(fly.position, { x: above.pos.x, z: above.pos.z, duration: 1.4, ease: "power2.inOut" }, 0);
      tl.to(fly.position, { keyframes: { y: [fly.position.y, MAT_TOP + 1.3, above.pos.y] }, duration: 1.4, ease: "none" }, 0);
      tl.to(p, { t: 1, duration: 1.3, ease: "power2.inOut", onUpdate: () => { fly.quaternion.slerpQuaternions(qa, above.quat, p.t); } }, 0.05);
      tl.to(spin.rotation, { z: Math.round(spin.rotation.z / (Math.PI * 2)) * Math.PI * 2, duration: 1.3, ease: "power2.inOut" }, 0);
      await Promise.all([tl, pullTween]);

      // 4 · slide it down into the sleeve, then the sleeve settles back into the crate
      await gsap.to(fly.position, { x: inside.pos.x, y: inside.pos.y, z: inside.pos.z, duration: 0.7, ease: "power2.inOut" });
      const sv = sleeveVinyls.current[i];
      if (sv) sv.visible = true;
      showFlyer(null);
      await moveIn(i, 1.1);
      locked.current.delete(i);
    },

    async lowerNeedle() {
      if (!pitchRef.current) return;
      await gsap.to(pitchRef.current.rotation, { x: 0, duration: 0.6, ease: "power2.in" });
    },
    async raiseNeedle() {
      if (!pitchRef.current) return;
      await gsap.to(pitchRef.current.rotation, { x: ARM_UP, duration: 0.35, ease: "power2.out" });
    },
    setSpinning(on) {
      targetVel.current = on ? RPM_33 : 0;
    },
    setProgress(p) {
      if (!yawRef.current) return;
      gsap.to(yawRef.current.rotation, { y: ARM_CUE + (ARM_END - ARM_CUE) * Math.min(1, Math.max(0, p)), duration: 0.9, ease: "none", overwrite: "auto" });
    },
  }));

  return (
    <>
      {/* desk surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} material={mats.table} receiveShadow>
        <planeGeometry args={[30, 18]} />
      </mesh>

      <Turntable mats={mats} playing={playing} platterRef={platterRef} />
      <Tonearm mats={mats} yawRef={yawRef} pitchRef={pitchRef} />
      <Crate mats={mats} />

      {records.map((rec, i) => (
        <Sleeve
          key={rec.id}
          rec={rec}
          index={i}
          n={n}
          cover={covers[i]}
          mats={mats}
          groupRef={(g) => { sleeves.current[i] = g; }}
          vinylRef={(m) => { sleeveVinyls.current[i] = m; }}
          onOver={over}
          onOut={out}
          onPick={onPick}
        />
      ))}

      {/* the record in the hand / on the platter */}
      <group ref={flyRef} visible={false}>
        <group ref={spinRef}>
          {records.map((rec, i) => (
            <group key={rec.id} ref={(g) => { flyMeshes.current[i] = g; }} visible={false}>
              <Vinyl cover={covers[i]} accent={rec.label} mats={mats} geometry={vinylGeometry} />
            </group>
          ))}
        </group>
      </group>
    </>
  );
}

/* ═══════════════════════════ canvas ═══════════════════════════ */

export default function TurntableScene(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 80, position: [0.7, 5, 8.4] }}
      onCreated={({ gl }) => { gl.toneMappingExposure = 1.2; }}
    >
      {/* warm, cinematic room light */}
      <ambientLight intensity={0.32} color="#ffe8cc" />
      <directionalLight
        position={[3.5, 7.5, 4.5]}
        intensity={2.7}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <spotLight position={[-6, 4, -4]} angle={0.5} penumbra={1} intensity={9} color="#a9b8d6" distance={20} />
      <pointLight position={[3, 2.2, 3]} intensity={4} color="#d9b46c" distance={9} />
      <pointLight position={[-2.2, 2.6, 2.4]} intensity={2.5} color="#ffd9a8" distance={7} />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.2} color="#fff1dc" position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#c9a45c" position={[-6, 2, 3]} rotation={[0, Math.PI / 2, 0]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={0.35} color="#9ab4dc" position={[6, 2, -3]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 3, 1]} />
      </Environment>

      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>

      <OrbitControls
        makeDefault
        target={TARGET}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.35}
        minPolarAngle={Math.PI / 2 - ELEVATION - 0.18}
        maxPolarAngle={Math.PI / 2 - ELEVATION + 0.12}
        minAzimuthAngle={-0.35}
        maxAzimuthAngle={0.45}
      />
      <CameraRig />
    </Canvas>
  );
}

