import { angularConfig } from "@forthtilliath/eslint-config/angular";

export default [
  ...angularConfig,
  // Fichiers de configuration d'outils : hors du projet TypeScript analyse.
  { ignores: ["stylelint.config.mjs"] },
];
