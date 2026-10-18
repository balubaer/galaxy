---
name: commit-aenderungen
description: Committet die letzten Änderungen im Galaxy-Repo mit passender deutscher Commit-Nachricht. Verwenden, wenn der Benutzer "committe die letzten Änderungen" o. ä. sagt.
---

# Letzte Änderungen committen

Ziel: Die offenen Änderungen als sauberen Commit (oder wenige logische Commits) mit aussagekräftiger Nachricht einchecken. Nur committen, nie pushen.

## Ablauf

1. **Stand prüfen**: `git status --short`, `git diff --stat` und bei Bedarf `git diff` lesen. `git log --oneline -5` zeigt den Stil der bisherigen Nachrichten (deutsch, kurzer Titel). Ist das Verzeichnis kein Git-Repository, das melden und nichts anlegen.
2. **Nicht dazugehörendes aussortieren**:
   - `TestGame/**` und `Galaxy/Turn*/`: Die Tests von `libs/game-objects` (`world-generator`, `persistence-manager` u. a.) schreiben zufällige Welten dorthin. Geänderte Dateien in `TestGame/` mit `git checkout -- TestGame` zurücksetzen. Neue, unverfolgte Ordner wie `Galaxy/TurnN/` nicht einchecken, außer der Benutzer will es.
   - Fremde Änderungen des Benutzers (z. B. in `README.md`) gehören nur dazu, wenn sie zum Thema des Commits passen. Im Zweifel erwähnen, nicht stillschweigend mitnehmen oder zurücksetzen.
3. **Aufteilen, wenn sinnvoll**: Ein Bugfix in `libs/` und eine UI-Änderung in `apps/` sind getrennte Commits. Hängen Änderungen in derselben Datei zusammen, bleibt es ein Commit mit Stichpunkten.
4. **Vor dem Commit** (wenn Code geändert wurde): `npx nx build worlds` bzw. die betroffenen Jest-Tests laufen lassen. Für die App: `npx jest -c apps/worlds/jest.config.ts <pfad>`; für die Lib: `npx jest -c libs/game-objects/jest.config.ts <pfad>`. Die vollständige Lib-Suite überschreibt `TestGame/Turn0`, danach zurücksetzen (Schritt 2).
5. **Stagen**: Dateien gezielt per Pfad (`git add libs README.md`, `git add apps`), kein blindes `git add -A`.
6. **Nachricht schreiben** (deutsch):
   - Titelzeile: imperativ/knapp, was sich für den Benutzer ändert, max. ca. 70 Zeichen.
   - Leerzeile, dann Stichpunkte mit `-` zu den einzelnen Änderungen, bei Bugfixes kurz die Ursache.
   - Am Ende die Attribution-Zeile, die die Session vorgibt (`Co-Authored-By: ...`).
7. **Committen** mit HEREDOC bzw. mehreren `-m`-Argumenten, danach `git status --short` und `git log --oneline -3` prüfen.
8. **Antwort**: Hash und Titel jedes Commits nennen, übrig gebliebene unverfolgte oder bewusst nicht eingecheckte Dateien benennen, erwähnen dass nicht gepusht wurde.

## Regeln

- Nicht pushen, keinen Branch wechseln, nichts mit `--amend` oder `--force` umschreiben, außer der Benutzer verlangt es.
- Keine Hooks überspringen (`--no-verify`).
- Wenn nichts zu committen ist, das sagen statt einen leeren Commit zu erzeugen.
