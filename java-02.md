# RideShare — Java 2

**Shkurtesat:** MVP (Minimum Viable Product – produkti minimal i përdorshëm); AI (Artificial Intelligence – inteligjencë artificiale).

## 1. Problemi
Çfarë vështirësie kanë studentët që udhëtojnë për në AAB?

Studentët që udhëtojnë për në AAB shpesh kanë problem me transportin, sidomos kur nuk kanë veturë. Autobusët mund të vonohen, ndërsa taksitë janë më të shtrenjta. Në të njëjtën kohë, disa studentë vijnë me veturat e tyre dhe kanë vende të lira.

## 2. Përdoruesit
Çfarë dëshiron shoferi? Çfarë dëshiron udhëtari?

Shoferi: Dëshiron të gjejë studentë që kanë nevojë për transport dhe të mbushë vendet e lira në veturë.

Udhëtari: Dëshiron të gjejë një veturë që shkon në AAB në kohën që i përshtatet dhe të rezervojë një vend.

## 3. Tri ekranet
1. Lista e udhëtimeve: Shfaqen udhëtimet e disponueshme me vendin e nisjes, orën, destinacionin dhe numrin e vendeve të lira.
2. Detajet e udhëtimit: Shfaqen të dhënat e shoferit, vendi i nisjes, ora, destinacioni dhe sa vende janë të lira. Këtu udhëtari mund të kërkojë një vend.
3. Kërkesa në pritje: Shfaqen kërkesat që udhëtari ka bërë dhe statusi i tyre, për shembull në pritje, pranuar ose refuzuar.

## 4. MVP — vetëm tri veçori
Cilat tri veprime duhet të funksionojnë në versionin e parë?

1.Shoferi mund të krijojë dhe të publikojë një udhëtim.
2.Udhëtari mund të shohë listën dhe të zgjedhë një udhëtim.
3.Udhëtari mund të kërkojë një vend dhe shoferi mund ta pranojë ose refuzojë kërkesën.

## 5. Çfarë e lëmë për më vonë?
Shëno dy gjëra që nuk na duhen ende.

Për më vonë i lëmë pagesat online dhe navigimin GPS në kohë reale, sepse nuk janë të nevojshme për versionin e parë të aplikacionit.

## 6. Si e provoj?
Çfarë duhet të ndodhë kur kërkoj një vend? Kur kërkoj një vend, kërkesa duhet t'i shkojë shoferit dhe të shfaqet si kërkesë në pritje. Nëse shoferi e pranon, vendi duhet të rezervohet dhe numri i vendeve të lira të zvogëlohet.
Çfarë ndodh nëse nuk ka vende të lira? Nëse nuk ka vende të lira, përdoruesi nuk duhet të ketë mundësi të bëjë rezervim dhe duhet t'i shfaqet një mesazh që nuk ka më vende të lira.

## 7. Prova me kolegun
Ku u hutua kolegu dhe çfarë ndryshova në skicë?

Kolegu u hutua te pjesa se ku duhet të klikohet për të kërkuar një vend. Për këtë arsye do ta bëja butonin “Kërko Vend” më të dukshëm në ekranin e detajeve të udhëtimit.

## 8. Ndihma nga AI
Shëno çfarë ndihme more dhe çfarë kontrollove vetë, ose shkruaj: Nuk përdora AI.

Përdora AI për të më ndihmuar me idetë për strukturën e aplikacionit dhe funksionet kryesore. Unë vetë kontrollova nëse këto funksione përputhen me idenë e RideShare dhe me atë që duhet të përfshihet në MVP.

