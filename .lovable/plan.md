

# Datenbank-Analyse: Duplikate und Reduktionspotenzial

## Ergebnis der Prüfung

### Keine Duplikate gefunden
- **profiles**: 6 Einträge, keine doppelten E-Mails
- **user_roles**: 17 Einträge, keine doppelten user_id/role-Kombinationen
- **app_settings**: Keine doppelten setting_keys

### Ungenutzte Tabellen (nur in types.ts referenziert, kein Code-Zugriff)

| Tabelle | Zeilen | Status | Empfehlung |
|---------|--------|--------|------------|
| `role_configurations` | 5 | Nicht im Code verwendet | Entfernen |
| `ai_assistant_defaults` | 5 | Nicht im Code verwendet | Entfernen |
| `dashboard_widget_definitions` | 8 | Nicht im Code verwendet | Entfernen |
| `dashboard_section_definitions` | 5 | Nicht im Code verwendet | Entfernen |
| `menu_item_definitions` | 11 | Nicht im Code verwendet | Entfernen |
| `monday_settings` | 1 | Nicht im Code verwendet | Entfernen |
| `monday_sync_logs` | 0 | Nicht im Code verwendet | Entfernen |

**7 von 14 Tabellen** werden von keinem Frontend-Code abgefragt. Sie existieren nur als Schema-Definitionen in `types.ts` (auto-generiert).

### Genutzte Tabellen (7 bleiben)

| Tabelle | Verwendet von |
|---------|--------------|
| `profiles` | Auth, Profile, User Management |
| `user_roles` | Rollen-System, RLS-Policies |
| `slots` | Kalender, Buchungen |
| `app_settings` | Alle Settings-Hooks |
| `file_metadata` | File Manager |
| `theme_settings` | Theme Manager |
| `role_badge_settings` | Badge-Farben im Theme Manager |

### Mögliche Zusammenlegung

`role_badge_settings` könnte theoretisch in `app_settings` integriert werden (als `setting_key: 'role_badge_colors'`), aber da es einen eigenen Hook und dedizierte RLS hat, ist der Aufwand grösser als der Nutzen.

## Plan

1. **Migration erstellen**: 7 ungenutzte Tabellen per `DROP TABLE` entfernen:
   - `role_configurations`
   - `ai_assistant_defaults`
   - `dashboard_widget_definitions`
   - `dashboard_section_definitions`
   - `menu_item_definitions`
   - `monday_settings`
   - `monday_sync_logs`

2. **Edge Functions prüfen**: `sync-monday` und `monday-webhook` Edge Functions referenzieren Monday-Tabellen -- diese müssten ebenfalls entfernt oder angepasst werden.

3. **Code-Bereinigung**: Keine Frontend-Codeänderungen nötig, da die Tabellen nicht im Code verwendet werden. Die `types.ts` wird automatisch nach der Migration aktualisiert.

**Reduktion: 14 Tabellen auf 7 Tabellen (50%)**

