
import { Person } from '@/components/FamilyTree';

// Datos del árbol genealógico
export const familyData: Person = {
  id: "domenico",
  name: "Domenico (Domingo) Sangiovanni Cino",
  birth: "17/12/1845",
  death: "21/09/1928",
  spouse: "María Rosa Grisolia",
  spouseBirth: "18/07/1852",
  children: [
    {
      id: "maria-magdalena",
      name: "María Magdalena Sangiovanni",
      birth: "27/04/1874",
      death: "07/05/1935",
      spouse: "Vincenzo de Paola",
      parentId: "domenico",
      children: [
        {
          id: "alessandro",
          name: "Alessandro de Paola Sangiovanni",
          birth: "18/10/1911",
          death: "14/01/1998",
          isHighlightedAncestor: true,
          parentId: "maria-magdalena"
        }
      ]
    },
    {
      id: "vincenzo",
      name: "Vincenzo (Vicente) Sangiovanni",
      birth: "13/08/1880",
      death: "07/02/1958",
      spouse: "María Balbina Pérez Álvarez",
      parentId: "domenico",
      children: [
        {
          id: "maria-rosa",
          name: "María Rosa Sangiovanni Pérez",
          birth: "18/02/1906",
          death: "07/08/1981",
          spouse: "Pedro Pablo Sangiovanni Simo",
          parentId: "vincenzo",
          children: [
            {
              id: "victor-manuel",
              name: "Víctor Manuel Sangiovanni Sangiovanni",
              birth: "29/10/1932",
              death: "21/10/2007",
              spouse: "Ana Julia Rodríguez",
              parentId: "maria-rosa",
              children: [
                {
                  id: "rosa-julia",
                  name: "Rosa Julia Sangiovanni Rodríguez",
                  birth: "15/04/1963",
                  death: "04/10/2024",
                  spouse: "Francisco Brea",
                  parentId: "victor-manuel",
                  children: [
                    {
                      id: "perla-rosa",
                      name: "Perla Rosa Brea Sangiovanni",
                      birth: "30/04/1989",
                      parentId: "rosa-julia"
                    }
                  ]
                },
                {
                  id: "victor-manuel-martin",
                  name: "Víctor Manuel Martín Sangiovanni Rodríguez",
                  birth: "08/11/1966",
                  parentId: "victor-manuel"
                }
              ]
            }
          ]
        },
        {
          id: "domingo-ramon",
          name: "Domingo Ramón Sangiovanni Pérez",
          birth: "11/07/1907",
          death: "03/09/1981",
          spouse: "María Francisca Gesualdo",
          parentId: "vincenzo",
          children: [
            {
              id: "maria-amparo",
              name: "María Amparo Sangiovanni Gesualdo",
              birth: "30/10/1929",
              death: "15/01/2004",
              spouse: "Bernardo Edmundo Lizardo Fernández",
              parentId: "domingo-ramon",
              children: [
                {
                  id: "bernardo-martin",
                  name: "Bernardo Martín Lizardo Sangiovanni",
                  birth: "28/10/1966",
                  parentId: "maria-amparo"
                }
              ]
            },
            {
              id: "jose-vicente",
              name: "José Vicente Sangiovanni Gesualdo",
              birth: "19/04/1932",
              death: "24/04/1976",
              spouse: "Ozema Báez",
              parentId: "domingo-ramon",
              children: [
                {
                  id: "jocelyn",
                  name: "Jocelyn del Jesús Sangiovanni Báez",
                  birth: "06/10/1963",
                  parentId: "jose-vicente"
                },
                {
                  id: "mayra",
                  name: "Mayra Josefina Sangiovanni Báez",
                  birth: "20/11/1965",
                  parentId: "jose-vicente"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "paolo",
      name: "Paolo (Paulino) Sangiovanni",
      birth: "17/01/1885",
      death: "31/03/1936",
      spouse: "Simona Simo",
      parentId: "domenico",
      children: [
        {
          id: "pedro-pablo",
          name: "Pedro Pablo Sangiovanni Simo",
          birth: "29/10/1906",
          death: "04/10/1986",
          parentId: "paolo"
        }
      ]
    }
  ]
};
