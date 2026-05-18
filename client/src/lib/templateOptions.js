const GAME_OPTIONS = [
  'Counter-Strike 2',
  'Dota 2',
  'Valorant',
  'League of Legends',
  'Apex Legends'
];

const DEFAULT_OPTIONS = {
  roles: ['Не указывать', 'Универсальная роль', 'Капитан', 'Тренер'],
  ranks: ['Не указывать', 'Начальный', 'Средний', 'Продвинутый']
};

const GAME_CONFIG = {
  'Counter-Strike 2': {
    roles: ['Не указывать', 'Entry fragger', 'AWPer', 'IGL', 'Support', 'Lurker', 'Rifler'],
    ranks: ['Не указывать', 'Premier до 5000', 'Premier 5000-10000', 'Premier 10000-15000', 'Premier 15000+']
  },
  'Dota 2': {
    roles: ['Не указывать', 'Carry', 'Midlaner', 'Offlaner', 'Soft Support', 'Hard Support'],
    ranks: ['Не указывать', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal']
  },
  Valorant: {
    roles: ['Не указывать', 'Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'],
    ranks: ['Не указывать', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant']
  },
  'League of Legends': {
    roles: ['Не указывать', 'Top', 'Jungle', 'Mid', 'ADC', 'Support'],
    ranks: ['Не указывать', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master+']
  },
  'Apex Legends': {
    roles: ['Не указывать', 'Entry fragger', 'Support', 'Recon', 'Controller', 'Flex'],
    ranks: ['Не указывать', 'Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator']
  }
};

function normalizeOptionalValue(value) {
  return value === 'Не указывать' ? '' : value;
}

function getTemplateOptions(gameName) {
  return GAME_CONFIG[gameName] ?? DEFAULT_OPTIONS;
}

function buildSelectOptions(options, selectedValue) {
  if (!selectedValue || options.includes(selectedValue)) {
    return options;
  }

  return [...options, selectedValue];
}

export {
  GAME_OPTIONS,
  buildSelectOptions,
  getTemplateOptions,
  normalizeOptionalValue
};
