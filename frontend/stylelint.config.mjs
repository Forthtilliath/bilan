/** Stylelint : regles standard, adaptees aux conventions du projet (classes BEM, jetons CSS). */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Classes BEM : bloc__element--modificateur.
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Classe attendue en BEM : bloc__element--modificateur' },
    ],
    // Jetons de theme regroupes par role, pas par ordre alphabetique.
    'custom-property-empty-line-before': null,
    // Les noms de polices de marque restent entre guillemets, comme dans la feuille Google Fonts.
    'font-family-name-quotes': null,
    // rgb(11 11 11 / 0.09) : notation moderne deja utilisee partout.
    'alpha-value-notation': 'number',
    // Les sections commentees aerent les feuilles longues.
    'comment-empty-line-before': null,
    // Selecteurs regroupes par composant, pas par specificite.
    'no-descending-specificity': null,
  },
};
