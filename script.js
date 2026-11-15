/* ===== 1. Barre de progression ===== */
const barre = document.querySelector(".barre-progression");

function majDefilement() {
    // Distance maximale que l'on peut faire défiler
    const hauteurMax = document.documentElement.scrollHeight - window.innerHeight;
    // Pourcentage de la page déjà parcouru, entre 0 et 1
    const progression = hauteurMax > 0 ? window.scrollY / hauteurMax : 0;
    barre.style.transform = "scaleX(" + progression + ")";
}

window.addEventListener("scroll", majDefilement, { passive: true });
window.addEventListener("resize", majDefilement);
majDefilement(); // calcul au chargement, si la page s'ouvre déjà défilée

/* ===== 2. Bouton « remonter » : visible dès que la 1re section sort de l'écran ===== */
const boutonHaut = document.querySelector(".retour-haut");
const premiereSection = document.querySelector("main section");

if (boutonHaut && premiereSection) {
    new IntersectionObserver(function (entrees) {
        boutonHaut.classList.toggle("visible", !entrees[0].isIntersecting);
    }).observe(premiereSection);
}

/* ===== 3. Formulaire de contact : ouvre la messagerie avec le message pré-rempli ===== */
const formulaire = document.querySelector("#formulaire-contact");

// Le formulaire n'existe que sur contact.html : sur les autres pages, on ne fait rien
if (formulaire) {
    // L'événement « submit » n'arrive ici que si le navigateur a validé les champs obligatoires
    formulaire.addEventListener("submit", function (evenement) {
        evenement.preventDefault(); // empêche l'envoi normal (il n'y a pas de serveur pour le recevoir)

        // Récupère les valeurs saisies, sans les espaces au début et à la fin
        const donnees = new FormData(formulaire);
        const nom = donnees.get("nom").trim();
        const email = donnees.get("email").trim();
        const entreprise = donnees.get("entreprise").trim();
        const objet = donnees.get("objet").trim() || "Contact depuis votre portfolio";
        const message = donnees.get("message").trim();

        // Le corps du mail ; « \r\n » = retour à la ligne
        const corps =
            "Nom : " + nom + "\r\n" +
            "E-mail : " + email + "\r\n" +
            "Entreprise : " + (entreprise || "non précisée") + "\r\n\r\n" +
            message;

        // Construit le lien mailto en encodant l'objet et le corps
        const lien = "mailto:fouadmamouni50@gmail.com" +
            "?subject=" + encodeURIComponent(objet) +
            "&body=" + encodeURIComponent(corps);

        // Ouvre la messagerie du visiteur
        window.location.href = lien;
    });
}

/* ===== 4. Transitions entre les pages ===== */
const ecran = document.querySelector(".ecran-chargement");
// true si l'utilisateur a demandé à réduire les animations dans son système
const reduireMouvements = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- 4a. En quittant la page : l'écran sombre revient, puis on change de page --- */
if (ecran && !reduireMouvements) {
    document.addEventListener("click", function (evenement) {
        // Le lien cliqué (ou le lien qui contient l'élément cliqué, ex : une icône)
        const lien = evenement.target.closest("a");
        if (!lien) return;

        // Ctrl/Cmd/Maj + clic ou clic molette = ouverture dans un nouvel onglet : on ne touche à rien
        if (evenement.defaultPrevented || evenement.button !== 0 ||
            evenement.ctrlKey || evenement.metaKey || evenement.shiftKey || evenement.altKey) return;

        // Liens qui s'ouvrent dans un nouvel onglet, et téléchargements (CV)
        if (lien.target === "_blank" || lien.hasAttribute("download")) return;

        const adresse = new URL(lien.href, window.location.href);

        // Liens externes, mailto: et tel: (autre protocole ou autre site)
        if (adresse.protocol !== window.location.protocol || adresse.host !== window.location.host) return;

        // Seulement les pages .html du site (ou la racine du dossier) : pas les PDF
        if (!adresse.pathname.endsWith(".html") && !adresse.pathname.endsWith("/")) return;

        // Ancre sur la même page (#cas, #top) : simple défilement, pas de transition
        if (adresse.pathname === window.location.pathname && adresse.hash) return;

        evenement.preventDefault();          // on bloque le changement de page immédiat…
        ecran.classList.remove("cache");
        ecran.classList.add("sortie");       // …on fait revenir l'écran sombre (0,3 s)…
        setTimeout(function () {
            window.location.href = adresse.href; // …puis on charge la nouvelle page
        }, 300);
    });
}

/* --- 4b. Retour arrière : la page peut être restaurée depuis le cache du navigateur,
   avec l'écran encore affiché. On le retire tout de suite. --- */
window.addEventListener("pageshow", function (evenement) {
    if (evenement.persisted && ecran) {
        ecran.classList.remove("sortie");
        ecran.classList.add("cache");
    }
});

/* --- 4c. Apparition du contenu en fondu, les éléments les uns après les autres --- */
const selecteursApparition = [
    "main section > .etiquette", "main section > h1", "main section > h2", "main section > p",
    ".boutons", ".icone-mail", ".a-propos > div",
    ".carte", ".carte-intro", ".titre-categorie", ".carte-competence", ".qualites li", ".carte-projet",
    ".etapes li", ".sous-partie > .etiquette", ".titre-sous-partie", ".carte-certif", ".carte-liste",
    ".projet-vedette", ".entete-colonne", ".carte-projet-item", ".etape-frise", ".contact-colonnes > *"
];

if (!reduireMouvements && "IntersectionObserver" in window) {
    try {
        const elements = document.querySelectorAll(selecteursApparition.join(", "));

        // Observe les éléments : dès qu'un élément entre à l'écran, il apparaît
        const observateurApparition = new IntersectionObserver(function (entrees, observateur) {
            let rang = 0; // position de l'élément dans le groupe qui apparaît en même temps
            entrees.forEach(function (entree) {
                if (!entree.isIntersecting) return;
                const element = entree.target;
                // Décalage de 90 ms entre chaque élément (au maximum 0,54 s)
                element.style.transitionDelay = Math.min(rang, 6) * 90 + "ms";
                rang++;
                element.classList.add("est-visible");
                // Une fois apparu, on retire le décalage (sinon le survol des cartes serait retardé)
                element.addEventListener("transitionend", function () {
                    element.style.transitionDelay = "";
                }, { once: true });
                observateur.unobserve(element); // chaque élément n'apparaît qu'une fois
            });
        }, {
            rootMargin: "0px 0px -40px 0px" // déclenche un peu avant que l'élément soit bien visible
        });

        elements.forEach(function (element) {
            element.classList.add("apparition");
        });
        // Les éléments ne sont cachés qu'à partir d'ici, quand tout est prêt
        document.documentElement.classList.add("js-anim");

        // On commence quand l'écran de chargement s'efface (après 0,45 s)
        setTimeout(function () {
            elements.forEach(function (element) {
                observateurApparition.observe(element);
            });
        }, 450);
    } catch (erreur) {
        // En cas de problème, on réaffiche tout : le contenu ne reste jamais caché
        document.documentElement.classList.remove("js-anim");
    }
}
