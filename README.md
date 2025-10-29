# 🎙️ Outil de Transcription Audio en Temps Réel avec Vosk

Ce projet a pour objectif de fournir une solution de retranscription audio **en temps réel**, **à faible coût** et **entièrement locale**, garantissant ainsi la confidentialité des données.

La solution retenue est le moteur de reconnaissance vocale **Vosk**, qui permet d'obtenir une transcription fiable et instantanée directement sur votre machine, sans dépendre d'une connexion internet ou de services cloud payants.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir **Python 3** installé sur votre système.

1. **Créez un dossier** pour le projet et placez-y votre script Python.
2. **Ouvrez un terminal** (PowerShell sur Windows, Terminal sur macOS/Linux) dans ce dossier.
3. **Installez les bibliothèques Python nécessaires** avec la commande suivante :

```bash
pip install vosk sounddevice numpy
```

---

## ⚙️ Installation et Configuration

Le bon fonctionnement du script dépend de l'installation correcte du modèle de langue Vosk.

### Étape 1 : Télécharger le Modèle de Langue

1. Rendez-vous sur la page officielle des modèles Vosk : [https://alphacephei.com/vosk/models](https://alphacephei.com/vosk/models)
2. Téléchargez le modèle souhaité. Pour une bonne précision en français, il est recommandé de choisir `vosk-model-fr-0.22`.
3. Vous obtiendrez un fichier `.zip`.

### Étape 2 : Placer le Modèle dans le Projet

1. **Décompressez le fichier `.zip`** que vous venez de télécharger.
2. Vous obtiendrez un dossier (par exemple, `vosk-model-fr-0.22`).
3. **Placez ce dossier** à la racine de votre projet, au même niveau que votre script Python.

Votre arborescence de projet devrait ressembler à ceci :

```
/votre_projet/
├── python micro_whisper.py <-- Votre script Python
└── vosk-model-fr-0.22/    <-- Le dossier du modèle décompressé
    ├── am/
    ├── conf/
    └── ...
```

### Étape 3 : Configurer le Script

1. Ouvrez votre script Python (`transcribe_vosk.py`).
2. Localisez la ligne contenant la variable `MODEL_PATH`.
3. **Assurez-vous que la valeur correspond exactement au nom du dossier** du modèle que vous avez téléchargé.

```python
# --- Paramètres ---
# Mettez ici le nom du dossier du modèle que vous avez décompressé
MODEL_PATH = "vosk-model-fr-0.22"
```

---

## ▶️ Lancement de l'Outil

Une fois la configuration terminée, vous pouvez lancer la transcription.

Assurez-vous que votre micro est bien branché et fonctionnel.

Dans votre terminal, à la racine du projet, exécutez la commande :

```bash
python micro_whisper.py
```

Le message 🎙️ `L'écoute est active. Parlez dans votre micro.` s'affichera.

Commencez à parler : la transcription apparaîtra dans le terminal dès que vous marquerez une pause.

Pour arrêter le programme, appuyez simplement sur **Ctrl + C** dans le terminal.
