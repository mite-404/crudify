#!/usr/bin/env bash
set -eo pipefail  # Interrompe lo script se un comando fallisce

# === FUNZIONI DI SUPPORTO ===
function print_title() {
  echo
  echo "=================================================="
  echo " $1"
  echo "=================================================="
}

# === INFO PACCHETTO ===
PACKAGE_NAME=$(node -p "require('./package.json').name")
CURRENT_VERSION=$(node -p "require('./package.json').version")

print_title "📦 Preparazione alla pubblicazione di $PACKAGE_NAME@$CURRENT_VERSION"

# === SCELTA VERSIONE ===
echo "Quale tipo di versione vuoi pubblicare?"
echo "1) patch  → correzioni minori"
echo "2) minor  → nuove feature retrocompatibili"
echo "3) major  → cambiamenti incompatibili"
read -p "Seleziona (1/2/3): " VERSION_CHOICE

case "$VERSION_CHOICE" in
  1)
    VERSION_TYPE="patch"
    ;;
  2)
    VERSION_TYPE="minor"
    ;;
  3)
    VERSION_TYPE="major"
    ;;
  *)
    echo "❌ Scelta non valida. Annullato."
    exit 1
    ;;
esac

print_title "🔢 Aggiornamento versione ($VERSION_TYPE)"
npm version "$VERSION_TYPE" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Versione aggiornata: $CURRENT_VERSION → $NEW_VERSION"

# === TEST E BUILD ===
print_title "🧪 Test della libreria"
npm test

print_title "🏗️ Build della libreria"
rm -rf dist
npm run build

# === PACK ===
print_title "🧪 Creazione pacchetto npm"
PACKAGE_FILE=$(npm pack --silent | tail -n1)
if [[ ! -f "$PACKAGE_FILE" ]]; then
  echo "❌ Creazione del pacchetto fallita."
  exit 1
fi
echo "📄 Pacchetto generato: $PACKAGE_FILE"

# === CONFERMA PUBBLICAZIONE ===
read -p "Vuoi pubblicare $PACKAGE_NAME@$NEW_VERSION su npm? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
  echo "❌ Pubblicazione annullata."
  rm -f "$PACKAGE_FILE"
  exit 0
fi

# === PUBBLICAZIONE ===
print_title "🚀 Pubblicazione su npm"
npm publish "$PACKAGE_FILE" --access public
rm -f "$PACKAGE_FILE"

print_title "✅ Pubblicato con successo $PACKAGE_NAME@$NEW_VERSION"
