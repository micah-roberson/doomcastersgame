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
      { id: 1, name: 'Shape Water', element: 'water', attack: 0, modifiers: [], tapped: false, ability: 'Fuse' },
      { id: 2, name: 'Gather Wind', element: 'wind', attack: 3, modifiers: [], tapped: false, ability: 'Combo [Fire] or [Water] or [Earth] = +1 ATK, +1 Spell Cast' },
      { id: 3, name: 'Conjure Fire', element: 'fire', attack: 5, modifiers: [], tapped: false, ability: 'None' },
      { id: 4, name: 'Raise Earth', element: 'earth', attack: 4, modifiers: [], tapped: false, ability: 'Scout Area Card' },
      { id: 5, name: 'Unleash Void', element: 'void', attack: 0, modifiers: [], tapped: false, ability: 'Refresh Spell Row + Banish' }
    ],
    spellRow: [
      { id: 11, name: 'Fireball', element: 'fire', attack: 4, ability: 'Combo [Fire] = +3 ATK' },
      { id: 12, name: 'Tidal Barrage', element: 'water', attack: 3, ability: 'Combo [Water] = +4 ATK, Refresh Spell Row' },
      { id: 13, name: 'Sonic Boom', element: 'wind', attack: 5, ability: 'Combo [Wind] = +1 Spell Cast' },
      { id: 14, name: 'Earthquake', element: 'earth', attack: 4, ability: 'Refresh Area Card' },
      { id: 15, name: 'Essence Lance', element: 'void', attack: 10, ability: 'Consume Spell (x2)' }
    ],
    areaZone: [
      { id: 21, name: 'Barren Fields', defense: 25, immunity: undefined, defeated: false, currentDamage: 0, ability: null },
      { id: 22, name: 'Avian Plateau', defense: 15, immunity: 'wind', defeated: false, currentDamage: 0, ability: 'Consume Spell' },
      { id: 23, name: 'Druid Thicket', defense: 25, immunity: 'earth', defeated: false, currentDamage: 0, ability: 'Consume Spell (Share)' }
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
    if (!spell.ability?.includes('Combo')) return { satisfied: false, bonus: 0, extraSpellCast: 0 };
    
    // Check for Free Combo modifier
    const hasFreeCombo = spell.modifiers?.some(mod => mod.name?.includes('Free Combo')) || 
                        spell.ability?.includes('Free Combo');
    if (hasFreeCombo) {
      addToLog(`🆓 Free Combo activated for ${spell.name}!`);
      return { satisfied: true, bonus: 3, extraSpellCast: 0 };
    }
    
    const comboMatch = spell.ability.match(/Combo \[([^\]]+)\](?: or \[([^\]]+)\])?(?: and \[([^\]]+)\])? = ([^,]+)/);
    if (!comboMatch) return { satisfied: false, bonus: 0, extraSpellCast: 0 };
    
    const requiredElements = [comboMatch[1], comboMatch[2], comboMatch[3]].filter(Boolean);
    const bonusText = comboMatch[4];
    
    // Check if elements are satisfied
    const isOr = spell.ability.includes(' or ');
    const isAnd = spell.ability.includes(' and ');
    
    let satisfied = false;
    if (isOr) {
      satisfied = requiredElements.some(element => elementsPlayedThisTurn.includes(element));
    } else if (isAnd) {
      satisfied = requiredElements.every(element => elementsPlayedThisTurn.includes(element));
    } else {
      satisfied = elementsPlayedThisTurn.includes(requiredElements[0]);
    }
    
    if (!satisfied) return { satisfied: false, bonus: 0, extraSpellCast: 0 };
    
    // Parse bonus
    let bonus = 0;
    let extraSpellCast = 0;
    
    if (bonusText.includes('+') && bonusText.includes('ATK')) {
      const atkMatch = bonusText.match(/\+(\d+) ATK/);
      if (atkMatch) bonus = parseInt(atkMatch[1]);
    }
    
    if (bonusText.includes('+1 Spell Cast')) {
      extraSpellCast = 1;
    }
    
    return { satisfied, bonus, extraSpellCast };
  };

  // Use spell ability
  const useSpellAbility = (spellIndex: number) => {
    const spell = gameState.player1Spells[spellIndex];
    
    if (!spell.ability || spell.ability === 'None') {
      addToLog("❌ This spell has no ability!");
      return;
    }

    if (spell.tapped) {
      addToLog("❌ Spell already used this turn!");
      return;
    }

    // Handle different abilities
    if (spell.ability.includes('Fuse')) {
      startFusingFromAbility(spellIndex);
    } else if (spell.ability.includes('Refresh Spell Row')) {
      refreshSpellRow();
      // Tap the spell after using ability
      setGameState(prev => ({
        ...prev,
        player1Spells: prev.player1Spells.map((s, i) => 
          i === spellIndex ? { ...s, tapped: true } : s
        )
      }));
    } else if (spell.ability.includes('Scout Area')) {
      scoutAreaCards();
      setGameState(prev => ({
        ...prev,
        player1Spells: prev.player1Spells.map((s, i) => 
          i === spellIndex ? { ...s, tapped: true } : s
        )
      }));
    } else if (spell.ability.includes('Attune')) {
      const attuneMatch = spell.ability.match(/Attune \[(\w+)\]/);
      if (attuneMatch) {
        const newElement = attuneMatch[1].toLowerCase();
        setGameState(prev => ({
          ...prev,
          player1Spells: prev.player1Spells.map((s, i) => 
            i === spellIndex ? { ...s, element: newElement, tapped: true } : s
          )
        }));
        addToLog(`🔄 ${spell.name} attuned to ${newElement}`);
      }
    } else {
      addToLog(`⚡ ${spell.name} ability activated!`);
      // Tap the spell after using ability
      setGameState(prev => ({
        ...prev,
        player1Spells: prev.player1Spells.map((s, i) => 
          i === spellIndex ? { ...s, tapped: true } : s
        )
      }));
    }
    
    setSelectedSpellbook(null);
  };

  // Start fusing from ability button
  const startFusingFromAbility = (spellIndex: number) => {
    setGameMode('fusing');
    setFuseState({ source: spellIndex, target: null, step: 'select_target' });
    addToLog(`🔄 Select target spell to fuse ${gameState.player1Spells[spellIndex].name} to`);
  };

  // Refresh spell row
  const refreshSpellRow = () => {
    const newSpells = [
      { id: Date.now() + 1, name: 'Emberstorm', element: 'fire', attack: 5, ability: 'None' },
      { id: Date.now() + 2, name: 'Avalanche', element: 'water', attack: 4, ability: 'Fuse' },
      { id: Date.now() + 3, name: 'Sky Splitter', element: 'wind', attack: 3, ability: 'Combo [Fire] or [Water] or [Wind] or [Earth] = +3 ATK' },
      { id: Date.now() + 4, name: 'Locust Swarm', element: 'earth', attack: 3, ability: 'Combo [Earth] = +2 ATK, Refresh Area Card' },
      { id: Date.now() + 5, name: 'Essence Drain', element: 'void', attack: 0, ability: 'Spell Search' }
    ];
    
    setGameState(prev => ({
      ...prev,
      spellRow: newSpells
    }));
    
    addToLog(`🔄 Spell row refreshed with new spells!`);
  };

  // Scout area cards
  const scoutAreaCards = () => {
    const activeAreas = gameState.areaZone.filter(area => !area.defeated);
    if (activeAreas.length > 0) {
      const scoutedArea = activeAreas[0];
      addToLog(`👁️ Scouted ${scoutedArea.name}: ${scoutedArea.defense} HP, ${scoutedArea.immunity ? `Immune to ${scoutedArea.immunity}` : 'No immunity'}`);
    }
  };

  // Check for Consume Spell requirement
  const checkConsumeSpell = (spellIndex: number, areaIndex: number) => {
    const area = gameState.areaZone[areaIndex];
    
    if ((area.ability ?? '').includes('Consume Spell')) {
      const consumeMatch = (area.ability ?? '').match(/Consume Spell \(x?(\d+)\)/);
      const consumeAmount = consumeMatch ? parseInt(consumeMatch[1]) : 1;
      
      const availableSpells = gameState.player1Spells.filter((s, i) => i !== spellIndex && !s.tapped);
      
      if (availableSpells.length < consumeAmount) {
        addToLog(`❌ Need ${consumeAmount} additional spells for Consume Spell!`);
        return false;
      }
      
      // Auto-consume the required spells
      setGameState(prev => ({
        ...prev,
        discardPile: [...prev.discardPile, ...availableSpells.slice(0, consumeAmount)],
        player1Spells: prev.player1Spells.filter((s, i) => {
          if (i === spellIndex) return true;
          if (s.tapped) return true;
          return !availableSpells.slice(0, consumeAmount).includes(s);
        })
      }));
      
      addToLog(`⚡ Consumed ${consumeAmount} spells for ${area.name}`);
    }
    
    return true;
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
    
    // Check Consume Spell requirement first
    if (!checkConsumeSpell(selectedSpell, areaIndex)) {
      return;
    }
    
    setAnimatingCards([spell.id, area.id]);
    
    setTimeout(() => {
      // Process spell abilities BEFORE damage calculation
      let modifiedSpell = { ...spell };
      let shouldBanish = false;
      let extraSpellCast = 0;
      
      // Handle Attune ability (changes element)
      if (spell.ability?.includes('Attune')) {
        const attuneMatch = spell.ability.match(/Attune \[(\w+)\]/);
        if (attuneMatch) {
          const newElement = attuneMatch[1].toLowerCase();
          modifiedSpell = { ...modifiedSpell, element: newElement };
          addToLog(`🔄 ${spell.name} attuned to ${newElement}`);
        }
      }
      
      // Process modifiers for Add To Element and other effects
      if (modifiedSpell.modifiers) {
        modifiedSpell.modifiers.forEach(mod => {
          if (mod.name?.includes('Add') && mod.name?.includes('To')) {
            const addMatch = mod.name.match(/Add \((\d+)\) To \[(\w+)\]/);
            if (addMatch) {
              const addAmount = parseInt(addMatch[1]);
              const targetElement = addMatch[2].toLowerCase();
              if (modifiedSpell.element === targetElement) {
                modifiedSpell = { ...modifiedSpell, attack: modifiedSpell.attack + addAmount };
                addToLog(`⚡ Add ${addAmount} damage to ${targetElement} spell`);
              }
            }
          }
        });
      }
      
      // Handle Banish ability
      if (spell.ability?.includes('Banish')) {
        shouldBanish = true;
        addToLog(`🚫 ${spell.name} will be banished after attack`);
      }
      
      // Check combo
      const combo = checkCombo(modifiedSpell);
      extraSpellCast = combo.extraSpellCast;
      
      if (combo.satisfied) {
        addToLog(`💥 Combo activated! +${combo.bonus} damage${extraSpellCast > 0 ? `, +${extraSpellCast} spell cast` : ''}`);
      }
      
      // Calculate final attack
      const attackInfo = calculateAttack(modifiedSpell);
      let finalAttack = attackInfo.attack + combo.bonus;
      
      // Check immunity
      const isImmune = area.immunity === attackInfo.element;
      const damage = isImmune ? 0 : finalAttack;
      
      setGameState(prev => {
        const newState = { ...prev };
        
        // Add element to played this turn
        setElementsPlayedThisTurn(prev => [...prev, modifiedSpell.element]);
        
        // Tap the spell (but don't delete unless banished)
        newState.player1Spells = [...prev.player1Spells];
        newState.player1Spells[selectedSpell] = { ...modifiedSpell, tapped: true };
        newState.spellsCastThisTurn = prev.spellsCastThisTurn + 1 + extraSpellCast;
        
        // Apply damage
        newState.areaZone = [...prev.areaZone];
        const newDamage = (area.currentDamage || 0) + damage;
        
        if (newDamage >= area.defense) {
          // Area defeated
          newState.areaZone[areaIndex] = { ...area, defeated: true, currentDamage: area.defense };
          
          // Add modifier to the attacking spell (based on CSV data)
          const modifier = { 
            name: `${area.name} Power`, 
            attack: 3, 
            source: 'area',
            id: Date.now()
          };
          
          // Only add modifier if spell wasn't banished
          if (!shouldBanish) {
            newState.player1Spells[selectedSpell].modifiers = [...(modifiedSpell.modifiers || []), modifier];
            addToLog(`💥 ${area.name} defeated! Modifier added to ${modifiedSpell.name}`);
          } else {
            addToLog(`💥 ${area.name} defeated!`);
          }
        } else {
          newState.areaZone[areaIndex] = { ...area, currentDamage: newDamage };
          addToLog(isImmune ? 
            `🛡️ ${modifiedSpell.name} blocked by immunity!` : 
            `⚔️ ${modifiedSpell.name} deals ${damage} damage to ${area.name}`
          );
        }
        
        // Handle Banish - remove from game after all effects
        if (shouldBanish) {
          newState.removedFromGame = [...prev.removedFromGame, modifiedSpell];
          newState.player1Spells = newState.player1Spells.filter((_, i) => i !== selectedSpell);
          addToLog(`🚫 ${modifiedSpell.name} banished from game`);
        }
        
        // Handle Refresh Spell Row ability
        if (spell.ability?.includes('Refresh Spell Row')) {
          refreshSpellRow();
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
      addToLog(`🔄 Selected ${spell.name}. Now select target spell to attach to.`);
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
          attack: Math.floor(sourceSpell.attack / 2) || 1, // Minimum 1 attack
          element: sourceSpell.element,
          source: 'fuse',
          id: Date.now()
        };
        
        // Add modifier as LAST modifier to target spell (Fuse must be last)
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
        { id: 1, name: 'Shape Water', element: 'water', attack: 0, modifiers: [], tapped: false, ability: 'Fuse' },
        { id: 2, name: 'Gather Wind', element: 'wind', attack: 3, modifiers: [], tapped: false, ability: 'Combo [Fire] or [Water] or [Earth] = +1 ATK, +1 Spell Cast' },
        { id: 3, name: 'Conjure Fire', element: 'fire', attack: 5, modifiers: [], tapped: false, ability: 'None' },
        { id: 4, name: 'Raise Earth', element: 'earth', attack: 4, modifiers: [], tapped: false, ability: 'Scout Area Card' },
        { id: 5, name: 'Unleash Void', element: 'void', attack: 0, modifiers: [], tapped: false, ability: 'Refresh Spell Row + Banish' }
      ],
      spellRow: [
        { id: 11, name: 'Fireball', element: 'fire', attack: 4, ability: 'Combo [Fire] = +3 ATK' },
        { id: 12, name: 'Tidal Barrage', element: 'water', attack: 3, ability: 'Combo [Water] = +4 ATK, Refresh Spell Row' },
        { id: 13, name: 'Sonic Boom', element: 'wind', attack: 5, ability: 'Combo [Wind] = +1 Spell Cast' },
        { id: 14, name: 'Earthquake', element: 'earth', attack: 4, ability: 'Refresh Area Card' },
        { id: 15, name: 'Essence Lance', element: 'void', attack: 10, ability: 'Consume Spell (x2)' }
      ],
      areaZone: [
        { id: 21, name: 'Barren Fields', defense: 25, immunity: undefined, defeated: false, currentDamage: 0, ability: null },
        { id: 22, name: 'Avian Plateau', defense: 15, immunity: 'wind', defeated: false, currentDamage: 0, ability: 'Consume Spell' },
        { id: 23, name: 'Druid Thicket', defense: 25, immunity: 'earth', defeated: false, currentDamage: 0, ability: 'Consume Spell (Share)' }
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
                  
                  {/* Ability/Cast/Discard Buttons */}
                  {selectedSpellbook === i && gameMode === 'normal' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => useSpellAbility(i)}
                        disabled={spell.tapped || !spell.ability || spell.ability === 'None'}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Zap size={10} />
                        Ability
                      </button>
                      <button
                        onClick={() => startCasting(i)}
                        disabled={spell.tapped || gameState.spellsCastThisTurn >= gameState.maxSpells}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Swords size={10} />
                        Cast
                      </button>
                      <button
                        onClick={() => discardSpell(i)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Trash2 size={10} />
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
              <div><span className="text-blue-400">Add (x) To [Element]:</span> Bonus damage to specific element</div>
              <div><span className="text-yellow-400">Attune [Element]:</span> Change spell's element</div>
              <div><span className="text-red-400">Banish:</span> Remove from game after casting</div>
              <div><span className="text-green-400">Combo [Element]:</span> Bonus if elements played this turn</div>
              <div><span className="text-orange-400">Consume Spell (x):</span> Discard x spells to attack area</div>
              <div><span className="text-purple-400">Free Combo:</span> Bypass combo requirements</div>
              <div><span className="text-cyan-400">Fuse:</span> Attach spell as modifier to another spell</div>
              <div><span className="text-pink-400">Refresh Spell Row:</span> Replace all spells in row</div>
              <div><span className="text-indigo-400">Scout Area:</span> View area card details</div>
            </div>
          </div>

          {/* Discard & Banished */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">️ Removed Cards</h3>
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
              <div>• Use Ability button to activate spell powers</div>
              <div>• Shape Water fuses spells as modifiers</div>
              <div>• Consume Spell areas require spell sacrifice</div>
              <div>• Play elements for combo bonuses</div>
              <div>• Watch area immunities carefully</div>
              <div>• Banished spells are gone forever</div>
              <div>• Attune changes spell elements</div>
              <div>• Free Combo bypasses requirements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoomCasterDemo; 