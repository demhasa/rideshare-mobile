# RideShare — Java 3

## Çfarë ndërtova

Ndërtova faqen e listës me tri udhëtime fiktive, kartën e ripërdorshme,
detajet e udhëtimit, kërkesën e simulimit “Në pritje” dhe faqen për ID që
nuk gjendet. Aplikacioni është në `aplikacioni/`; nuk ka rezervim real.

## Provat që bëra

### Prova 1: Lista në telefon

Hapa faqen kryesore në pamje telefoni (360 px): pashë tri karta dhe nuk pati
lëvizje horizontale.

### Prova 2: Detajet e udhëtimit të dytë

Hapa `/udhetimi/2` dhe pashë vendtakimin “Te stacioni kryesor”. Te
`/udhetimi/3` butoni “Nuk ka vende të lira” ishte i çaktivizuar; te
`/udhetimi/99` pashë “Udhëtimi nuk u gjet”.

### Prova 3: Kërkesa në pritje

Te `/udhetimi/2/kerkesa` pashë “Simulim: Në pritje” dhe mesazhin se kërkesa
nuk iu dërgua shoferit. U ktheva te detajet dhe te lista me lidhjet përkatëse.

## Çfarë do të përmirësoj

Në javën tjetër do të shtoj teste automatike për rrjedhën e listës, detajeve
dhe kërkesës.

## Ndihma nga AI (Artificial Intelligence – inteligjencë artificiale)

AI ndihmoi në përgatitjen e strukturës dhe kodit. U provuan në shfletues
lista në telefon, detajet, gjendja pa vende, ID 99, kërkesa e simuluar dhe
kthimi te lista.
