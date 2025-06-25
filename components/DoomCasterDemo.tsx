'use client'

import React, { useState, useEffect } from 'react';
import { Play, Zap, Target, RotateCcw, Flame, Droplets, Wind, Mountain, Sparkles, Trash2, Plus, Swords } from 'lucide-react';

interface Spell {
  id: number;
  name: string;
  element: string;
  attack: number;
  modifiers?: Modifier[];
  tapped?: boolean;
  ability?: string;
}

interface Area {
  id: number;
  name: string;
  defense: number;
  immunity?: string;
  defeated?: boolean;
  currentDamage?: number;
  ability?: string | null;
}

interface Modifier {
  name: string;
  attack: number;
  element?: string;
  source?: string;
  id: number;
  type?: string;
}

interface GameState {
  player1Spells: Spell[];
  spellRow: Spell[];
  areaZone: Area[];
  discardPile: Spell[];
  removedFromGame: Spell[];
  spellsCastThisTurn: number;
  maxSpells: number;
  turnCount: number;
}

interface FuseState {
  source: number | null;
  target: number | null;
  step: 'select_source' | 'select_target';
}

const DoomCasterDemo = () => {
  const [gameMode, setGameMode] = useState<'normal' | 'fusing' | 'targeting'>('normal');
  const [selectedSpell, setSelectedSpell] = useState<number | null>(null);
  const [selectedSpellbook, setSelectedSpellbook] = useState<number | null>(null);
  const [fuseState, setFuseState] = useState<FuseState>({ source: null, target: null, step: 'select_source' });
  const [animatingCards, setAnimatingCards] = useState<number[]>([]);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [elementsPlayedThisTurn, setElementsPlayedThisTurn] = useState<string[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    player1Spells: [
      { id: 1, name: 'Shape Water', element: 'water', attack: 3, modifiers: [], tapped: false, ability: 'Fuse (1)' },
      { id: 2, name: 'Gather Wind', element: 'wind', attack: 5, modifiers: [], tapped: false, ability: 'Combo: Wind' },
      { id: 3, name: 'Conjure Fire', element: 'fire', attack: 4, modifiers: [], tapped: false, ability: 'Banish' },
      { id: 4, name: 'Raise Earth', element: 'earth', attack: 6, modifiers: [], tapped: false, ability: 'Attune [Fire]' }
    ],
    spellRow: [
      { id: 11, name: 'Lightning Bolt', element: 'void', attack: 6, ability: 'Banish' },
      { id: 12, name: 'Flame Burst', element: 'fire', attack: 5, ability: 'Combo: Fire or Wind' },
      { id: 13, name: 'Wind Cutter', element: 'wind', attack: 4, ability: 'Refresh Spell Row' },
      { id: 14, name: 'Earth Shield', element: 'earth', attack: 2, ability: 'Add (3) To [Earth]' },
      { id: 15, name: 'Void Strike', element: 'void', attack: 7, ability: 'Free Combo' }
    ],
    areaZone: [
      { id: 21, name: 'Crystal Caverns', defense: 8, immunity: 'fire', defeated: false, currentDamage: 0, ability: 'Consume Spell (1)' },
      { id: 22, name: 'Sky Fortress', defense: 12, immunity: 'wind', defeated: false, currentDamage: 0, ability: 'Immobile' },
      { id: 23, name: 'Molten Core', defense: 15, immunity: 'fire', defeated: false, currentDamage: 0, ability: null }
    ],
    discardPile: [],
    removedFromGame: [],
    spellsCastThisTurn: 0,
    maxSpells: 3,
    turnCount: 1
  });

  const elements: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    fire: { icon: Flame, color: 'text-red-500', bg: 'bg-red-900/30', border: 'border-red-500' },
    water: { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-900/30', border: 'border-blue-500' },
    wind: { icon: Wind, color: 'text-green-500', bg: 'bg-green-900/30', border: 'border-green-500' },
    earth: { icon: Mountain, color: 'text-yellow-600', bg: 'bg-yellow-900/30', border: 'border-yellow-600' },
    void: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-900/30', border: 'border-purple-500' }
  };

  const addToLog = (message: string) => {
    setGameLog(prev => [...prev.slice(-4), message]);
  };

  // Calculate total attack including modifiers
  const calculateAttack = (spell: Spell) => {
    let totalAttack = spell.attack;
    let finalElement = spell.element;
    
    // Apply modifiers bottom-up
    if (spell.modifiers) {
      spell.modifiers.forEach(mod => {
        if (mod.type === 'attune') {
          finalElement = mod.element || finalElement;
        } else if (mod.type === 'add_to_element') {
          if (finalElement === mod.element) {
            totalAttack += mod.attack;
          }
        } else {
          totalAttack += mod.attack || 0;
        }
      });
    }
    
    return { attack: totalAttack, element: finalElement };
  };

  // Check combo requirements
  const checkCombo = (spell: Spell) => {
    if (!spell.ability?.includes('Combo:')) return { satisfied: false, bonus: 0 };
    
    const comboText = spell.ability.split('Combo: ')[1];
    const isOr = comboText.includes(' or ');
    const requiredElements = comboText.split(isOr ? ' or ' : ' and ').map(e => e.toLowerCase().trim());
    
    let satisfied = false;
    if (isOr) {
      satisfied = requiredElements.some(element => elementsPlayedThisTurn.includes(element));
    } else {
      satisfied = requiredElements.every(element => elementsPlayedThisTurn.includes(element));
    }
    
    return { satisfied, bonus: satisfied ? 3 : 0 };
  };

  // Check if spellbook has open slots
  const hasOpenSlot = () => gameState.player1Spells.length < 5;

  // Game Card Component
  const GameCard = ({ 
    card = { id: 0, name: '', element: 'void', attack: 0 }, 
    type, 
    onClick, 
    className = '', 
    isSelected = false, 
    isValidTarget = false, 
    isDisabled = false 
  }: {
    card?: Spell | Area;
    type: 'spell' | 'area';
    onClick?: () => void;
    className?: string;
    isSelected?: boolean;
    isValidTarget?: boolean;
    isDisabled?: boolean;
  }) => {
    const element = elements[(card as Spell).element || 'void'] || elements.void;
    const IconComponent = element.icon;
    
    const attackInfo = type === 'spell' ? calculateAttack(card as Spell) : null;
    const areaCard = card as Area;
    const remainingHealth = type === 'area' ? (areaCard.defense - (areaCard.currentDamage || 0)) : null;
    
    return (
      <div 
        className={`
          relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 
          rounded-lg p-3 text-center transition-all duration-300 cursor-pointer
          min-h-[120px] min-w-[90px] flex flex-col justify-between
          ${element.bg}
          ${isSelected ? `${element.border} border-4 shadow-lg shadow-current` : 'border-gray-600'}
          ${isValidTarget ? 'border-yellow-400 animate-pulse' : ''}
          ${(card as Spell).tapped ? 'opacity-60 rotate-12' : ''}
          ${(card as Area).defeated ? 'opacity-40' : ''}
          ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-yellow-400 hover:shadow-lg'}
          ${animatingCards.includes(card.id) ? 'animate-bounce z-50 scale-110' : ''}
          ${className}
        `}
        onClick={!isDisabled ? onClick : undefined}
      >
        {/* Card Header */}
        <div className="text-xs font-bold text-gray-300 truncate">
          {card.name}
        </div>
        
        {/* Element Icon */}
        <div className="flex-1 flex items-center justify-center">
          <IconComponent className={`${element.color}`} size={28} />
        </div>
        
        {/* Stats */}
        <div className="text-xs space-y-1">
          {type === 'spell' && attackInfo && (
            <div className={`font-bold`}>
              <span className={elements[attackInfo.element].color}>
                {attackInfo.attack} {attackInfo.element.toUpperCase()} ATK
              </span>
              {attackInfo.attack !== (card as Spell).attack && (
                <span className="text-yellow-400 block text-[10px]">
                  (Base: {(card as Spell).attack})
                </span>
              )}
            </div>
          )}
          {type === 'area' && !(card as Area).defeated && (
            <div>
              <div className="text-blue-400 font-bold">
                {remainingHealth}/{(card as Area).defense} HP
              </div>
              {typeof areaCard.currentDamage === 'number' && areaCard.currentDamage > 0 && (
                <div className="text-red-400 text-[10px]">
                  -{areaCard.currentDamage} DMG
                </div>
              )}
            </div>
          )}
          {card?.ability && (
            <div className="text-gray-400 text-[10px] truncate">
              {card.ability}
            </div>
          )}
          {type === 'area' && 'immunity' in card && card.immunity && !card.defeated && (
            <div className="text-red-400 text-[10px]">
              Immune: {card.immunity}
            </div>
          )}
        </div>
        
        {/* Modifiers indicator */}
        {type === 'spell' && 'modifiers' in card && card.modifiers && card.modifiers.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
            {card.modifiers.length}
          </div>
        )}
        
        {/* Tapped indicator */}
        {type === 'spell' && 'tapped' in card && card.tapped && (
          <div className="absolute top-1 left-1 text-red-400 text-xs font-bold">
            USED
          </div>
        )}
        
        {/* Defeated overlay */}
        {type === 'area' && 'defeated' in card && card.defeated && (
          <div className="absolute inset-0 bg-green-900/80 rounded-lg flex items-center justify-center">
            <span className="text-green-300 font-bold text-xs">DEFEATED</span>
          </div>
        )}

        {/* Valid target highlight */}
        {isValidTarget && (
          <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg animate-pulse"></div>
        )}
      </div>
    );
  };

  // Acquire spell from spell row
  const acquireSpell = (spellRowIndex: number) => {
    if (!hasOpenSlot()) {
      addToLog("❌ Spellbook full! Discard a spell first.");
      return;
    }
    
    const spell = gameState.spellRow[spellRowIndex];
    setAnimatingCards([spell.id]);
    
    setTimeout(() => {
      setGameState(prev => {
        const newSpell = { ...spell, modifiers: [], tapped: false };
        const newSpellRow = prev.spellRow.filter((_, i) => i !== spellRowIndex);
        
        return {
          ...prev,
          player1Spells: [...prev.player1Spells, newSpell],
          spellRow: newSpellRow
        };
      });
      
      addToLog(`✅ Acquired ${spell.name}`);
      setAnimatingCards([]);
    }, 500);
  };

  // Discard spell from spellbook
  const discardSpell = (spellIndex: number) => {
    const spell = gameState.player1Spells[spellIndex];
    
    setGameState(prev => ({
      ...prev,
      player1Spells: prev.player1Spells.filter((_, i) => i !== spellIndex),
      discardPile: [...prev.discardPile, spell]
    }));
    
    addToLog(`🗑️ Discarded ${spell.name}`);
    setSelectedSpellbook(null);
  };

  // Start casting process
  const startCasting = (spellIndex: number) => {
    if (gameState.spellsCastThisTurn >= gameState.maxSpells) {
      addToLog("❌ Already cast 3 spells this turn!");
      return;
    }
    
    const spell = gameState.player1Spells[spellIndex];
    if (spell.tapped) {
      addToLog("❌ Spell already used this turn!");
      return;
    }

    // Check for Consume Spell requirement
    const targetArea = gameState.areaZone.find(area => !area.defeated && (area.ability ?? '').includes('Consume Spell'));
    if (targetArea) {
      const consumeAmount = parseInt((targetArea.ability ?? '').match(/\d+/)?.[0] ?? '0');
      if (gameState.player1Spells.filter(s => !s.tapped).length <= consumeAmount) {
        addToLog(`❌ Need ${consumeAmount + 1} spells for Consume Spell!`);
        return;
      }
    }
    
    setSelectedSpell(spellIndex);
    setGameMode('targeting');
    setSelectedSpellbook(null);
    addToLog(`🎯 Select target for ${spell.name}`);
  };

  // Execute attack
  const executeAttack = (areaIndex: number) => {
    if (selectedSpell === null) return;
    
    const spell = gameState.player1Spells[selectedSpell];
    const area = gameState.areaZone[areaIndex];
    
    // Handle Consume Spell
    if ((area.ability ?? '').includes('Consume Spell')) {
      const consumeAmount = parseInt((area.ability ?? '').match(/\d+/)?.[0] ?? '0');
      const availableSpells = gameState.player1Spells.filter((s, i) => i !== selectedSpell && !s.tapped);
      
      if (availableSpells.length < consumeAmount) {
        addToLog(`❌ Need ${consumeAmount} additional spells for Consume Spell!`);
        return;
      }
      
      // Auto-consume the required spells
      setGameState(prev => ({
        ...prev,
        discardPile: [...prev.discardPile, ...availableSpells.slice(0, consumeAmount)],
        player1Spells: prev.player1Spells.filter((s, i) => {
          if (i === selectedSpell) return true;
          if (s.tapped) return true;
          return !availableSpells.slice(0, consumeAmount).includes(s);
        })
      }));
      
      addToLog(`⚡ Consumed ${consumeAmount} spells for ${area.name}`);
    }

    setAnimatingCards([spell.id, area.id]);
    
    setTimeout(() => {
      // Process spell abilities before damage
      let modifiedSpell = { ...spell };
      
      // Handle Attune
      if ((spell.ability ?? '').includes('Attune')) {
        const match = (spell.ability ?? '').match(/\[(\w+)\]/);
        if (match) {
          const newElement = match[1].toLowerCase();
          modifiedSpell = { ...modifiedSpell, element: newElement };
          addToLog(`🔄 ${spell.name} attuned to ${newElement}`);
        }
      }
      
      // Check combo
      const combo = checkCombo(modifiedSpell);
      
      // Calculate final attack
      const attackInfo = calculateAttack(modifiedSpell);
      let finalAttack = attackInfo.attack + combo.bonus;
      
      if (combo.satisfied) {
        addToLog(`💥 Combo activated! +${combo.bonus} damage`);
      }
      
      // Check immunity
      const isImmune = area.immunity === attackInfo.element;
      const damage = isImmune ? 0 : finalAttack;
      
      setGameState(prev => {
        const newState = { ...prev };
        
        // Add element to played this turn
        setElementsPlayedThisTurn(prev => [...prev, modifiedSpell.element]);
        
        // Tap the spell
        newState.player1Spells = [...prev.player1Spells];
        newState.player1Spells[selectedSpell] = { ...modifiedSpell, tapped: true };
        newState.spellsCastThisTurn = prev.spellsCastThisTurn + 1;
        
        // Apply damage
        newState.areaZone = [...prev.areaZone];
        const newDamage = (area.currentDamage || 0) + damage;
        
        if (newDamage >= area.defense) {
          // Area defeated
          newState.areaZone[areaIndex] = { ...area, defeated: true, currentDamage: area.defense };
          
          // Add modifier to the attacking spell
          const modifier = { 
            name: `${area.name} Power`, 
            attack: 2, 
            source: 'area',
            id: Date.now()
          };
          newState.player1Spells[selectedSpell].modifiers = [...(modifiedSpell.modifiers || []), modifier];
          
          addToLog(`💥 ${area.name} defeated! Modifier added to ${modifiedSpell.name}`);
        } else {
          newState.areaZone[areaIndex] = { ...area, currentDamage: newDamage };
          addToLog(isImmune ? 
            `🛡️ ${modifiedSpell.name} blocked by immunity!` : 
            `⚔️ ${modifiedSpell.name} deals ${damage} damage to ${area.name}`
          );
        }
        
        // Handle Banish
        if (spell.ability?.includes('Banish')) {
          newState.removedFromGame = [...prev.removedFromGame, modifiedSpell];
          newState.player1Spells = newState.player1Spells.filter((_, i) => i !== selectedSpell);
          addToLog(`🚫 ${modifiedSpell.name} banished from game`);
        }
        
        // Handle Refresh Spell Row
        if (spell.ability?.includes('Refresh Spell Row')) {
          newState.spellRow = [
            { id: Date.now() + 1, name: 'New Spell 1', element: 'fire', attack: 5, ability: 'Combo: Fire' },
            { id: Date.now() + 2, name: 'New Spell 2', element: 'water', attack: 4, ability: 'Attune [Wind]' },
            { id: Date.now() + 3, name: 'New Spell 3', element: 'wind', attack: 6, ability: 'Banish' },
            { id: Date.now() + 4, name: 'New Spell 4', element: 'earth', attack: 3, ability: 'Add (2) To [Earth]' },
            { id: Date.now() + 5, name: 'New Spell 5', element: 'void', attack: 7, ability: 'Free Combo' }
          ];
          addToLog(`🔄 Spell row refreshed!`);
        }
        
        return newState;
      });
      
      setAnimatingCards([]);
      setSelectedSpell(null);
      setGameMode('normal');
    }, 800);
  };

  // Start fusing process
  const startFusing = () => {
    const fuseSpells = gameState.player1Spells.filter(spell => spell.ability?.includes('Fuse'));
    if (fuseSpells.length === 0) {
      addToLog("❌ No spells with Fuse ability!");
      return;
    }
    
    setGameMode('fusing');
    setFuseState({ source: null, target: null, step: 'select_source' });
    addToLog(`🔄 Select spell with Fuse ability`);
  };

  // Handle fuse selection
  const handleFuseSelection = (spellIndex: number) => {
    const spell = gameState.player1Spells[spellIndex];
    
    if (fuseState.step === 'select_source') {
      if (!spell.ability?.includes('Fuse')) {
        addToLog("❌ This spell cannot fuse!");
        return;
      }
      
      setFuseState({ ...fuseState, source: spellIndex, step: 'select_target' });
      addToLog(`🔄 Selected ${spell.name}. Now select target spell.`);
    } else if (fuseState.step === 'select_target') {
      if (spellIndex === fuseState.source) {
        addToLog("❌ Cannot fuse spell to itself!");
        return;
      }
      
      executeFuse(fuseState.source!, spellIndex);
    }
  };

  // Execute fuse
  const executeFuse = (sourceIndex: number, targetIndex: number) => {
    const sourceSpell = gameState.player1Spells[sourceIndex];
    const targetSpell = gameState.player1Spells[targetIndex];
    
    setAnimatingCards([sourceSpell.id, targetSpell.id]);
    
    setTimeout(() => {
      setGameState(prev => {
        const newState = { ...prev };
        
        // Create modifier from source spell (becomes modifier side)
        const modifier = {
          name: `${sourceSpell.name} Modifier`,
          attack: Math.floor(sourceSpell.attack / 2),
          element: sourceSpell.element,
          source: 'fuse',
          id: Date.now()
        };
        
        // Add modifier as LAST modifier to target spell
        newState.player1Spells = [...prev.player1Spells];
        newState.player1Spells[targetIndex] = {
          ...targetSpell,
          modifiers: [...(targetSpell.modifiers || []), modifier]
        };
        
        // Remove source spell from spellbook
        newState.player1Spells = newState.player1Spells.filter((_, i) => i !== sourceIndex);
        
        return newState;
      });
      
      addToLog(`🔄 ${sourceSpell.name} fused to ${targetSpell.name}!`);
      setAnimatingCards([]);
      setFuseState({ source: null, target: null, step: 'select_source' });
      setGameMode('normal');
    }, 800);
  };

  // End turn
  const endTurn = () => {
    setGameState(prev => ({
      ...prev,
      player1Spells: prev.player1Spells.map(spell => ({ ...spell, tapped: false })),
      areaZone: prev.areaZone.map(area => ({ ...area, currentDamage: 0 })),
      spellsCastThisTurn: 0,
      turnCount: prev.turnCount + 1
    }));
    
    setElementsPlayedThisTurn([]);
    addToLog(`🔄 Turn ${gameState.turnCount + 1} begins!`);
  };

  const resetGame = () => {
    setGameState({
      player1Spells: [
        { id: 1, name: 'Shape Water', element: 'water', attack: 3, modifiers: [], tapped: false, ability: 'Fuse (1)' },
        { id: 2, name: 'Gather Wind', element: 'wind', attack: 5, modifiers: [], tapped: false, ability: 'Combo: Wind' },
        { id: 3, name: 'Conjure Fire', element: 'fire', attack: 4, modifiers: [], tapped: false, ability: 'Banish' },
        { id: 4, name: 'Raise Earth', element: 'earth', attack: 6, modifiers: [], tapped: false, ability: 'Attune [Fire]' }
      ],
      spellRow: [
        { id: 11, name: 'Lightning Bolt', element: 'void', attack: 6, ability: 'Banish' },
        { id: 12, name: 'Flame Burst', element: 'fire', attack: 5, ability: 'Combo: Fire or Wind' },
        { id: 13, name: 'Wind Cutter', element: 'wind', attack: 4, ability: 'Refresh Spell Row' },
        { id: 14, name: 'Earth Shield', element: 'earth', attack: 2, ability: 'Add (3) To [Earth]' },
        { id: 15, name: 'Void Strike', element: 'void', attack: 7, ability: 'Free Combo' }
      ],
      areaZone: [
        { id: 21, name: 'Crystal Caverns', defense: 8, immunity: 'fire', defeated: false, currentDamage: 0, ability: 'Consume Spell (1)' },
        { id: 22, name: 'Sky Fortress', defense: 12, immunity: 'wind', defeated: false, currentDamage: 0, ability: 'Immobile' },
        { id: 23, name: 'Molten Core', defense: 15, immunity: 'fire', defeated: false, currentDamage: 0, ability: null }
      ],
      discardPile: [],
      removedFromGame: [],
      spellsCastThisTurn: 0,
      maxSpells: 3,
      turnCount: 1
    });
    setGameMode('normal');
    setSelectedSpell(null);
    setSelectedSpellbook(null);
    setFuseState({ source: null, target: null, step: 'select_source' });
    setElementsPlayedThisTurn([]);
    setGameLog([]);
    addToLog("🎮 Game Reset - Good luck, DoomCaster!");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white rounded-xl shadow-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          DoomCaster Puzzle
        </h1>
        <div className="flex justify-center items-center gap-6 text-sm">
          <span>Turn: {gameState.turnCount}</span>
          <span>Spells Cast: {gameState.spellsCastThisTurn}/{gameState.maxSpells}</span>
          <span>Spellbook: {gameState.player1Spells.length}/5</span>
          <span>Elements Played: {elementsPlayedThisTurn.join(', ') || 'None'}</span>
        </div>
      </div>

      {/* Game Mode Indicator */}
      <div className="text-center mb-4">
        {gameMode === 'normal' && (
          <div className="text-green-400">
            🎯 Click spells to see Cast/Discard • Click spell row to acquire
          </div>
        )}
        {gameMode === 'targeting' && (
          <div className="text-yellow-400">
            ⚔️ Select target area to attack with {gameState.player1Spells[selectedSpell!]?.name}
          </div>
        )}
        {gameMode === 'fusing' && (
          <div className="text-blue-400">
            🔄 Fuse Step: {fuseState.step === 'select_source' ? 'Select source spell' : 'Select target spell'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Game Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Area Zone */}
          <div>
            <h3 className="text-xl font-bold text-center mb-4 text-purple-400">
              🏰 Area Zone - Defeat to Win!
            </h3>
            <div className="flex justify-center gap-4">
              {gameState.areaZone.map((area, i) => (
                <GameCard
                  key={area.id}
                  card={area}
                  type="area"
                  onClick={() => gameMode === 'targeting' && executeAttack(i)}
                  isValidTarget={gameMode === 'targeting'}
                  isDisabled={area.defeated}
                />
              ))}
            </div>
          </div>

          {/* Spell Row */}
          <div>
            <h3 className="text-lg font-bold text-center mb-4 text-blue-400">
              📚 Spell Row - Click to Acquire ({hasOpenSlot() ? 'Has Space' : 'Full'})
            </h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {gameState.spellRow.map((spell, i) => (
                <GameCard
                  key={spell.id}
                  card={spell}
                  type="spell"
                  onClick={() => gameMode === 'normal' && acquireSpell(i)}
                  isDisabled={!hasOpenSlot() || gameMode !== 'normal'}
                />
              ))}
            </div>
          </div>

          {/* Player Spellbook */}
          <div>
            <h3 className="text-lg font-bold text-center mb-4 text-green-400">
              ⚡ Your Spellbook - Click for Actions
            </h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {gameState.player1Spells.map((spell, i) => (
                <div key={spell.id} className="flex flex-col items-center gap-2">
                  <GameCard
                    card={spell}
                    type="spell"
                    onClick={() => {
                      if (gameMode === 'fusing') {
                        handleFuseSelection(i);
                      } else if (gameMode === 'normal') {
                        setSelectedSpellbook(selectedSpellbook === i ? null : i);
                      }
                    }}
                    isSelected={selectedSpell === i || fuseState.source === i || selectedSpellbook === i}
                    isValidTarget={gameMode === 'fusing' && fuseState.step === 'select_target' && i !== fuseState.source}
                    isDisabled={gameMode === 'targeting'}
                  />
                  
                  {/* Cast/Discard Buttons */}
                  {selectedSpellbook === i && gameMode === 'normal' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startCasting(i)}
                        disabled={spell.tapped || gameState.spellsCastThisTurn >= gameState.maxSpells}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Swords size={12} />
                        Cast
                      </button>
                      <button
                        onClick={() => discardSpell(i)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Discard
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add empty slots */}
              {[...Array(5 - gameState.player1Spells.length)].map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className="min-h-[120px] min-w-[90px] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500"
                >
                  <Plus size={24} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          
          {/* Controls */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">🎮 Controls</h3>
            <div className="space-y-2">
              <button
                onClick={startFusing}
                disabled={gameMode !== 'normal' || !gameState.player1Spells.some(s => s.ability?.includes('Fuse'))}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                🔄 Start Fusing
              </button>
              <button
                onClick={endTurn}
                disabled={gameMode !== 'normal'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                ⏭️ End Turn
              </button>
              <button
                onClick={resetGame}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                🔄 Reset Game
              </button>
            </div>
          </div>

          {/* Game Log */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">📜 Game Log</h3>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
              {gameLog.length === 0 ? (
                <div className="text-gray-500">No actions yet...</div>
              ) : (
                gameLog.map((log, i) => (
                  <div key={i} className="text-gray-300">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Keyword Reference */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">📖 Keywords</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div><span className="text-blue-400">Fuse (x):</span> Attach to other spell</div>
              <div><span className="text-green-400">Combo:</span> Bonus if elements played</div>
              <div><span className="text-red-400">Banish:</span> Remove from game</div>
              <div><span className="text-yellow-400">Attune:</span> Change element</div>
              <div><span className="text-purple-400">Add (x) To [Element]:</span> Bonus to element</div>
              <div><span className="text-orange-400">Consume Spell:</span> Discard to cast</div>
            </div>
          </div>

          {/* Discard & Banished */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">🗑️ Removed Cards</h3>
            <div className="text-xs text-gray-400 space-y-2">
              <div>
                <span className="text-gray-300">Discard:</span>
                {gameState.discardPile.length === 0 ? (
                  " Empty"
                ) : (
                  <div className="mt-1">
                    {gameState.discardPile.map(spell => spell.name).join(', ')}
                  </div>
                )}
              </div>
              <div>
                <span className="text-red-300">Banished:</span>
                {gameState.removedFromGame.length === 0 ? (
                  " None"
                ) : (
                  <div className="mt-1">
                    {gameState.removedFromGame.map(spell => spell.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strategy Tips */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">💡 Strategy</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• Use Shape Water to fuse spells</div>
              <div>• Play elements for combo bonuses</div>
              <div>• Watch area immunities!</div>
              <div>• Crystal Caverns needs sacrifice</div>
              <div>• Banished spells are gone forever</div>
              <div>• Attune changes spell element</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoomCasterDemo; 