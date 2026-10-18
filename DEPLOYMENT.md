# Deployment auf AWS EC2

Beschreibt, wie Galaxy ohne Docker auf einer kleinen EC2-Instanz (t2.nano, 512 MB RAM,
Amazon Linux 2023, x86) läuft.

```
Internet → Caddy (80/443, HTTPS)
             ├─ /api/*  → NestJS (127.0.0.1:3000, systemd-Dienst galaxy-api)
             └─ /*      → Angular-Build (statische Dateien in /opt/galaxy/web)
```

> Das Repo ist öffentlich. Trage hier keine IP-Adressen, Schlüssel oder Passwörter ein.
> Nachfolgend stehen `<EC2-IP>`, `<DOMAIN>` und `<KEY.pem>` als Platzhalter.

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

## 1. AWS vorbereiten

1. Security Group: Inbound **22** (nur eigene IP), **80** und **443**. Port 3000 bleibt zu.
2. Elastic IP zuweisen, damit die Adresse nach Stopp/Start gleich bleibt.
3. DNS: A-Record der Domain (z. B. `galaxy.berndniklas.de`) auf die Elastic IP.
4. Key-Datei schützen: `chmod 400 <KEY.pem>`

SSH-Verbindung:

```bash
ssh -i <KEY.pem> ec2-user@<EC2-IP>
```

## 2. Instanz einrichten (einmalig)

```bash
sudo dnf install -y nodejs20 rsync
# Swap als Sicherheitsnetz (512 MB RAM sind knapp)
sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# Verzeichnisse
sudo mkdir -p /opt/galaxy/{api,web,data}
sudo chown -R ec2-user /opt/galaxy
```

## 3. Lokal bauen

Auf der Instanz wird **nichts gebaut** (zu wenig RAM). Gebaut wird lokal:

```bash
npx nx build api --configuration=production
npx nx build worlds --configuration=production
```

`apps/api/webpack.config.js` setzt `generatePackageJson: true`. Dadurch liegt in
`dist/apps/api` eine `package.json` mit den Laufzeit-Abhängigkeiten.

## 4. Hochladen

```bash
SSH="ssh -i <KEY.pem>"
HOST=ec2-user@<EC2-IP>

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

`user.json` und `adminLogin.json` enthalten Zugangsdaten. Sie werden nur bewusst
hochgeladen. Ohne `adminLogin.json` kann der Admin unter `/admin/set-admin` angelegt werden.

## 5. Backend als systemd-Dienst

`/etc/systemd/system/galaxy-api.service`:

```ini
[Unit]
Description=Galaxy API
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/opt/galaxy/data
Environment=PORT=3000
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=200
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

Caddy ist in den Amazon-Linux-Repos nicht enthalten, daher das offizielle Binary:

```bash
sudo curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/local/bin/caddy
sudo chmod +x /usr/local/bin/caddy
sudo groupadd --system caddy
sudo useradd --system --gid caddy --create-home --home-dir /var/lib/caddy --shell /usr/sbin/nologin caddy
sudo mkdir -p /etc/caddy
```

`/etc/systemd/system/caddy.service`:

```ini
[Unit]
Description=Caddy
After=network-online.target
Wants=network-online.target

[Service]
User=caddy
Group=caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
AmbientCapabilities=CAP_NET_BIND_SERVICE
LimitNOFILE=1048576
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now caddy
```

## 7. Caddyfile

`/etc/caddy/Caddyfile`:

```
<DOMAIN> {
    tls /etc/caddy/certs/fullchain.pem /etc/caddy/certs/berndniklas.de_private_key.key
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
- Ohne die `tls`-Zeile holt Caddy automatisch ein kostenloses Let's-Encrypt-Zertifikat und
  erneuert es selbst. Dafür müssen Port 80 und 443 offen sein und die Domain auf die IP zeigen.

### Konfiguration ändern

```bash
caddy validate --config /etc/caddy/Caddyfile    # als Benutzer caddy: sudo -u caddy …
sudo systemctl reload caddy                      # Neustart ist nicht nötig
```

Änderungen an den statischen Dateien in `/opt/galaxy/web` brauchen weder Reload noch Neustart.

## 8. IONOS-Wildcard-Zertifikat (`*.berndniklas.de`)

Das Zertifikat gilt für Subdomains (`galaxy.berndniklas.de`), nicht für `berndniklas.de`
selbst. Benötigt werden das Zertifikat, die Zwischenzertifikate und der private Schlüssel.

Kette bauen (Reihenfolge: Zertifikat, dann Aussteller, dann dessen Aussteller):

```bash
for f in berndniklas.de_ssl_certificate.cer intermediate/intermediate1.cer intermediate/intermediate2.cer; do
  cat "$f"; echo
done > fullchain.pem
grep -c "BEGIN CERTIFICATE" fullchain.pem        # 3
```

Passung von Zertifikat und Schlüssel prüfen (keine Ausgabe = passt):

```bash
diff <(openssl x509 -in berndniklas.de_ssl_certificate.cer -noout -pubkey) \
     <(openssl pkey -in berndniklas.de_private_key.key -pubout)
```

Auf den Server und absichern:

```bash
scp -i <KEY.pem> fullchain.pem berndniklas.de_private_key.key ec2-user@<EC2-IP>:/tmp/
# auf dem Server:
sudo mkdir -p /etc/caddy/certs
sudo mv /tmp/fullchain.pem /tmp/berndniklas.de_private_key.key /etc/caddy/certs/
sudo chown -R caddy:caddy /etc/caddy/certs
sudo chmod 755 /etc/caddy/certs
sudo chmod 644 /etc/caddy/certs/fullchain.pem
sudo chmod 600 /etc/caddy/certs/berndniklas.de_private_key.key
sudo -u caddy /usr/local/bin/caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Der private Schlüssel gehört nie ins Git-Repo.

**Die Erneuerung ist nicht automatisch.** Das IONOS-Zertifikat läuft nach der gebuchten
Laufzeit ab. Vorher ein neues einspielen und Caddy neu laden.

## 9. Prüfen

```bash
systemctl status galaxy-api caddy
curl -I https://<DOMAIN>
curl -s https://<DOMAIN>/api
```

## Fehlersuche

| Symptom | Ursache |
|---|---|
| SSH-Timeout | Security Group lässt die aktuelle IP nicht auf Port 22, oder die IP der Instanz hat sich geändert |
| `Permission denied (publickey)` | falscher Benutzer (`ec2-user`) oder falsche Key-Datei |
| `permission denied` beim Validieren der Zertifikate | Befehl als `ec2-user` statt als `caddy` ausgeführt: `sudo -u caddy …` |
| 502 bei `/api` | Backend läuft nicht: `systemctl status galaxy-api` |
| 403/404 beim Frontend | `/opt/galaxy/web` für `caddy` nicht lesbar oder leer |
| Zertifikat wird nicht ausgestellt | DNS zeigt noch nicht auf die IP, oder Port 80/443 gesperrt |

## Kosten sparen

Die Instanz kann gestoppt werden, wenn nicht gespielt wird (EBS-Volume und Elastic IP
kosten weiter, Rechenzeit entfällt). Beide Dienste starten über `systemctl enable`
automatisch wieder. Vor dem Stoppen ggf. einen EBS-Snapshot von `/opt/galaxy/data` machen.
