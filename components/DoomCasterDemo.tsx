'use client';

import React, { useState, useEffect } from 'react';
import { Target, Zap, Swords, Flame, Droplets, Wind, Mountain, Eye, ExternalLink } from 'lucide-react';

interface DemoSpell {
  name: string;
  element: string;
  attack: number;
  ability: string;
}

interface DemoArea {
  name: string;
  immunity: string;
  defense: number;
  ability: string;
}

type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'void';

const DoomCasterDemo = () => {
  // Starting spells following actual game rules
  const spells: DemoSpell[] = [
    { name: 'Conjure Fire', element: 'fire', attack: 5, ability: 'Combo' },
    { name: 'Shape Water', element: 'water', attack: 3, ability: 'Fuse' },
    { name: 'Gather Wind', element: 'wind', attack: 3, ability: 'Combo' },
    { name: 'Raise Earth', element: 'earth', attack: 4, ability: 'Shield' },
    { name: 'Unleash Void', element: 'void', attack: 7, ability: 'Pierce Immunity' }
  ];

  // Area cards from rules
  const areas: DemoArea[] = [
    { name: 'Towering Fortress', immunity: 'none', defense: 40, ability: 'Fortified' },
    { name: 'Crystal Caves', immunity: 'water', defense: 25, ability: 'Reflect' },
    { name: 'Ancient Library', immunity: 'wind', defense: 35, ability: 'Consume Spell' },
    { name: 'Shadow Realm', immunity: 'earth', defense: 45, ability: 'Consume Spell' }
  ];

  const elements = {
    fire: { icon: Flame, color: 'text-orange-300' },
    water: { icon: Droplets, color: 'text-cyan-300' },
    wind: { icon: Wind, color: 'text-emerald-300' },
    earth: { icon: Mountain, color: 'text-amber-300' },
    void: { icon: Eye, color: 'text-violet-300' }
  };

  const [currentDemo, setCurrentDemo] = useState('gameplay');
  const [selectedSpell, setSelectedSpell] = useState<DemoSpell | null>(null);
  const [selectedArea, setSelectedArea] = useState<DemoArea | null>(null);
  const [animationState, setAnimationState] = useState('');
  const [turnCounter, setTurnCounter] = useState(1);
  const [gameState, setGameState] = useState({
    spellsCastThisTurn: 0,
    worldEndRevealed: false
  });

  const [victorySequence, setVictorySequence] = useState({
    totalDamage: 0,
    targetDefense: 80, // Combined Stage 2 defense
    step: 0
  });

  const CardPlaceholder = ({ 
    type, 
    label, 
    element = 'none',
    attack = 0,
    defense = 0,
    ability = '',
    glowing = false,
    casting = false,
    damaged = false,
    onClick
  }: {
    type: string;
    label: string;
    element?: string;
    attack?: number;
    defense?: number;
    ability?: string;
    glowing?: boolean;
    casting?: boolean;
    damaged?: boolean;
    onClick?: () => void;
  }) => {
    const elementData = elements[element as ElementType];
    
    return (
      <div 
        className={`
          relative w-32 h-44 rounded-lg border-4 p-3 cursor-pointer transition-all duration-300 
          bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600
          ${glowing ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 animate-pulse' : ''}
          ${casting ? 'animate-bounce scale-110 border-orange-400' : ''}
          ${damaged ? 'animate-shake border-red-400' : ''}
          hover:scale-105 hover:border-white/70
          pixel-border font-mono text-xs
        `}
        onClick={onClick}
      >
        <div className="text-center pixel-text">
          <div className="font-bold text-white mb-2 text-xs uppercase tracking-wider">{label}</div>
          {elementData?.icon && React.createElement(elementData.icon, { 
            className: `${elementData.color} mx-auto mb-2`, 
            size: 18 
          })}
          
          {type === 'spell' && (
            <div>
              <div className="text-lg font-bold text-yellow-400 pixel-glow">{attack}</div>
              <div className="text-xs text-gray-300 uppercase">{ability}</div>
            </div>
          )}
          
          {type === 'area' && (
            <div>
              <div className="text-lg font-bold text-blue-400 pixel-glow">{defense}</div>
              <div className="text-xs text-gray-300 uppercase">Immune: {element}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const triggerAnimation = (type: string, duration = 2000) => {
    setAnimationState(type);
    setTimeout(() => setAnimationState(''), duration);
  };

  const demoGameplay = () => {
    setCurrentDemo('gameplay');
    setTurnCounter(1);
    setSelectedSpell(null);
    setSelectedArea(null);
    triggerAnimation('game-start');
    
    // Animate turn sequence
    setTimeout(() => {
      setSelectedSpell(spells[0]); // Conjure Fire
      triggerAnimation('spell-select');
    }, 1000);
    
    setTimeout(() => {
      setSelectedArea(areas[0]); // Towering Fortress
      triggerAnimation('target-select');
    }, 2000);
    
    setTimeout(() => {
      triggerAnimation('casting');
    }, 3000);
    
    setTimeout(() => {
      triggerAnimation('damage');
    }, 4000);
    
    setTimeout(() => {
      setTurnCounter(2);
      triggerAnimation('next-turn');
    }, 5000);
  };

  const demoVictory = () => {
    setCurrentDemo('victory');
    setVictorySequence({ totalDamage: 0, targetDefense: 80, step: 0 });
    triggerAnimation('victory-start');
    
    // Victory animation sequence
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 1, totalDamage: 20 }));
      triggerAnimation('spell-combo-1');
    }, 1000);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 2, totalDamage: 45 }));
      triggerAnimation('spell-combo-2');
    }, 2500);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 3, totalDamage: 85 }));
      triggerAnimation('final-blow');
    }, 4000);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 4 }));
      setGameState(prev => ({ ...prev, worldEndRevealed: true }));
      triggerAnimation('victory-achieved');
    }, 5500);
  };

  const demoAbilities = () => {
    setCurrentDemo('abilities');
    triggerAnimation('abilities-demo');
    
    // Cycle through ability demonstrations
    setTimeout(() => triggerAnimation('combo-demo'), 1000);
    setTimeout(() => triggerAnimation('fuse-demo'), 2500);
    setTimeout(() => triggerAnimation('pierce-demo'), 4000);
    setTimeout(() => triggerAnimation('abilities-complete'), 5500);
  };



  useEffect(() => {
    demoGameplay();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white rounded-lg shadow-2xl border-4 border-gray-700">
      <div className="relative z-10">
        {/* Pixel Art Styling */}
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          .pixel-font {
            font-family: 'Press Start 2P', monospace;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }
          
          .pixel-text {
            text-shadow: 2px 2px 0px rgba(0,0,0,0.8);
          }
          
          .pixel-glow {
            text-shadow: 
              0 0 5px currentColor,
              0 0 10px currentColor,
              2px 2px 0px rgba(0,0,0,0.8);
          }
          
          .pixel-border {
            border-style: solid;
            box-shadow: 
              inset 2px 2px 0px rgba(255,255,255,0.1),
              inset -2px -2px 0px rgba(0,0,0,0.3);
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
          }
          
          @keyframes pixel-pulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
              box-shadow: 0 0 0 rgba(255, 255, 0, 0);
            }
            50% { 
              opacity: 0.8; 
              transform: scale(1.05);
              box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
            }
          }
          
          @keyframes retro-bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
            60% { transform: translateY(-4px); }
          }
          
          .animate-shake { animation: shake 0.5s ease-in-out infinite; }
          .animate-pixel-pulse { animation: pixel-pulse 1s ease-in-out infinite; }
          .animate-retro-bounce { animation: retro-bounce 1s ease-in-out; }
          
          .arcade-button {
            background: linear-gradient(45deg, #4a5568, #2d3748);
            border: 4px solid #e2e8f0;
            box-shadow: 
              inset 2px 2px 0px rgba(255,255,255,0.3),
              inset -2px -2px 0px rgba(0,0,0,0.3),
              4px 4px 0px rgba(0,0,0,0.2);
            transform: translateY(0);
            transition: all 0.1s ease;
          }
          
          .arcade-button:hover {
            background: linear-gradient(45deg, #5a6578, #3d4758);
            transform: translateY(-2px);
            box-shadow: 
              inset 2px 2px 0px rgba(255,255,255,0.3),
              inset -2px -2px 0px rgba(0,0,0,0.3),
              6px 6px 0px rgba(0,0,0,0.3);
          }
          
          .arcade-button:active {
            transform: translateY(2px);
            box-shadow: 
              inset 2px 2px 0px rgba(255,255,255,0.3),
              inset -2px -2px 0px rgba(0,0,0,0.3),
              2px 2px 0px rgba(0,0,0,0.2);
          }
          
          .game-screen {
            background: radial-gradient(circle at center, #1a202c 0%, #0d1117 100%);
            border: 6px solid #4a5568;
            box-shadow: 
              inset 4px 4px 0px rgba(255,255,255,0.1),
              inset -4px -4px 0px rgba(0,0,0,0.3),
              0 0 30px rgba(0,0,0,0.5);
          }
        `}</style>

        {/* Header */}
        <div className="text-center mb-8 pixel-font">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4 pixel-glow animate-pixel-pulse">
            DOOM CASTER
          </h1>
          <div className="text-lg text-cyan-300 pixel-text">
            ARCADE BATTLE SYSTEM
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-6 mb-10 pixel-font">
          <button
            onClick={demoGameplay}
            className="arcade-button text-white font-bold py-4 px-5 rounded text-sm flex items-center justify-center gap-3"
          >
            <Target size={16} />
            BATTLE
          </button>
          <button
            onClick={demoVictory}
            className="arcade-button text-white font-bold py-4 px-5 rounded text-sm flex items-center justify-center gap-3"
          >
            <Zap size={16} />
            VICTORY
          </button>
          <button
            onClick={demoAbilities}
            className="arcade-button text-white font-bold py-4 px-5 rounded text-sm flex items-center justify-center gap-3"
          >
            <Swords size={16} />
            SKILLS
          </button>
        </div>

        {/* Game Screen */}
        <div className="game-screen rounded-lg p-8 min-h-[700px]">
          
          {/* World End Card */}
          <div className="text-center mb-6">
            <CardPlaceholder 
              type="world" 
              label="WORLD END" 
              glowing={gameState.worldEndRevealed}
              casting={animationState === 'victory-achieved'}
            />
            <div className="text-xs text-gray-400 mt-1 pixel-font">FINAL BOSS</div>
          </div>

          {/* Turn Counter */}
          <div className="text-center mb-6 pixel-font">
            <div className="text-2xl text-yellow-400 pixel-glow">
              TURN {turnCounter}
            </div>
            {animationState && (
              <div className="text-sm text-cyan-300 mt-2 animate-retro-bounce">
                {animationState.toUpperCase().replace('-', ' ')}
              </div>
            )}
          </div>

          {/* Area Zone */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-4 text-red-400 pixel-font pixel-glow">ENEMY ZONE</h3>
            
            {currentDemo === 'victory' ? (
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2 pixel-font">STAGE 2 - COMBINED ASSAULT</div>
                <div className="flex justify-center gap-2">
                  <CardPlaceholder 
                    type="area" 
                    label="ANCIENT LIBRARY"
                    element="wind"
                    defense={35}
                    ability="CONSUME"
                    casting={animationState === 'spell-combo-1'}
                    damaged={animationState === 'spell-combo-2'}
                  />
                  <CardPlaceholder 
                    type="area" 
                    label="SHADOW REALM"
                    element="earth"
                    defense={45}
                    ability="CONSUME"
                    casting={animationState === 'spell-combo-2'}
                    damaged={animationState === 'final-blow'}
                  />
                </div>
                <div className="text-center mt-2 text-yellow-400 font-bold pixel-font">
                  TOTAL HP: {victorySequence.targetDefense}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-center text-sm text-gray-400 mb-2 pixel-font">STAGE 1 - SELECT TARGET</div>
                <div className="flex justify-center gap-2">
                  {areas.slice(0, 3).map((area, i) => (
                    <CardPlaceholder 
                      key={i} 
                      type="area" 
                      label={area.name.toUpperCase()}
                      element={area.immunity}
                      defense={area.defense}
                      ability={area.ability.toUpperCase()}
                      glowing={selectedArea?.name === area.name && animationState === 'target-select'}
                      damaged={selectedArea?.name === area.name && animationState === 'damage'}
                      onClick={() => setSelectedArea(area)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Victory Display */}
          {currentDemo === 'victory' && (
            <div className="mb-8 bg-gray-800/80 rounded-lg p-6 pixel-border">
              <h3 className="text-xl font-bold text-center mb-4 text-yellow-400 pixel-font pixel-glow">STAGE 2 VICTORY</h3>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2 pixel-font">
                  DAMAGE: <span className="text-red-400 pixel-glow">{victorySequence.totalDamage}</span> / {victorySequence.targetDefense}
                </div>
                {victorySequence.step >= 4 && (
                  <div className="text-4xl font-bold text-green-400 pixel-font pixel-glow animate-retro-bounce">
                    🏆 VICTORY! 🏆
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spell Row */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-4 text-blue-400 pixel-font pixel-glow">SPELL DECK</h3>
            <div className="flex justify-center gap-2">
              {spells.map((spell, i) => (
                <CardPlaceholder 
                  key={i} 
                  type="spell" 
                  label={spell.name.toUpperCase()}
                  element={spell.element}
                  attack={spell.attack}
                  ability={spell.ability.toUpperCase()}
                  glowing={selectedSpell?.name === spell.name && animationState === 'spell-select'}
                  casting={selectedSpell?.name === spell.name && animationState === 'casting'}
                  onClick={() => setSelectedSpell(spell)}
                />
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="mt-8 bg-gray-800/80 rounded-lg p-6 pixel-border">
            {currentDemo === 'gameplay' && (
              <div className="space-y-6 pixel-font">
                <h2 className="text-2xl font-bold text-center text-green-400 pixel-glow">BATTLE SYSTEM</h2>
                
                {selectedSpell && selectedArea && (
                  <div className="flex justify-center gap-8 items-center">
                    <div className="bg-blue-900/50 p-4 rounded pixel-border">
                      <h3 className="text-lg font-bold mb-2 text-yellow-400">{selectedSpell.name.toUpperCase()}</h3>
                      <div className="text-2xl font-bold text-orange-400 pixel-glow">{selectedSpell.attack} ATK</div>
                      <div className="text-sm text-gray-300">{selectedSpell.ability.toUpperCase()}</div>
                    </div>
                    
                    <div className="text-4xl text-red-400 animate-retro-bounce">⚔️</div>
                    
                    <div className="bg-red-900/50 p-4 rounded pixel-border">
                      <h3 className="text-lg font-bold mb-2 text-cyan-400">{selectedArea.name.toUpperCase()}</h3>
                      <div className="text-2xl font-bold text-blue-400 pixel-glow">{selectedArea.defense} DEF</div>
                      <div className="text-sm text-gray-300">IMMUNE: {selectedArea.immunity.toUpperCase()}</div>
                    </div>
                  </div>
                )}

                <div className="text-center bg-yellow-900/30 p-4 rounded pixel-border">
                  <h3 className="font-bold text-yellow-400 pixel-glow">COMBAT RULES</h3>
                  <p className="text-gray-300 text-sm">
                    MAX 3 SPELLS PER TURN • FREEFORM ACTIONS • MODIFIER STACKING
                  </p>
                </div>
              </div>
            )}

            {currentDemo === 'abilities' && (
              <div className="space-y-6 pixel-font">
                <h2 className="text-2xl font-bold text-center text-purple-400 pixel-glow">SKILL SYSTEM</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className={`bg-red-900/30 p-4 rounded pixel-border ${animationState === 'combo-demo' ? 'animate-pixel-pulse' : ''}`}>
                    <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                      <Flame size={16} />
                      COMBO
                    </h3>
                    <p className="text-xs text-gray-300">MATCH ELEMENTS FOR BONUS DAMAGE</p>
                  </div>
                  
                  <div className={`bg-blue-900/30 p-4 rounded pixel-border ${animationState === 'fuse-demo' ? 'animate-pixel-pulse' : ''}`}>
                    <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <Droplets size={16} />
                      FUSE
                    </h3>
                    <p className="text-xs text-gray-300">MERGE SPELLS FOR POWER</p>
                  </div>
                  
                  <div className={`bg-green-900/30 p-4 rounded pixel-border ${animationState === 'pierce-demo' ? 'animate-pixel-pulse' : ''}`}>
                    <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                      <Wind size={16} />
                      PIERCE
                    </h3>
                    <p className="text-xs text-gray-300">IGNORE ENEMY IMMUNITY</p>
                  </div>
                  
                  <div className="bg-purple-900/30 p-4 rounded pixel-border">
                    <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <Eye size={16} />
                      VOID
                    </h3>
                    <p className="text-xs text-gray-300">ULTIMATE ELEMENT POWER</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => window.open('https://github.com/doomcaster/rules', '_blank')}
            className="arcade-button text-white px-6 py-3 rounded pixel-font text-sm flex items-center gap-2"
          >
            <ExternalLink size={16} />
            FULL RULES
          </button>
        </div>

        {/* Game Info Footer */}
        <div className="mt-8 text-center text-xs text-gray-400 bg-black/50 rounded-lg p-4 pixel-border pixel-font">
          <p className="text-lg font-bold text-purple-400 mb-2 pixel-glow">DOOMCASTER: ARCADE EDITION</p>
          <p>2 PLAYERS • 20-40 MIN • AGES 13+</p>
          <p className="mt-2">MASTER ELEMENTS • EXPLOIT WEAKNESSES • CLAIM VICTORY</p>
        </div>
      </div>
    </div>
  );
};

export default DoomCasterDemo; 