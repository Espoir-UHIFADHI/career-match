# Career Match - AI-Powered Career Assistant

Career Match est une application web moderne conçue pour optimiser votre recherche d'emploi grâce à l'intelligence artificielle. Elle offre une suite d'outils pour analyser votre CV, prédire des emails professionnels et faciliter le networking.

![Career Match Banner](https://via.placeholder.com/1200x400?text=Career+Match+Dashboard)

## 🚀 Fonctionnalités Principales

### 1. Analyse et Optimisation de CV
- **Analyse IA** : Compare votre CV avec une description de poste spécifique.
- **Score de Correspondance** : Obtient un score de pertinence basé sur des critères clés.
- **Recommandations** : Reçoit des suggestions concrètes pour améliorer votre CV (mots-clés manquants, structure, etc.).
- **Génération PDF** : Télécharge une version optimisée de votre CV.

### 2. Email Predictor (Outil de Networking)
- **Découverte de Patterns** : Trouve le format d'email utilisé par une entreprise (ex: `prenom.nom@entreprise.com`).
- **Génération d'Emails** : Génère l'email professionnel probable d'un recruteur à partir de son nom et de l'entreprise.
- **Vérification** : (À venir) Vérification de l'existence de l'email.

### 3. Assistant de Networking
- **Stratégies d'Approche** : Conseils pratiques pour contacter efficacement les recruteurs et les employés (Approche Chaleureuse, Valeur avant tout, Relance Intelligente).
- **Modèles de Messages** : Bibliothèque de templates personnalisables pour :
    - Connexions LinkedIn (Anciens élèves, Spontanée).
    - Emails de demande de conseils.
    - Messages de relance.
- **Personnalisation Facile** : Remplissage automatique des champs (Nom, Entreprise) et copie en un clic.

### 4. Gestion de Données et Persistance
- **Sauvegarde Automatique** : Vos données de CV sont sauvegardées localement dans votre navigateur, vous permettant de reprendre votre travail même après un rafraîchissement de la page.
- **Base de Données Supabase** : (En cours d'intégration) Stockage sécurisé des profils utilisateurs et des crédits.

## 🛠 Technologies Utilisées

Ce projet est construit avec une stack moderne et performante :

- **Frontend** : [React](https://react.dev/) (v18) avec [TypeScript](https://www.typescriptlang.org/).
- **Build Tool** : [Vite](https://vitejs.dev/) pour un développement rapide.
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) pour un design responsive et élégant.
- **IA** : [Google Gemini API](https://ai.google.dev/) pour l'analyse de texte et la génération de contenu.
- **Backend/Auth** : [Supabase](https://supabase.com/) & [Clerk](https://clerk.com/).
- **State Management** : [Zustand](https://github.com/pmndrs/zustand) avec persistance locale.
- **Icônes** : [Lucide React](https://lucide.dev/).

## 📦 Installation et Démarrage

Suivez ces étapes pour lancer le projet localement :

1.  **Cloner le dépôt**
    ```bash
    git clone https://github.com/Espoir-UHIFADHI/career-match.git
    cd career-match
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Configurer les variables d'environnement**
    Créez un fichier `.env` à la racine du projet et ajoutez votre clé API Gemini :
    ```env
    VITE_GEMINI_API_KEY=votre_cle_api_ici
    ```

4.  **Lancer le serveur de développement**
    ```bash
    npm run dev
    ```
    L'application sera accessible à l'adresse `http://localhost:5173`.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une Pull Request pour proposer des améliorations.

## 📄 Licence

Ce projet est sous licence MIT.
