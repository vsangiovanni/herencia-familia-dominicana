
import React, { useState } from 'react';
import FamilyMember from './FamilyMember';

// Definición de tipos
export interface Person {
  id: string;
  name: string;
  birth?: string;
  death?: string;
  spouse?: string;
  spouseBirth?: string;
  spouseDeath?: string;
  children?: Person[];
  parentId?: string;
  isHighlightedAncestor?: boolean;
}

interface FamilyTreeProps {
  rootPerson: Person;
  highlightedPerson?: string;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ rootPerson, highlightedPerson }) => {
  const [expandedPersons, setExpandedPersons] = useState<Record<string, boolean>>({});

  const togglePerson = (id: string) => {
    setExpandedPersons(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const checkIfPersonHighlighted = (person: Person): boolean => {
    if (highlightedPerson === person.id) return true;
    if (person.isHighlightedAncestor) return true;
    return false;
  };

  const renderPerson = (person: Person, level: number = 0) => {
    const isHighlighted = checkIfPersonHighlighted(person);
    const isExpanded = expandedPersons[person.id];
    
    return (
      <div key={person.id} className="flex flex-col items-center">
        <FamilyMember
          name={person.name}
          birth={person.birth}
          death={person.death}
          spouse={person.spouse}
          isHighlighted={isHighlighted}
          onClick={() => togglePerson(person.id)}
          className={isExpanded ? "mb-8" : "mb-4"}
        />
        
        {isExpanded && person.children && person.children.length > 0 && (
          <div className={`tree-level ${level > 0 ? 'tree-connector' : ''}`}>
            <div className={`flex flex-wrap justify-center gap-6 ${person.children.length > 1 ? 'tree-siblings' : ''}`}>
              {person.children.map(child => renderPerson(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-container">
      <div className="family-tree">
        {renderPerson(rootPerson)}
      </div>
    </div>
  );
};

export default FamilyTree;
