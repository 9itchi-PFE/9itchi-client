# Parcours Playwright

Des parcours dans les vraies pages du client, dans un vrai navigateur. Aucun service réel n’est appelé :

- la connexion que NextAuth fait côté serveur va à `mock-account.mjs` (deux comptes inventés, mot de passe `MotDePasse123`) ;
- tout ce que le navigateur demande aux services est répondu par `services.ts` (`mockServices`), qui garde aussi la liste des requêtes pour vérifier ce qui a été envoyé.

```bash
npm run e2e                                   # lance le serveur de dev sur 3101 et les parcours
PW_CHROME_PATH=/usr/bin/google-chrome npm run e2e   # avec un Chrome déjà installé
npx playwright install chromium               # sinon, le Chromium de Playwright
```

En CI (`.github/workflows/e2e.yml`), le client est construit avec les adresses de test puis démarré ; en cas d’échec, le rapport et les traces sont joints au run.

Les parcours : connexion (mauvais mot de passe, étudiant avec ou sans CV, page demandée avant la connexion, équipe et accès refusé à l’admin), offres (panneau, analyse de l’IA, sans abonnement), profil, modèles de CV côté admin, arabe de droite à gauche et anglais.
