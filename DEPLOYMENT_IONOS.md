# Deployment auf einem IONOS VPS

Beschreibt, wie Galaxy auf einem IONOS VPS (VPS 1-2-60: 1 vCore, 2 GB RAM, 60 GB NVMe,
Ubuntu mit Docker-Image) läuft. Der Aufbau entspricht dem EC2-Deployment aus
[DEPLOYMENT.md](DEPLOYMENT.md), nur mit Ubuntu-Befehlen (`apt`). Docker ist auf dem Image
vorinstalliert, wird hier aber **nicht** gebraucht: Backend und Proxy laufen direkt als
systemd-Dienste.

```
Internet → Caddy (80/443, HTTPS)
             ├─ /api/*  → NestJS (127.0.0.1:3000, systemd-Dienst galaxy-api)
             └─ /*      → Angular-Build (statische Dateien in /opt/galaxy/web)
```

> Das Repo ist öffentlich. Trage hier keine IP-Adressen, Schlüssel oder Passwörter ein.
> Nachfolgend stehen `<VPS-IP>` und `<DOMAIN>` als Platzhalter.

## Verzeichnisse auf dem Server

| Pfad | Inhalt |
|---|---|
| `/opt/galaxy/api` | gebautes Backend (`main.js`, `package.json`, `node_modules`) |
| `/opt/galaxy/web` | gebautes Frontend (Angular) |
| `/opt/galaxy/data` | Spieldaten und Arbeitsverzeichnis des Backends |
| `/etc/caddy` | `Caddyfile` und `certs/` |

Das Backend liest und schreibt seine JSON-Dateien **relativ zum Arbeitsverzeichnis**
(`user.json`, `adminLogin.json`, `gamePref.json`, `color.json`, `fontColor.json`, Spielordner
wie `Galaxy/` und `TestGame/`). Der Dienst läuft deshalb mit `WorkingDirectory=/opt/galaxy/data`.

## 1. VPS vorbereiten (IONOS Cloud Panel)

1. **Firewall-Richtlinie** des VPS öffnen und Inbound erlauben: **22** (SSH, möglichst nur
   die eigene IP), **80** und **443** (TCP). Port 3000 bleibt zu. Die Richtlinie muss dem
   Server zugewiesen sein.
2. **DNS** (IONOS: Domains & SSL → DNS): A-Record `galaxy` → `<VPS-IP>`. Die IPv4-Adresse
   eines IONOS-VPS ist fest und ändert sich beim Neustart nicht. Es gibt keine IPv6-Adresse,
   also keinen AAAA-Record anlegen.
3. **Zugang:** Beim Erstellen wurde entweder ein Root-Passwort oder ein SSH-Schlüssel
   hinterlegt. Ein Schlüssel ist sicherer. Passwort-Login später abschalten (Schritt 2).

### Eigenen SSH-Schlüssel für das Projekt erzeugen

Für dieses Projekt bekommt der Server einen eigenen Schlüssel, getrennt von anderen Servern
und Diensten. Auf dem **eigenen Rechner**:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/galaxy_ionos -C "galaxy-ionos"
```

- Bei der Passphrase-Abfrage besser eine Passphrase setzen. Der macOS-Schlüsselbund merkt sie
  sich mit `ssh-add --apple-use-keychain ~/.ssh/galaxy_ionos`.
- Es entstehen zwei Dateien: `~/.ssh/galaxy_ionos` (**privat**, bleibt auf dem Rechner, nie ins
  Git-Repo oder per Mail) und `~/.ssh/galaxy_ionos.pub` (öffentlich, kommt auf den Server).
- Rechte prüfen: `chmod 600 ~/.ssh/galaxy_ionos`

Damit nicht bei jedem Befehl `-i` nötig ist, einen Eintrag in `~/.ssh/config` anlegen:

```
Host galaxy-ionos
    HostName <VPS-IP>
    User galaxy
    IdentityFile ~/.ssh/galaxy_ionos
    IdentitiesOnly yes
```

Danach gilt `ssh galaxy-ionos` (und `rsync … galaxy-ionos:/pfad`). Der öffentliche Schlüssel
wird in Schritt 2 auf dem Server hinterlegt. Den Inhalt zeigt:

```bash
cat ~/.ssh/galaxy_ionos.pub
```

Erste Verbindung (als `root`, noch ohne den neuen Schlüssel):

```bash
ssh root@<VPS-IP>
```

## 2. Server einrichten (einmalig, als root)

Der Benutzer `galaxy` bekommt **bewusst kein Passwort**: Er meldet sich nur per SSH-Schlüssel
an, und `sudo` läuft ohne Passwortabfrage. Ohne hinterlegten Schlüssel kann er sich also
nicht anmelden. Wer lieber ein Passwort möchte, setzt es mit `passwd galaxy` und entfernt die
`NOPASSWD`-Zeile (dann fragt `sudo` danach).

Den Schlüssel `~/.ssh/galaxy_ionos` hast du in Schritt 1 erzeugt.

Benutzer anlegen (als root auf dem VPS):

```bash
adduser --disabled-password --gecos "" galaxy
usermod -aG sudo galaxy
echo 'galaxy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/galaxy
chmod 440 /etc/sudoers.d/galaxy
mkdir -p /home/galaxy/.ssh
chmod 700 /home/galaxy/.ssh
```

Öffentlichen Schlüssel für `galaxy` hinterlegen. Wurde der VPS mit einem Schlüssel angelegt,
kann man den von root übernehmen (`cp ~/.ssh/authorized_keys /home/galaxy/.ssh/`). Wurde er
mit einem Root-**Passwort** angelegt, existiert diese Datei nicht. Dann den Schlüssel als root
eintragen (auf dem eigenen Rechner `cat ~/.ssh/galaxy_ionos.pub` kopieren, dann auf dem VPS):

```bash
echo '<INHALT-DER-.pub-DATEI>' >> /home/galaxy/.ssh/authorized_keys
chmod 600 /home/galaxy/.ssh/authorized_keys
chown -R galaxy:galaxy /home/galaxy/.ssh
```

Vom eigenen Rechner testen, **bevor** du die Root-Sitzung schließt:

```bash
ssh galaxy-ionos
```

Klappt das, Passwort-Login und Root-Login abschalten (nur wenn der Schlüssel-Login geht):

```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

Ab hier alles als Benutzer `galaxy`. System aktualisieren und Node.js installieren
(das Projekt verlangt Node 24, siehe `.nvmrc`):

```bash
sudo apt update && sudo apt -y upgrade
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs rsync
node -v        # v24.x

sudo mkdir -p /opt/galaxy/{api,web,data}
sudo chown -R galaxy:galaxy /opt/galaxy
```

Optional eine lokale Firewall (zusätzlich zur IONOS-Richtlinie):

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable
```

> Docker läuft evtl. schon und belegt Ports. Mit `sudo ss -tlnp` prüfen, dass 80 und 443
> frei sind. Falls ein vorinstallierter Dienst (z. B. Plesk, Apache) sie belegt, vorher
> stoppen und deaktivieren: `sudo systemctl disable --now apache2`.

## 3. Lokal bauen

Gebaut wird auf dem eigenen Rechner (der VPS hat nur 1 vCore):

```bash
npx nx build api --configuration=production
npx nx build worlds --configuration=production
```

`apps/api/webpack.config.js` setzt `generatePackageJson: true`. Dadurch liegt in
`dist/apps/api` eine `package.json` mit den Laufzeit-Abhängigkeiten.

## 4. Hochladen

```bash
SSH="ssh"
HOST=galaxy-ionos

rsync -az -e "$SSH" dist/apps/api/ $HOST:/opt/galaxy/api/
rsync -az --delete -e "$SSH" dist/apps/worlds/ $HOST:/opt/galaxy/web/
$SSH $HOST 'cd /opt/galaxy/api && npm install --omit=dev'
```

Wichtig:

- Quellpfade mit abschließendem `/` kopieren den **Inhalt** des Ordners.
- Der **Zielpfad ist Pflicht**. Ohne Ziel bzw. mit falschem Ziel löscht `--delete` Dateien
  im Zielverzeichnis.
- `--delete` nur für `web/` verwenden, **nie** für `data/`.

### Spieldaten hochladen

```bash
rsync -avz -e "$SSH" gamePref.json color.json fontColor.json Galaxy TestGame $HOST:/opt/galaxy/data/
rsync -avz -e "$SSH" user.json $HOST:/opt/galaxy/data/
$SSH $HOST 'chmod 600 /opt/galaxy/data/user.json'
```

`user.json` und `adminLogin.json` enthalten Zugangsdaten und werden nur bewusst
hochgeladen. Ohne `adminLogin.json` kann der Admin unter `/admin/set-admin` angelegt werden.

## 5. Backend als systemd-Dienst

`/etc/systemd/system/galaxy-api.service` (mit `sudo nano …` anlegen):

```ini
[Unit]
Description=Galaxy API
After=network.target

[Service]
User=galaxy
WorkingDirectory=/opt/galaxy/data
Environment=PORT=3000
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/galaxy/api/main.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now galaxy-api
```

Logs: `journalctl -u galaxy-api -f`

## 6. Caddy installieren

Für Ubuntu gibt es ein offizielles Paket-Repository. Die Installation richtet den Dienst
`caddy` samt Benutzer, Verzeichnissen und systemd-Unit selbst ein:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Falls das Repository für die Ubuntu-Version nicht verfügbar ist, geht auch das Binary
(dann Benutzer und systemd-Unit wie in [DEPLOYMENT.md](DEPLOYMENT.md), Abschnitt 6):

```bash
sudo curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/local/bin/caddy
sudo chmod +x /usr/local/bin/caddy
```

## 7. Caddyfile

`/etc/caddy/Caddyfile`:

```
<DOMAIN> {
    encode gzip

    handle /api/* {
        reverse_proxy 127.0.0.1:3000
    }

    handle {
        root * /opt/galaxy/web
        try_files {path} /index.html
        file_server
    }
}
```

- `/api/*` geht an das Backend (es nutzt den Prefix `/api`).
- `try_files` leitet unbekannte Pfade auf `index.html`, damit Angular-Routen beim Neuladen funktionieren.
- Caddy holt automatisch ein kostenloses Let's-Encrypt-Zertifikat und erneuert es selbst.
  Voraussetzung: Port 80 und 443 sind offen, und die Domain zeigt per A-Record auf den VPS.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Der Caddy-Dienst muss `/opt/galaxy/web` lesen können. Die per rsync hochgeladenen Dateien
sind für alle lesbar. Das prüfst du mit `namei -l /opt/galaxy/web/index.html`.

### Alternative: IONOS-Wildcard-Zertifikat

Wer statt Let's Encrypt das vorhandene Zertifikat für `*.berndniklas.de` nutzen will:
Zertifikatskette, Schlüsselprüfung und Kopieren wie in [DEPLOYMENT.md](DEPLOYMENT.md),
Abschnitt 8. Im Caddyfile kommt dann die Zeile

```
tls /etc/caddy/certs/fullchain.pem /etc/caddy/certs/berndniklas.de_private_key.key
```

in den Site-Block. Dieses Zertifikat wird **nicht** automatisch erneuert.

## 8. Prüfen

```bash
systemctl status galaxy-api caddy
curl -I https://<DOMAIN>
curl -s https://<DOMAIN>/api
```

## Fehlersuche

| Symptom | Ursache |
|---|---|
| SSH-Timeout | IONOS-Firewall-Richtlinie lässt Port 22 nicht zu oder ist dem Server nicht zugewiesen |
| `Permission denied (publickey)` | falscher Benutzer oder Schlüssel nicht in `~/.ssh/authorized_keys` |
| Caddy startet nicht, Port belegt | vorinstallierter Dienst (Apache, Plesk, Docker-Container) belegt 80/443: `sudo ss -tlnp` |
| Zertifikat wird nicht ausgestellt | DNS zeigt noch nicht auf die IP, oder Port 80/443 in Firewall gesperrt |
| 502 bei `/api` | Backend läuft nicht: `systemctl status galaxy-api` |
| 403/404 beim Frontend | `/opt/galaxy/web` leer oder für `caddy` nicht lesbar |

## Betrieb und Kosten

- Beim IONOS-VPS gibt es keine stundengenaue Abrechnung: Der Server kostet auch, wenn er
  ausgeschaltet ist. Das Abschalten spart nichts.
- Backup von `/opt/galaxy/data` regelmäßig ziehen, zum Beispiel lokal per
  `rsync -avz galaxy-ionos:/opt/galaxy/data/ ./backup-data/`. Im IONOS-Panel lassen sich
  zusätzlich Snapshots anlegen.
- Updates einspielen: `sudo apt update && sudo apt upgrade`.
