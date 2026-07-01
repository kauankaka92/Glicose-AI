/**
 * Base de dados de alimentos brasileiros.
 * Cada alimento: nome, sinonimos, porcao (g), carbs, protein, fat, kcal
 */

const FOOD_DATABASE = [
  // Arroz e cereais
  { name: 'Arroz branco', synonyms: ['arroz', 'arroz branco', 'arroz cozido'], portion: 100, carbs: 28, protein: 2.7, fat: 0.3, kcal: 130 },
  { name: 'Arroz integral', synonyms: ['arroz integral'], portion: 100, carbs: 23, protein: 2.6, fat: 1, kcal: 111 },
  { name: 'Arroz e feijão', synonyms: ['arroz com feijão', 'arroz e feijao'], portion: 200, carbs: 40, protein: 6, fat: 0.8, kcal: 190 },
  { name: 'Feijão carioca', synonyms: ['feijão', 'feijao', 'feijão carioca', 'feijao carioca'], portion: 100, carbs: 14, protein: 5, fat: 0.5, kcal: 76 },
  { name: 'Feijão preto', synonyms: ['feijão preto', 'feijao preto'], portion: 100, carbs: 14, protein: 6, fat: 0.5, kcal: 77 },
  { name: 'Feijoada', synonyms: ['feijoada'], portion: 250, carbs: 28, protein: 22, fat: 15, kcal: 340 },

  // Carnes
  { name: 'Carne de sol', synonyms: ['carne de sol', 'carne-de-sol', 'carne seca'], portion: 100, carbs: 0, protein: 25, fat: 12, kcal: 215 },
  { name: 'Carne bovina', synonyms: ['carne', 'boi', 'maminha', 'picanha', 'alcatra', 'contrafilé', 'contrafile'], portion: 100, carbs: 0, protein: 26, fat: 15, kcal: 250 },
  { name: 'Frango grelhado', synonyms: ['frango', 'frango grelhado', 'peito de frango'], portion: 100, carbs: 0, protein: 31, fat: 3.6, kcal: 165 },
  { name: 'Frango frito', synonyms: ['frango frito'], portion: 100, carbs: 10, protein: 20, fat: 18, kcal: 290 },
  { name: 'Peixe', synonyms: ['peixe', 'tilápia', 'tilapia', 'salmao', 'salmão'], portion: 100, carbs: 0, protein: 25, fat: 8, kcal: 175 },
  { name: 'Porco', synonyms: ['porco', 'lombo', 'costela', 'pernil'], portion: 100, carbs: 0, protein: 22, fat: 20, kcal: 270 },
  { name: 'Linguiça', synonyms: ['linguiça', 'linguiça calabresa', 'linguica'], portion: 50, carbs: 1, protein: 12, fat: 18, kcal: 215 },

  // Pães
  { name: 'Pão francês', synonyms: ['pão', 'pao', 'pão francês', 'pao frances', 'pãozinho'], portion: 50, carbs: 28, protein: 5, fat: 1, kcal: 135 },
  { name: 'Pão integral', synonyms: ['pão integral', 'pao integral'], portion: 50, carbs: 22, protein: 4, fat: 1, kcal: 110 },
  { name: 'Pão de queijo', synonyms: ['pão de queijo', 'pao de queijo'], portion: 50, carbs: 22, protein: 4, fat: 8, kcal: 175 },
  { name: 'Tapioca', synonyms: ['tapioca', 'beiju'], portion: 100, carbs: 35, protein: 0.5, fat: 0.2, kcal: 145 },

  // Massas
  { name: 'Macarrão', synonyms: ['macarrão', 'macarrao', 'espaguete', 'massa'], portion: 100, carbs: 30, protein: 5, fat: 1, kcal: 150 },
  { name: 'Lasanha', synonyms: ['lasanha', 'lasanha a bolonhesa'], portion: 200, carbs: 28, protein: 15, fat: 12, kcal: 280 },
  { name: 'Pizza', synonyms: ['pizza', 'pizza margherita', 'pizza calabresa'], portion: 150, carbs: 40, protein: 10, fat: 15, kcal: 335 },

  // Vegetais
  { name: 'Salada', synonyms: ['salada', 'alface', 'tomate', 'salada verde'], portion: 100, carbs: 3, protein: 1, fat: 0.2, kcal: 15 },
  { name: 'Batata', synonyms: ['batata', 'batata inglesa', 'batata frita'], portion: 100, carbs: 17, protein: 2, fat: 0.1, kcal: 77 },
  { name: 'Batata frita', synonyms: ['batata frita', 'fritas', 'french fries'], portion: 100, carbs: 35, protein: 3, fat: 15, kcal: 290 },
  { name: 'Mandioca', synonyms: ['mandioca', 'aipim', 'macaxeira'], portion: 100, carbs: 28, protein: 0.6, fat: 0.3, kcal: 115 },
  { name: 'Batata doce', synonyms: ['batata doce'], portion: 100, carbs: 20, protein: 1, fat: 0.1, kcal: 86 },

  // Ovos
  { name: 'Ovo frito', synonyms: ['ovo', 'ovo frito', 'ovos'], portion: 50, carbs: 0.5, protein: 6, fat: 7, kcal: 90 },
  { name: 'Ovo cozido', synonyms: ['ovo cozido'], portion: 50, carbs: 0.5, protein: 6, fat: 5, kcal: 70 },

  // Lanches
  { name: 'Hambúrguer', synonyms: ['hamburguer', 'hambúrguer', 'burger', 'x-burger', 'xis'], portion: 150, carbs: 30, protein: 18, fat: 20, kcal: 370 },
  { name: 'Hot dog', synonyms: ['hot dog', 'cachorro quente'], portion: 150, carbs: 25, protein: 10, fat: 12, kcal: 250 },

  // Bebidas
  { name: 'Suco de laranja', synonyms: ['suco', 'suco de laranja', 'suco natural'], portion: 200, carbs: 22, protein: 2, fat: 0.5, kcal: 95 },
  { name: 'Refrigerante', synonyms: ['refri', 'coca', 'coca-cola', 'guaraná', 'guarana', 'refrigerante'], portion: 350, carbs: 35, protein: 0, fat: 0, kcal: 140 },
  { name: 'Café', synonyms: ['café', 'cafe', 'café preto'], portion: 50, carbs: 0, protein: 0.5, fat: 0, kcal: 3 },
  { name: 'Café com leite', synonyms: ['café com leite', 'cafe com leite'], portion: 200, carbs: 6, protein: 4, fat: 3, kcal: 65 },

  // Frutas
  { name: 'Banana', synonyms: ['banana', 'banana prata', 'banana nanica'], portion: 100, carbs: 23, protein: 1, fat: 0.3, kcal: 92 },
  { name: 'Maçã', synonyms: ['maçã', 'maca', 'maça'], portion: 100, carbs: 15, protein: 0.3, fat: 0.2, kcal: 60 },
  { name: 'Laranja', synonyms: ['laranja'], portion: 100, carbs: 11, protein: 0.9, fat: 0.2, kcal: 47 },
  { name: 'Mamão', synonyms: ['mamão', 'mamão papaya', 'mamao'], portion: 100, carbs: 10, protein: 0.5, fat: 0.1, kcal: 43 },
  { name: 'Manga', synonyms: ['manga'], portion: 100, carbs: 15, protein: 0.8, fat: 0.5, kcal: 65 },
  { name: 'Abacaxi', synonyms: ['abacaxi'], portion: 100, carbs: 12, protein: 0.5, fat: 0.1, kcal: 50 },
  { name: 'Melancia', synonyms: ['melancia'], portion: 100, carbs: 7, protein: 0.6, fat: 0.1, kcal: 30 },

  // Café da manhã
  { name: 'Manteiga', synonyms: ['manteiga'], portion: 10, carbs: 0, protein: 0.1, fat: 8, kcal: 72 },
  { name: 'Queijo', synonyms: ['queijo', 'queijo minas', 'mussarela'], portion: 30, carbs: 0.5, protein: 7, fat: 6, kcal: 85 },
  { name: 'Presunto', synonyms: ['presunto'], portion: 30, carbs: 1, protein: 6, fat: 2, kcal: 45 },
  { name: 'Mortadela', synonyms: ['mortadela'], portion: 30, carbs: 0.5, protein: 5, fat: 5, kcal: 70 },
  { name: 'Corn flakes', synonyms: ['sucrilhos', 'corn flakes', 'cereais'], portion: 30, carbs: 25, protein: 2, fat: 0.3, kcal: 110 },

  // Churrasco
  { name: 'Churrasco', synonyms: ['churrasco', 'churras', 'barbecue'], portion: 200, carbs: 5, protein: 45, fat: 25, kcal: 430 },
  { name: 'Picanha', synonyms: ['picanha', 'picanha gordurosa'], portion: 150, carbs: 0, protein: 32, fat: 28, kcal: 390 },
  { name: 'Costela', synonyms: ['costela', 'costela bovina'], portion: 150, carbs: 0, protein: 28, fat: 32, kcal: 410 },

  // Doces
  { name: 'Bolo', synonyms: ['bolo', 'bolo de chocolate', 'bolo de cenoura'], portion: 80, carbs: 40, protein: 3, fat: 8, kcal: 240 },
  { name: 'Brigadeiro', synonyms: ['brigadeiro', 'brigadeiros'], portion: 30, carbs: 15, protein: 1, fat: 4, kcal: 100 },
  { name: 'Sorvete', synonyms: ['sorvete'], portion: 100, carbs: 22, protein: 3, fat: 10, kcal: 190 },
  { name: 'Chocolate', synonyms: ['chocolate', 'choc', 'cacau'], portion: 30, carbs: 17, protein: 2, fat: 9, kcal: 155 },

  // Bebidas alcoólicas
  { name: 'Cerveja', synonyms: ['cerveja', 'breja', 'skol', 'brahma', 'antarctica'], portion: 350, carbs: 13, protein: 0.5, fat: 0, kcal: 150 },
  { name: 'Vinho', synonyms: ['vinho', 'vinho tinto'], portion: 150, carbs: 4, protein: 0.1, fat: 0, kcal: 125 },
  { name: 'Caipirinha', synonyms: ['caipirinha', 'caipiroska'], portion: 200, carbs: 18, protein: 0, fat: 0, kcal: 160 },
];

// Index para busca rápida
const foodIndex = {};
FOOD_DATABASE.forEach(food => {
  foodIndex[food.name.toLowerCase()] = food;
  food.synonyms.forEach(s => {
    foodIndex[s.toLowerCase()] = food;
  });
});

function findFood(query) {
  const q = query.toLowerCase().trim();
  if (foodIndex[q]) return { ...foodIndex[q] };

  // Busca parcial
  for (const key in foodIndex) {
    if (key.includes(q) || q.includes(key)) {
      return { ...foodIndex[key] };
    }
  }
  return null;
}

function parseFoodList(text) {
  const words = text.toLowerCase()
    .replace(/comi|almocei|jantei|comi| Tomei| tomei|comer|comemos/gi, '')
    .replace(/[.,;]+/g, ',')
    .split(/[,e&]+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  const found = [];
  const unknown = [];

  words.forEach(w => {
    const food = findFood(w);
    if (food) {
      const existing = found.find(f => f.name === food.name);
      if (!existing) found.push(food);
    } else if (w.length > 2) {
      unknown.push(w);
    }
  });

  return { foods: found, unknown };
}

export { FOOD_DATABASE, foodIndex, findFood, parseFoodList };
