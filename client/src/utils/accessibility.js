export const fontClass = (font) => {
  switch (font) {
    case 'Lexend':
      return 'font-lexend';
    case 'OpenDyslexic':
      return 'font-open-dyslexic';
    case 'JetBrains Mono':
      return 'font-jetbrains';
    case 'Inter':
    default:
      return 'font-inter';
  }
};

export const sizeClass = (size) => {
  switch (size) {
    case 'small':
      return 'size-small';
    case 'large':
      return 'size-large';
    case 'medium':
    default:
      return 'size-medium';
  }
};

export const modeClass = (mode) => {
  switch (mode) {
    case 'simplified':
      return 'simplified-reading';
    case 'focus':
      return 'focus-reading';
    case 'listen':
    case 'normal':
    default:
      return '';
  }
};
