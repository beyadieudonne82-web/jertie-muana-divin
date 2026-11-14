// ===== À MODIFIER =====
const CONFIG = {
  whatsapp: "243999275259",   // numéro du client, format international sans + ni espaces
  boutique: "JERTIE MUANA DIVIN",
  tauxCDF: 2300               // 1 $ = ... FC (indicatif, à ajuster)
};
// ======================

const LABELS = { homme: "Homme", femme: "Femme", enfant: "Enfant", chaussures: "Chaussures", autres: "Autres" };
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#F0E9DA"/><text x="200" y="255" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#5A5247">Photo à venir</text></svg>'
);

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

let produits = [];
let panier = store.get("jmd_panier", []);      // [{id, taille, qte}]
let favoris = store.get("jmd_favoris", []);    // [id]
let prefs = Object.assign({ devise: "USD", theme: "clair" }, store.get("jmd_prefs", {}));
let rendre = () => {};                         // redessine la page courante
const F = { cat: "tous", q: "", prixMax: Infinity, tailles: [], tri: "pertinence", nouveau: false, favoris: false };

const fmt = (usd) => prefs.devise === "CDF"
  ? `${Math.round(usd * CONFIG.tauxCDF).toLocaleString("fr-FR")} FC`
  : `${usd} $`;
const parId = (id) => produits.find((p) => p.id === Number(id));
const lienWA = (message) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message || `Bonjour ${CONFIG.boutique}, j'ai une question sur vos articles.`)}`;

/* ---------- Structure commune : en-tête, pied de page, paramètres ---------- */
const ICONES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="emblem" viewBox="0 0 120 120">
<circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="0.75"/>
<path d="M60 31 L34 49 H86 Z M60 31 v-5 a4.5 4.5 0 1 1 4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
<text x="60" y="84" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="700" font-size="30" letter-spacing="2" fill="currentColor">JMD</text>
</symbol>
<symbol id="i-coeur" viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.7-9.5-9.4A5.3 5.3 0 0 1 12 6.2a5.3 5.3 0 0 1 9.5 4.9C19.5 15.8 12 20.5 12 20.5z"/></symbol>
<symbol id="i-sac" viewBox="0 0 24 24"><path d="M5.5 8h13l1 12.5h-15zM9 8V7a3 3 0 0 1 6 0v1"/></symbol>
<symbol id="i-reglages" viewBox="0 0 24 24"><path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></symbol>
<symbol id="i-loupe" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
</svg>`;

const NAV = [
  ["index.html", "Accueil", "accueil"],
  ["boutique.html", "Boutique", "boutique"],
  ["boutique.html?nouveau=1", "Nouveautés", "nouveautes"],
  ["boutique.html?cat=homme", "Homme", "homme"],
  ["boutique.html?cat=femme", "Femme", "femme"],
  ["boutique.html?cat=enfant", "Enfant", "enfant"],
  ["boutique.html?cat=chaussures", "Chaussures", "chaussures"],
  ["apropos.html", "À propos", "apropos"],
  ["contact.html", "Contact", "contact"]
];

function cleCourante() {
  const page = document.body.dataset.page;
  if (page !== "boutique") return page === "produit" ? "boutique" : page;
  const u = new URLSearchParams(location.search);
  if (u.get("nouveau") === "1") return "nouveautes";
  if (u.get("favoris") === "1") return "";
  return LABELS[u.get("cat")] ? u.get("cat") : "boutique";
}

function monterLayout() {
  const cle = cleCourante();
  const entete = `${ICONES}
<a class="evitement" href="#contenu">Aller au contenu</a>
<div class="annonce">Nouveaux arrivages &middot; Commandez simplement sur WhatsApp</div>
<header class="entete">
  <div class="entete-haut">
    <button class="icone menu-bouton" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav"><svg class="ico"><use href="#i-menu"/></svg></button>
    <a class="marque" href="index.html" aria-label="${CONFIG.boutique}, accueil">
      <svg class="marque-embleme" aria-hidden="true"><use href="#emblem"/></svg>
      <span class="marque-nom">${CONFIG.boutique}</span>
    </a>
    <form class="recherche-haut" action="boutique.html" role="search">
      <input type="search" name="q" id="recherche-haut" placeholder="Rechercher un article" aria-label="Rechercher un article" autocomplete="off">
      <button type="submit" aria-label="Lancer la recherche"><svg class="ico"><use href="#i-loupe"/></svg></button>
    </form>
    <div class="actions">
      <a class="icone" id="lien-favoris" href="boutique.html?favoris=1" aria-label="Favoris"><svg class="ico"><use href="#i-coeur"/></svg><span class="pastille" data-compte="favoris" hidden>0</span></a>
      <a class="icone" id="lien-panier" href="panier.html" aria-label="Panier"><svg class="ico"><use href="#i-sac"/></svg><span class="pastille" data-compte="panier" hidden>0</span></a>
      <button class="icone" id="ouvrir-params" type="button" aria-label="Paramètres"><svg class="ico"><use href="#i-reglages"/></svg></button>
    </div>
  </div>
  <nav class="nav" id="nav" aria-label="Navigation principale">
    ${NAV.map(([href, nom, k]) => `<a href="${href}"${k === cle ? ' aria-current="page"' : ""}>${nom}</a>`).join("")}
  </nav>
</header>`;

  const pied = `<footer class="pied">
  <div class="pied-grille">
    <div>
      <a class="marque" href="index.html"><svg class="marque-embleme" aria-hidden="true"><use href="#emblem"/></svg><span class="marque-nom">${CONFIG.boutique}</span></a>
      <p>Mode homme, femme et enfant, chaussures et nouveaux arrivages.</p>
    </div>
    <div><h2>Boutique</h2><ul>
      <li><a href="boutique.html?nouveau=1">Nouveautés</a></li><li><a href="boutique.html?cat=homme">Homme</a></li>
      <li><a href="boutique.html?cat=femme">Femme</a></li><li><a href="boutique.html?cat=enfant">Enfant</a></li>
      <li><a href="boutique.html?cat=chaussures">Chaussures</a></li></ul></div>
    <div><h2>Informations</h2><ul>
      <li><a href="apropos.html">À propos</a></li><li><a href="contact.html">Contact</a></li>
      <li><a href="panier.html">Mon panier</a></li><li><a href="boutique.html?favoris=1">Mes favoris</a></li></ul></div>
    <div><h2>Commander</h2><p>Une question ? Écrivez-nous.</p><ul><li><a data-whatsapp href="contact.html">WhatsApp</a></li></ul></div>
  </div>
  <div class="pied-bas">&copy; 2026 ${CONFIG.boutique}. Site de démonstration.</div>
</footer>
<dialog id="params" aria-labelledby="params-titre"><div class="params">
  <h2 id="params-titre">Paramètres</h2>
  <fieldset><legend>Devise</legend>
    <label class="choix"><input type="radio" name="devise" value="USD"><span>Dollar ($)</span></label>
    <label class="choix"><input type="radio" name="devise" value="CDF"><span>Franc congolais (FC)</span></label>
    <p class="note">Taux indicatif : 1 $ = ${CONFIG.tauxCDF} FC</p>
  </fieldset>
  <fieldset><legend>Affichage</legend>
    <label class="choix"><input type="radio" name="theme" value="clair"><span>Clair</span></label>
    <label class="choix"><input type="radio" name="theme" value="sombre"><span>Sombre</span></label>
  </fieldset>
  <button class="bouton" type="button" id="params-fermer">Fermer</button>
</div></dialog>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  document.body.insertAdjacentHTML("afterbegin", entete);
  document.body.insertAdjacentHTML("beforeend", pied);
}

let minuteur;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(minuteur);
  minuteur = setTimeout(() => el.classList.remove("visible"), 2200);
}

function appliquerTheme() { document.documentElement.dataset.theme = prefs.theme; }

function majComptes() {
  const n = { favoris: favoris.length, panier: panier.reduce((s, l) => s + l.qte, 0) };
  $$("[data-compte]").forEach((el) => { el.textContent = n[el.dataset.compte]; el.hidden = n[el.dataset.compte] === 0; });
  $("#lien-panier").setAttribute("aria-label", `Panier, ${n.panier} article${n.panier > 1 ? "s" : ""}`);
  $("#lien-favoris").setAttribute("aria-label", `Favoris, ${n.favoris}`);
}

/* ---------- Données, favoris, panier ---------- */
async function charger() {
  try {
    const r = await fetch("data/produits.json");
    if (!r.ok) throw new Error(r.status);
    produits = await r.json();
    return true;
  } catch (e) {
    $("#contenu").insertAdjacentHTML("afterbegin", '<p class="erreur page">Impossible de charger les produits. Ouvrez le site avec « Go Live » dans VS Code, sans double-cliquer sur le fichier.</p>');
    return false;
  }
}

function basculerFavori(id) {
  const i = favoris.indexOf(id);
  if (i >= 0) favoris.splice(i, 1); else favoris.push(id);
  store.set("jmd_favoris", favoris);
  $$(`[data-fav="${id}"]`).forEach((b) => b.setAttribute("aria-pressed", favoris.includes(id)));
  majComptes();
  toast(favoris.includes(id) ? "Ajouté aux favoris" : "Retiré des favoris");
  if (document.body.dataset.page === "boutique" && F.favoris) rendre();
}

function ajouterPanier(id, taille, qte) {
  const ligne = panier.find((l) => l.id === id && l.taille === taille);
  if (ligne) ligne.qte = Math.min(20, ligne.qte + qte); else panier.push({ id, taille, qte });
  store.set("jmd_panier", panier);
  majComptes();
  toast("Ajouté au panier");
}

const carte = (p) => `<article class="carte">
  <a class="carte-lien" href="produit.html?id=${p.id}" aria-label="Voir ${esc(p.nom)}, ${esc(fmt(p.prix))}">
    <span class="carte-photo"><img src="${esc(p.images[0])}" alt="${esc(p.nom)}" loading="lazy">${p.nouveau ? '<span class="badge">Nouveau</span>' : ""}</span>
    <span class="carte-nom">${esc(p.nom)}</span><span class="carte-prix">${esc(fmt(p.prix))}</span>
  </a>
  <button class="coeur" type="button" data-fav="${p.id}" aria-pressed="${favoris.includes(p.id)}" aria-label="Favori : ${esc(p.nom)}"><svg class="ico"><use href="#i-coeur"/></svg></button>
</article>`;

/* ---------- Accueil ---------- */
function pageAccueil() {
  rendre = () => {
    $("#grille-nouveautes").innerHTML = produits.filter((p) => p.nouveau).slice(0, 4).map(carte).join("");
    $("#grille-selection").innerHTML = produits.slice(0, 8).map(carte).join("");
  };
  rendre();
}

/* ---------- Boutique ---------- */
function pageBoutique() {
  const u = new URLSearchParams(location.search);
  F.cat = LABELS[u.get("cat")] ? u.get("cat") : "tous";
  F.q = (u.get("q") || "").trim();
  F.nouveau = u.get("nouveau") === "1";
  F.favoris = u.get("favoris") === "1";
  const max = produits.length ? Math.ceil(Math.max(...produits.map((p) => p.prix)) / 5) * 5 : 100;
  F.prixMax = max;
  const cats = Object.keys(LABELS).filter((c) => produits.some((p) => p.categorie === c));
  const tailles = [...new Set(produits.flatMap((p) => p.tailles || []))];
  $("#recherche-haut").value = F.q;
  $("#panneau-contenu").innerHTML = `
    <fieldset><legend>Catégorie</legend>${["tous", ...cats].map((c) =>
      `<label class="choix"><input type="radio" name="cat" value="${c}"${c === F.cat ? " checked" : ""}><span>${c === "tous" ? "Toutes" : LABELS[c]}</span></label>`).join("")}</fieldset>
    <fieldset><legend>Prix maximum : <output id="prix-sortie"></output></legend>
      <input type="range" id="prix-max" min="5" max="${max}" step="5" value="${max}" aria-label="Prix maximum"></fieldset>
    <fieldset><legend>Taille</legend><div class="tailles">${tailles.map((t) =>
      `<label class="taille"><input type="checkbox" name="taille" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("")}</div></fieldset>
    <button class="bouton bouton-clair" type="button" id="reinit">Réinitialiser</button>`;
  if (window.innerWidth < 900) $("#panneau").open = false;

  rendre = () => {
    let liste = produits.filter((p) =>
      (F.cat === "tous" || p.categorie === F.cat) &&
      p.prix <= F.prixMax &&
      (!F.q || p.nom.toLowerCase().includes(F.q.toLowerCase())) &&
      (!F.tailles.length || (p.tailles || []).some((t) => F.tailles.includes(t))) &&
      (!F.nouveau || p.nouveau) &&
      (!F.favoris || favoris.includes(p.id)));
    if (F.tri === "prix-asc") liste.sort((a, b) => a.prix - b.prix);
    if (F.tri === "prix-desc") liste.sort((a, b) => b.prix - a.prix);
    if (F.tri === "nouveautes") liste.sort((a, b) => Number(b.nouveau) - Number(a.nouveau));
    const titre = F.favoris ? "Mes favoris" : F.nouveau ? "Nouveautés" : F.q ? `Résultats pour « ${F.q} »` : F.cat !== "tous" ? LABELS[F.cat] : "Boutique";
    $("#titre-page").textContent = titre;
    document.title = `${titre} | ${CONFIG.boutique}`;
    $("#prix-sortie").textContent = fmt(F.prixMax);
    $("#grille").innerHTML = liste.map(carte).join("");
    $("#vide").hidden = liste.length > 0;
    $("#vide").textContent = F.favoris && !favoris.length ? "Vous n'avez pas encore de favoris. Touchez le cœur d'un article pour l'ajouter." : "Aucun article ne correspond. Modifiez vos filtres ou votre recherche.";
    $("#compteur").textContent = `${liste.length} article${liste.length > 1 ? "s" : ""}`;
  };
  rendre();
}

function lireFiltres() {
  const c = $('input[name="cat"]:checked');
  F.cat = c ? c.value : "tous";
  F.prixMax = Number($("#prix-max").value);
  F.tailles = $$('input[name="taille"]:checked').map((i) => i.value);
  F.tri = $("#tri").value;
}

/* ---------- Fiche article ---------- */
function pageProduit() {
  const cible = $("#fiche");
  const p = parId(new URLSearchParams(location.search).get("id"));
  if (!p) { cible.innerHTML = '<p class="erreur">Article introuvable. <a href="boutique.html">Retour à la boutique</a></p>'; return; }
  const tailles = p.tailles || [];
  let taille = tailles[0] || "";
  let qte = 1;

  const majCommande = () => {
    $("#commander").href = lienWA(`Bonjour ${CONFIG.boutique}, je souhaite commander : ${p.nom}${taille ? ` (taille ${taille})` : ""} x${qte}, ${fmt(p.prix * qte)}. Réf. ${p.id}`);
  };

  rendre = () => {
    document.title = `${p.nom} | ${CONFIG.boutique}`;
    cible.innerHTML = `
      <nav class="fil" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <a href="boutique.html?cat=${esc(p.categorie)}">${esc(LABELS[p.categorie] || "Boutique")}</a> / <span>${esc(p.nom)}</span></nav>
      <div class="fiche">
        <div>
          <div class="fiche-photo"><img id="photo-principale" src="${esc(p.images[0])}" alt="${esc(p.nom)}"></div>
          ${p.images.length > 1 ? `<div class="miniatures">${p.images.map((src, i) =>
            `<button class="miniature" type="button" data-src="${esc(src)}" aria-label="Voir la photo ${i + 1}" aria-current="${i === 0}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
        </div>
        <div class="fiche-infos">
          ${p.nouveau ? '<span class="badge" style="position:static;display:inline-block;background:var(--sable)">Nouveau</span>' : ""}
          <h1>${esc(p.nom)}</h1>
          <p class="fiche-prix">${esc(fmt(p.prix))}</p>
          ${p.description ? `<p>${esc(p.description)}</p>` : ""}
          ${tailles.length ? `<fieldset><legend>Taille</legend><div class="tailles">${tailles.map((t) =>
            `<label class="taille"><input type="radio" name="taille" value="${esc(t)}"${t === taille ? " checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div></fieldset>` : ""}
          <div><span id="lib-qte" style="font-weight:600;display:block;margin-bottom:8px">Quantité</span>
            <div class="quantite" role="group" aria-labelledby="lib-qte">
              <button type="button" data-qte="-1" aria-label="Diminuer la quantité">&minus;</button>
              <output id="qte" aria-live="polite">${qte}</output>
              <button type="button" data-qte="1" aria-label="Augmenter la quantité">+</button>
            </div></div>
          <div class="fiche-actions">
            <button class="bouton" type="button" id="ajouter">Ajouter au panier</button>
            <a class="bouton bouton-clair" id="commander" target="_blank" rel="noopener" href="#">Commander sur WhatsApp</a>
            <button class="bouton-fav" type="button" data-fav="${p.id}" aria-pressed="${favoris.includes(p.id)}"><svg class="ico"><use href="#i-coeur"/></svg>Favori</button>
          </div>
        </div>
      </div>`;
    const sim = produits.filter((x) => x.categorie === p.categorie && x.id !== p.id).slice(0, 4);
    $("#bloc-similaires").hidden = sim.length === 0;
    $("#similaires").innerHTML = sim.map(carte).join("");
    majCommande();
  };
  rendre();

  cible.addEventListener("click", (e) => {
    const mini = e.target.closest(".miniature");
    if (mini) {
      $("#photo-principale").src = mini.dataset.src;
      $$(".miniature").forEach((m) => m.setAttribute("aria-current", m === mini));
      return;
    }
    const d = e.target.closest("[data-qte]");
    if (d) { qte = Math.max(1, Math.min(20, qte + Number(d.dataset.qte))); $("#qte").textContent = qte; majCommande(); return; }
    if (e.target.closest("#ajouter")) ajouterPanier(p.id, taille, qte);
  });
  cible.addEventListener("change", (e) => {
    if (e.target.name === "taille") { taille = e.target.value; majCommande(); }
  });
}

/* ---------- Panier ---------- */
function pagePanier() {
  const zone = $("#panier-contenu");
  rendre = () => {
    const lignes = panier.map((l, i) => ({ ...l, i, p: parId(l.id) })).filter((l) => l.p);
    if (!lignes.length) {
      zone.innerHTML = '<p class="vide">Votre panier est vide.</p><a class="bouton" href="boutique.html">Découvrir la boutique</a>';
      return;
    }
    const total = lignes.reduce((s, l) => s + l.p.prix * l.qte, 0);
    const nb = lignes.reduce((s, l) => s + l.qte, 0);
    const message = `Bonjour ${CONFIG.boutique}, je souhaite commander :\n` +
      lignes.map((l) => `- ${l.p.nom}${l.taille ? `, taille ${l.taille}` : ""} x${l.qte} = ${fmt(l.p.prix * l.qte)}`).join("\n") +
      `\nTotal : ${fmt(total)}`;
    zone.innerHTML = `<div class="panier-grille">
      <ul class="lignes">${lignes.map((l) => `<li class="ligne">
        <img src="${esc(l.p.images[0])}" alt="${esc(l.p.nom)}">
        <div class="ligne-infos"><a href="produit.html?id=${l.p.id}">${esc(l.p.nom)}</a>${l.taille ? `<span>Taille : ${esc(l.taille)}</span>` : ""}<span>${esc(fmt(l.p.prix))}</span></div>
        <div class="quantite" role="group" aria-label="Quantité de ${esc(l.p.nom)}">
          <button type="button" data-ligne="${l.i}" data-delta="-1" aria-label="Diminuer la quantité">&minus;</button>
          <output>${l.qte}</output>
          <button type="button" data-ligne="${l.i}" data-delta="1" aria-label="Augmenter la quantité">+</button>
        </div>
        <strong>${esc(fmt(l.p.prix * l.qte))}</strong>
        <button class="lien-suppr" type="button" data-supprimer="${l.i}" aria-label="Retirer ${esc(l.p.nom)} du panier">Retirer</button>
      </li>`).join("")}</ul>
      <aside class="resume"><h2>Récapitulatif</h2>
        <dl><dt>Articles</dt><dd>${nb}</dd><dt>Total</dt><dd>${esc(fmt(total))}</dd></dl>
        <a class="bouton" target="_blank" rel="noopener" href="${esc(lienWA(message))}">Commander sur WhatsApp</a>
        <button class="lien-suppr" type="button" id="vider">Vider le panier</button>
        <p class="note">Votre commande est envoyée sur WhatsApp. La boutique la confirme avec vous, y compris le paiement et la livraison.</p>
      </aside></div>`;
  };
  rendre();
  zone.addEventListener("click", (e) => {
    const d = e.target.closest("[data-delta]");
    const s = e.target.closest("[data-supprimer]");
    if (d) { const l = panier[Number(d.dataset.ligne)]; l.qte = Math.max(1, Math.min(20, l.qte + Number(d.dataset.delta))); }
    else if (s) panier.splice(Number(s.dataset.supprimer), 1);
    else if (e.target.closest("#vider")) panier = [];
    else return;
    store.set("jmd_panier", panier);
    majComptes();
    rendre();
  });
}

/* ---------- Contact ---------- */
function pageContact() {
  $("#form-contact").addEventListener("submit", (e) => {
    e.preventDefault();
    const nom = $("#c-nom").value.trim();
    const msg = $("#c-msg").value.trim();
    window.open(lienWA(`Bonjour ${CONFIG.boutique}, je m'appelle ${nom}. ${msg}`), "_blank", "noopener");
  });
}

/* ---------- Événements communs ---------- */
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("#ouvrir-params")) {
    $$('input[name="devise"]').forEach((i) => (i.checked = i.value === prefs.devise));
    $$('input[name="theme"]').forEach((i) => (i.checked = i.value === prefs.theme));
    $("#params").showModal();
    return;
  }
  if (t.closest("#params-fermer") || t === $("#params")) { $("#params").close(); return; }
  const fav = t.closest("[data-fav]");
  if (fav) { basculerFavori(Number(fav.dataset.fav)); return; }
  const menu = t.closest(".menu-bouton");
  if (menu) {
    const ouvert = $("#nav").classList.toggle("ouvert");
    menu.setAttribute("aria-expanded", ouvert);
    return;
  }
  if (t.closest("#reinit")) {
    $$('input[name="cat"]').forEach((i) => (i.checked = i.value === "tous"));
    $$('input[name="taille"]').forEach((i) => (i.checked = false));
    $("#prix-max").value = $("#prix-max").max;
    $("#tri").value = "pertinence";
    F.nouveau = false; F.favoris = false; F.q = ""; $("#recherche-haut").value = "";
    lireFiltres(); rendre();
  }
});

document.addEventListener("change", (e) => {
  const n = e.target.name;
  if (n === "devise" || n === "theme") {
    prefs[n] = e.target.value;
    store.set("jmd_prefs", prefs);
    appliquerTheme();
    rendre();
    return;
  }
  if (document.body.dataset.page === "boutique" && (e.target.closest("#panneau") || e.target.id === "tri")) { lireFiltres(); rendre(); }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "prix-max") { lireFiltres(); rendre(); }
});

// Photo manquante : cadre neutre au lieu d'une image cassée
document.addEventListener("error", (e) => {
  if (e.target.tagName === "IMG" && !e.target.dataset.ko) { e.target.dataset.ko = "1"; e.target.src = PLACEHOLDER; }
}, true);

/* ---------- Démarrage ---------- */
async function demarrer() {
  appliquerTheme();
  monterLayout();
  majComptes();
  $$("[data-whatsapp]").forEach((a) => { a.href = lienWA(); a.target = "_blank"; a.rel = "noopener"; });
  const page = document.body.dataset.page;
  if (page === "contact") pageContact();
  if (!["accueil", "boutique", "produit", "panier"].includes(page)) return;
  if (!(await charger())) return;
  ({ accueil: pageAccueil, boutique: pageBoutique, produit: pageProduit, panier: pagePanier })[page]();
}
demarrer();
