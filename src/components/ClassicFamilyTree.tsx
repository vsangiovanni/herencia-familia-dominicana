
import React from 'react';
import { Person } from './FamilyTree';
import { cn } from '@/lib/utils';

interface ClassicFamilyTreeProps {
  rootPerson: Person;
}

const ClassicFamilyTree: React.FC<ClassicFamilyTreeProps> = ({ rootPerson }) => {
  const renderTree = (person: Person, isRoot: boolean = false) => {
    return (
      <li key={person.id}>
        <div className={cn(
          "relative flex flex-col items-center",
          isRoot ? "pt-0" : "pt-5"
        )}>
          {/* Persona */}
          <div className={cn(
            "border-2 p-2 mb-2 bg-white rounded-md min-w-[200px]",
            person.isHighlightedAncestor ? "border-legal-gold bg-legal-beige" : "border-legal-blue/30"
          )}>
            <h3 className="font-serif font-bold text-legal-blue text-center">{person.name}</h3>
            <div className="text-xs text-gray-600 text-center">
              {person.birth && <span>n. {person.birth}</span>}
              {person.birth && person.death && <span> - </span>}
              {person.death && <span>m. {person.death}</span>}
            </div>
            {person.spouse && (
              <div className="text-xs mt-1 text-center">
                <span className="text-legal-gray">Cónyuge: </span>
                {person.spouse}
              </div>
            )}
          </div>
          
          {/* Descendientes */}
          {person.children && person.children.length > 0 && (
            <ul className="flex flex-row space-x-4 relative">
              {/* Línea vertical desde el padre a los hijos */}
              <div className="absolute h-5 w-0.5 bg-legal-blue -top-5 left-1/2 transform -translate-x-1/2"></div>
              
              {/* Línea horizontal sobre los hijos si hay más de uno */}
              {person.children.length > 1 && (
                <div className="absolute h-0.5 bg-legal-blue top-0 left-0 right-0"></div>
              )}
              
              {person.children.map(child => renderTree(child))}
            </ul>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="classic-family-tree p-8 overflow-auto">
      <ul className="flex justify-center">
        {renderTree(rootPerson, true)}
      </ul>
      
      <style jsx>{`
        .classic-family-tree {
          min-width: 100%;
          min-height: 500px;
        }
        
        .classic-family-tree ul {
          padding-top: 20px;
          position: relative;
          transition: all 0.5s;
        }
        
        .classic-family-tree li {
          float: left;
          text-align: center;
          list-style-type: none;
          position: relative;
          padding: 20px 5px 0 5px;
          transition: all 0.5s;
        }
      `}</style>
    </div>
  );
};

export default ClassicFamilyTree;
