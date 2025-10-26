# Custom Fields Anleitung

## Was sind Custom Fields?

**WICHTIG:** Custom Fields sind ausschließlich für **zusätzliche, individuelle Felder** gedacht, die **nicht** zu den Standard-Profilfeldern gehören.

### ⚠️ Standard-Felder (NICHT als Custom Field anlegen!)

Die folgenden Felder sind bereits in der `profiles` Tabelle vorhanden und werden automatisch in jedem Benutzerprofil verwaltet. Diese sollten **NIEMALS** als Custom Fields angelegt werden:

#### Basis & Identifikation
- Name, Vorname (first_name), Nachname (last_name)
- Email, Username
- Mitgliedsnummer (member_number), ÖSV-Nummer (oesv_number)
- Status, Mitgliedschafts-Typ, Mitgliedschafts-Status

#### Kontaktdaten
- Telefon (phone)
- Straße (street_address), PLZ (postal_code), Stadt (city), Adresse (address)

#### Boot
- Bootsname (boat_name), Bootstyp (boat_type), Bootsfarbe (boat_color)
- Bootslänge (boat_length), Bootsbreite (boat_width)

#### Liegeplatz
- Liegeplatz-Nummer (berth_number), Liegeplatz-Typ (berth_type)
- Liegeplatz-Länge (berth_length), Liegeplatz-Breite (berth_width)
- Boje-Radius (buoy_radius)
- Dingi-Liegeplatz (has_dinghy_berth, dinghy_berth_number)

#### Sonstiges
- Notfall-Kontakt (emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
- Parkplatz (parking_permit_number, parking_permit_issue_date)
- Getränkechip (beverage_chip_number, beverage_chip_status, beverage_chip_issue_date)
- Notizen (notes)

#### Datenschutz & Einstellungen
- Satzung akzeptiert (statute_accepted), Datenschutz akzeptiert (privacy_accepted)
- Newsletter (newsletter_optin)
- Daten öffentlich (data_public_in_ksvl, contact_public_in_ksvl)
- AI Info aktiviert (ai_info_enabled)

#### Zugang
- Passwort-Änderung erforderlich (password_change_required)
- Zwei-Faktor-Methode (two_factor_method)

#### Dokumente
- BFA-Dokument, Versicherung, Liegeplatz-Vertrag, Mitglieds-Foto

## ✅ Wann Custom Fields verwenden?

Custom Fields sollten NUR für Felder verwendet werden, die:
1. **Nicht** in der obigen Liste enthalten sind
2. Spezifisch für Ihren Verein sind
3. Temporär oder nur für bestimmte Zwecke benötigt werden

### Beispiele für sinnvolle Custom Fields

✅ **Gute Beispiele:**
- "Segelschein-Klasse" (Select: A, B, C)
- "Rettungswesten an Bord" (Number)
- "WhatsApp Gruppe Mitglied" (Ja/Nein)
- "Regatta 2025 - Anmeldung" (Ja/Nein)
- "Stammtisch-Teilnahme" (Ja/Nein)
- "Lieblingsgetränk" (Text)

❌ **Schlechte Beispiele (bereits als Standard-Felder vorhanden):**
- "first_name" → Standard-Feld "Vorname"
- "phone" → Standard-Feld "Telefon"
- "boat_name" → Standard-Feld "Bootsname"
- "member_number" → Standard-Feld "Mitgliedsnummer"

## Wie lege ich ein Custom Field an?

1. Gehen Sie zu **Einstellungen** → **Custom Fields**
2. Klicken Sie auf **"Neues Feld"**
3. Füllen Sie folgende Felder aus:
   - **Name (technisch)**: Ein eindeutiger technischer Name (z.B. `boat_color`, `membership_tier`)
     - Nur Kleinbuchstaben und Unterstriche erlaubt
     - Wird für interne Referenzierung verwendet
   - **Label (Anzeigename)**: Der Name, der Benutzern angezeigt wird (z.B. "Bootsfarbe", "Mitgliedschaftsstufe")
   - **Feldtyp**: Wählen Sie den passenden Datentyp (siehe unten)
   - **Gruppe**: Organisieren Sie Felder in Kategorien (Kontakt, Boot, Mitgliedschaft, etc.)
   - **Platzhalter** (optional): Beispieltext, der im leeren Feld angezeigt wird
   - **Pflichtfeld**: Aktivieren, wenn das Feld ausgefüllt werden muss
4. Klicken Sie auf **"Erstellen"**

## Field-Typen

### Text
- **Verwendung**: Einzeiliger Text (Namen, Adressen, kurze Beschreibungen)
- **Beispiele**: Bootsname, Straße, Liegeplatz-Nummer
- **Validierung**: Keine spezielle Validierung

### Textarea
- **Verwendung**: Mehrzeiliger Text (lange Beschreibungen, Notizen)
- **Beispiele**: Notizen, Kommentare, Beschreibungen
- **Validierung**: Keine spezielle Validierung

### Number
- **Verwendung**: Numerische Werte (Zahlen, Dezimalzahlen)
- **Beispiele**: Bootslänge, Bootsbreite, Alter, Mitgliedsnummer
- **Validierung**: Muss eine gültige Zahl sein

### Date
- **Verwendung**: Datumsangaben
- **Beispiele**: Geburtsdatum, Eintrittsdatum, Ausstellungsdatum
- **Validierung**: Muss ein gültiges Datum sein
- **Format**: YYYY-MM-DD

### Email
- **Verwendung**: E-Mail-Adressen
- **Beispiele**: Notfall-E-Mail, alternative E-Mail
- **Validierung**: Muss eine gültige E-Mail-Adresse sein (format@example.com)

### Phone
- **Verwendung**: Telefonnummern
- **Beispiele**: Mobilnummer, Festnetz, Notfallkontakt
- **Validierung**: Muss eine gültige Telefonnummer sein (+43 123 456789)

### Select (Dropdown)
- **Verwendung**: Auswahl aus vordefinierten Optionen
- **Beispiele**: Status, Kategorie, Typ
- **Validierung**: Wert muss in der Optionsliste vorhanden sein
- **Konfiguration**: Optionen können in den Einstellungen definiert werden

## Gruppierung von Custom Fields

Custom Fields werden in folgenden Gruppen organisiert:

- **Kontakt**: Telefon, Adresse, Notfallkontakte
- **Persönlich**: Geburtsdatum, persönliche Informationen
- **Mitgliedschaft**: Eintrittsdatum, ÖSV-Nummer, Vorstand-Funktion
- **Boot**: Bootsname, Typ, Länge, Breite
- **Liegeplatz**: Liegeplatz-Nummer, Typ, Dingi-Platz
- **Sonstiges**: Parkausweis, Getränkechip, allgemeine Notizen

Diese Gruppierung hilft bei der Organisation und Übersichtlichkeit in der Benutzeroberfläche.

## Custom Fields bearbeiten

1. Gehen Sie zu **Einstellungen** → **Custom Fields**
2. Finden Sie das gewünschte Feld in der Liste
3. Klicken Sie auf das **Bearbeiten-Symbol**
4. Nehmen Sie Ihre Änderungen vor
5. Speichern Sie

**Hinweis**: Das Ändern des Feldtyps kann zu Datenverlust führen. Stellen Sie sicher, dass alle vorhandenen Daten mit dem neuen Typ kompatibel sind.

## Custom Fields löschen

1. Gehen Sie zu **Einstellungen** → **Custom Fields**
2. Finden Sie das gewünschte Feld
3. Klicken Sie auf das **Löschen-Symbol**
4. Bestätigen Sie die Löschung

**⚠️ WARNUNG**: Das Löschen eines Custom Fields entfernt **alle zugehörigen Daten** für alle Benutzer. Diese Aktion kann nicht rückgängig gemacht werden!

## Custom Fields in Benutzerprofilen

### Anzeige
- Custom Fields werden in Benutzerprofilen nach Gruppen sortiert angezeigt
- Leere Felder können ausgeblendet werden
- Administratoren sehen alle Felder, reguläre Benutzer nur ihre eigenen

### Bearbeitung
- Benutzer können ihre eigenen Custom Fields bearbeiten
- Administratoren können Custom Fields aller Benutzer bearbeiten
- Pflichtfelder müssen ausgefüllt werden, bevor das Profil gespeichert werden kann

### Suche und Filter
- Custom Fields können in der Benutzersuche durchsucht werden
- Filter können auf Custom Field-Werte angewendet werden
- Sortierung nach Custom Fields ist möglich

## Vorbereitung für Monday.com Integration

### Automatische Synchronisation
Wenn die Monday.com Integration aktiviert wird:

1. **Neue Monday.com Spalten** werden automatisch als Custom Fields erkannt
2. **Bestehende Custom Fields** können mit Monday.com Spalten verknüpft werden
3. **Bidirektionale Synchronisation**: Änderungen werden in beide Richtungen synchronisiert

### Column Mapping
- Jedes Custom Field kann mit einer Monday.com Spalte verknüpft werden
- Das Mapping erfolgt über die `monday_column_id` Eigenschaft
- Feldtypen sollten kompatibel sein (Text → Text, Datum → Datum, etc.)

### Sync-Verhalten
- **App → Monday.com**: Änderungen in der App werden an Monday.com gesendet
- **Monday.com → App**: Webhook-Events aktualisieren Custom Fields automatisch
- **Konfliktlösung**: Monday.com hat Priorität bei gleichzeitigen Änderungen

## Best Practices

### Naming Conventions
- **Technischer Name**: Verwenden Sie beschreibende, eindeutige Namen in snake_case
  - ✅ `boat_registration_number`
  - ❌ `field1`, `temp`, `abc123`
- **Label**: Verwenden Sie klare, benutzerfreundliche Namen
  - ✅ "Boots-Registrierungsnummer"
  - ❌ "brn", "Feld 1"

### Gruppierung
- Nutzen Sie Gruppen konsequent für bessere Organisation
- Verwenden Sie vorhandene Gruppen, bevor Sie neue erstellen
- Halten Sie die Anzahl der Gruppen überschaubar (max. 10)

### Pflichtfelder
- Setzen Sie nur wirklich notwendige Felder als Pflichtfelder
- Beachten Sie, dass Pflichtfelder die Benutzerregistrierung beeinflussen
- Informieren Sie Benutzer klar über Pflichtfelder

### Performance
- Zu viele Custom Fields (>50) können die Performance beeinträchtigen
- Nutzen Sie Gruppierung und Lazy Loading für große Feldanzahlen
- Regelmäßige Datenbankwartung empfohlen

### Datenschutz
- Speichern Sie keine sensiblen Daten in Custom Fields ohne Verschlüsselung
- Beachten Sie DSGVO-Richtlinien für personenbezogene Daten
- Dokumentieren Sie, welche Custom Fields welche Daten enthalten

## Troubleshooting

### Custom Field wird nicht angezeigt
- Prüfen Sie die RLS (Row Level Security) Policies in der Datenbank
- Stellen Sie sicher, dass das Feld nicht versehentlich gelöscht wurde
- Überprüfen Sie die Browser-Konsole auf Fehler

### Validierungsfehler
- Stellen Sie sicher, dass der Wert dem Feldtyp entspricht
- Überprüfen Sie Pflichtfeld-Einstellungen
- Prüfen Sie, ob spezielle Zeichen erlaubt sind

### Synchronisationsprobleme mit Monday.com
- Überprüfen Sie die Monday.com API-Verbindung
- Prüfen Sie die Sync-Logs unter Einstellungen → Monday.com
- Stellen Sie sicher, dass das Column Mapping korrekt ist
- Überprüfen Sie, ob die Webhook-URL registriert ist

### Daten gehen verloren
- Custom Field Values werden in separater Tabelle gespeichert
- Bei Typänderungen kann Datenkonvertierung fehlschlagen
- Erstellen Sie regelmäßige Backups wichtiger Custom Field Daten

## Technische Details

### Datenbank-Schema

```sql
-- Custom Fields Definition
custom_fields (
  id uuid PRIMARY KEY,
  name text UNIQUE,
  label text,
  type text,
  required boolean,
  placeholder text,
  options text[],
  "order" integer,
  "group" text,
  monday_column_id text
)

-- Custom Field Values
custom_field_values (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  field_id uuid REFERENCES custom_fields(id),
  value text,
  created_at timestamp,
  updated_at timestamp,
  UNIQUE(user_id, field_id)
)
```

### API-Zugriff

Custom Fields können über die Supabase API abgerufen werden:

```typescript
// Custom Fields abrufen
const { data: fields } = await supabase
  .from('custom_fields')
  .select('*')
  .order('order');

// Custom Field Values für User abrufen
const { data: values } = await supabase
  .from('custom_field_values')
  .select('*, custom_fields(*)')
  .eq('user_id', userId);
```

## Häufig gestellte Fragen (FAQ)

**Q: Kann ich Custom Fields nachträglich umbenennen?**  
A: Ja, das Label kann jederzeit geändert werden. Der technische Name sollte nicht geändert werden, da er für Referenzierungen verwendet wird.

**Q: Wie viele Custom Fields kann ich erstellen?**  
A: Technisch unbegrenzt, aber für Performance-Gründe empfehlen wir max. 50 Fields.

**Q: Werden Custom Fields automatisch mit Monday.com synchronisiert?**  
A: Ja, sobald die Integration aktiviert und das Column Mapping konfiguriert ist.

**Q: Kann ich Custom Fields importieren/exportieren?**  
A: Ja, über die Import/Export-Funktion in den Einstellungen (geplante Funktion).

**Q: Was passiert mit Custom Field Values, wenn ein User gelöscht wird?**  
A: Die zugehörigen Custom Field Values werden automatisch gelöscht (CASCADE).

**Q: Können reguläre Benutzer Custom Fields erstellen?**  
A: Nein, nur Administratoren können Custom Fields verwalten.

## Support

Bei Fragen oder Problemen wenden Sie sich an:
- **Technischer Support**: Siehe System-Administrator
- **Dokumentation**: Diese Anleitung
- **Logs**: Einstellungen → System → Logs
