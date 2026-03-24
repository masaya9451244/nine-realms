export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
} as const;

export const COLORS = {
  PRIMARY: 0xf4d03f,
  DANGER: 0xe74c3c,
  SUCCESS: 0x2ecc71,
  WARNING: 0xe67e22,
  BG_DARK: 0x1a1a2e,
  BG_MEDIUM: 0x16213e,
  TEXT_LIGHT: 0xffffff,
  TEXT_DARK: 0x2c3e50,
  GRID_LINE: 0x95a5a6,
  GRID_LINE_BOLD: 0x2c3e50,
  CELL_SELECTED: 0xd5e8d4,
  CELL_HIGHLIGHT: 0xfff2cc,
  CELL_ERROR: 0xf8cecc,
  CELL_FIXED: 0xdae8fc,
} as const;

export const FONTS = {
  DEFAULT: 'Arial',
  SIZE_SMALL: 14,
  SIZE_MEDIUM: 20,
  SIZE_LARGE: 32,
  SIZE_XLARGE: 48,
  SIZE_SUDOKU: 36,
} as const;

export const EVENTS = {
  BATTLE_START: 'battle-start',
  BATTLE_WIN: 'battle-win',
  BATTLE_LOSE: 'battle-lose',
  REALM_CLEAR: 'realm-clear',
  SHOP_OPEN: 'shop-open',
  SHOP_CLOSE: 'shop-close',
  DIALOG_NEXT: 'dialog-next',
  DIALOG_CLOSE: 'dialog-close',
} as const;
