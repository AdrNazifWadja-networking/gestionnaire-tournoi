// VARIABLES GLOBALES ENRICHIES
let totalTeams = 0;
let totalReferees = 0;
let teamsData = [];     // Stocke les objets Équipes complets
let refereesList = [];  // Stocke la liste des arbitres
let groups = {};
let matchsList = [];
let statsTeams = {};
let phaseFinaleData = {};
let currentModalMatchIndex = null;

// Passage d'écran
function switchScreen(currentId, nextId) {
    document.getElementById(currentId).classList.remove('active');
    document.getElementById(nextId).classList.add('active');
}

// 1. Générer les formulaires complets pour les clubs et arbitres
function genererChampsConfig() {
    totalTeams = parseInt(document.getElementById('nb-teams').value);
    totalReferees = parseInt(document.getElementById('nb-referees').value);

    if (totalTeams < 4 || totalTeams % 4 !== 0) {
        alert("Choisis un multiple de 4 pour les équipes (4, 8, 16...)");
        return;
    }

    // Génération des champs Arbitres
    const refContainer = document.getElementById('arbitres-container');
    refContainer.innerHTML = "<h4>👮 Liste des Arbitres</h4>";
    for(let i=1; i<=totalReferees; i++) {
        refContainer.innerHTML += `
            <div class="player-row">
                <input type="text" class="ref-name" placeholder="Nom Arbitre ${i}" value="Arbitre ${i}">
                <input type="text" class="ref-country" placeholder="Pays" value="Togo">
                <input type="text" class="ref-photo" placeholder="Lien Photo URL" value="https://via.placeholder.com/50">
            </div>
        `;
    }

    // Génération des blocs Clubs
    const clubsContainer = document.getElementById('clubs-container');
    clubsContainer.innerHTML = "";
    
    for(let c=1; c<=totalTeams; c++) {
        let clubHTML = `
            <div class="form-section">
                <h4>🛡️ Club ${c} : <input type="text" class="club-name" value="Club ${c}" style="font-weight:bold;"></h4>
                <div class="player-row">
                    <input type="text" class="club-president" placeholder="Nom du Président" value="Président ${c}">
                    <input type="text" class="club-coach" placeholder="Nom du Coach" value="Coach ${c}">
                    <input type="text" class="club-staff" placeholder="Staff" value="Staff ${c}">
                </div>
                <h5>🏃‍♂️ Liste des Joueurs (1 G, 2 DEF, 2 MIL, 1 ATT)</h5>
                <div class="players-list-inputs">
        `;
        
        const postesfictifs = ["Gardien", "Défenseur", "Défenseur", "Milieu", "Milieu", "Attaquant"];
        for(let j=1; j<=6; j++) {
            clubHTML += `
                <div class="player-row row-j">
                    <input type="text" class="p-name" placeholder="Nom" value="Joueur ${c}-${j}">
                    <input type="text" class="p-country" placeholder="Nationalité" value="Togo">
                    <input type="number" class="p-height" placeholder="Taille (cm)" value="180">
                    <select class="p-role">
                        <option value="Gardien" ${postesfictifs[j-1]==='Gardien'?'selected':''}>Gardien</option>
                        <option value="Défenseur" ${postesfictifs[j-1]==='Défenseur'?'selected':''}>Défenseur</option>
                        <option value="Milieu" ${postesfictifs[j-1]==='Milieu'?'selected':''}>Milieu</option>
                        <option value="Attaquant" ${postesfictifs[j-1]==='Attaquant'?'selected':''}>Attaquant</option>
                    </select>
                    <input type="text" class="p-photo" placeholder="Lien Photo URL" value="https://via.placeholder.com/50">
                </div>
            `;
        }
        clubHTML += `</div></div>`;
        clubsContainer.innerHTML += clubHTML;
    }
    switchScreen('screen-config', 'screen-details');
}

// 2. Extraire toutes les données saisies et faire le tirage au sort des poules
function lancerTirageAuSort() {
    refereesList = [];
    document.querySelectorAll('.ref-name').forEach((el, idx) => {
        refereesList.push({
            nom: el.value,
            pays: document.querySelectorAll('.ref-country')[idx].value,
            photo: document.querySelectorAll('.ref-photo')[idx].value,
            matchsDiriges: 0, noteTotale: 0, cartonsJaunes: 0, cartonsRouges: 0
        });
    });

    teamsData = [];
    document.querySelectorAll('.form-section:not(#arbitres-container)').forEach(section => {
        let name = section.querySelector('.club-name').value;
        let president = section.querySelector('.club-president').value;
        let coach = section.querySelector('.club-coach').value;
        let staff = section.querySelector('.club-staff').value;
        
        let joueurs = [];
        section.querySelectorAll('.row-j').forEach(row => {
            joueurs.push({
                nom: row.querySelector('.p-name').value,
                pays: row.querySelector('.p-country').value,
                taille: parseInt(row.querySelector('.p-height').value),
                poste: row.querySelector('.p-role').value,
                photo: row.querySelector('.p-photo').value,
                buts: 0, passes: 0, cartonsJ: 0, cartonsR: 0, note: 0, matchsJoues: 0, suspendu: false
            });
        });
        teamsData.push({ nom: name, president, coach, staff, joueurs });
    });

    let tempClubs = [...teamsData];
    for (let i = tempClubs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempClubs[i], tempClubs[j]] = [tempClubs[j], tempClubs[i]];
    }

    groups = {};
    const alphabet = "ABCDEFGH";
    for (let i = 0; i < tempClubs.length; i += 4) {
        groups[`Poule ${alphabet[Math.floor(i / 4)]}`] = tempClubs.slice(i, i + 4);
    }

    afficherPoules();
    switchScreen('screen-details', 'screen-poules');
}

// 3. Affichage des Poules et initialisation des matchs
function afficherPoules() {
    const display = document.getElementById('poules-display');
    display.innerHTML = "";
    statsTeams = {};
    matchsList = [];

    for (const [groupName, members] of Object.entries(groups)) {
        members.forEach(club => {
            statsTeams[club.nom] = { pts: 0, bp: 0, bc: 0, diff: 0 };
        });

        let groupHTML = `
            <div class="poule-card">
                <h4>${groupName}</h4>
                <table border="1" style="width:100%; text-align:center; border-collapse:collapse; font-size:13px;">
                    <thead><tr style="background:#f2f2f2;"><th>Équipe</th><th>Pts</th><th>BP</th><th>BC</th><th>Diff</th></tr></thead>
                    <tbody id="table-${groupName.replace(/\s+/g, '')}"></tbody>
                </table>
            </div>
        `;
        display.innerHTML += groupHTML;

        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                let arbitreAlea = refereesList[Math.floor(Math.random() * refereesList.length)];
                matchsList.push({
                    poule: groupName, home: members[i], away: members[j],
                    scoreHome: null, scoreAway: null, arbitre: arbitreAlea,
                    detailsButs: [], detailsPasses: [], detailsJaunes: [], detailsRouges: [],
                    noteRef: 7, noteGkH: 6, noteGkA: 6
                });
            }
        }
    }
    actualiserTableauxClassement();
    afficherMatchs();
}

function afficherMatchs() {
    const container = document.getElementById('matchs-display');
    container.innerHTML = "";

    matchsList.forEach((match, index) => {
        let scoreTxt = (match.scoreHome !== null) ? `${match.scoreHome} - ${match.scoreAway}` : "Remplir Feuille de Match";
        container.innerHTML += `
            <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size:11px; color:#666; width:70px;">${match.poule}</span>
                <span style="width: 150px; text-align: right;"><b>${match.home.nom}</b></span>
                <button onclick="ouvrirFeuilleMatch(${index})">${scoreTxt}</button>
                <span style="width: 150px; text-align: left;"><b>${match.away.nom}</b></span>
                <span style="font-size:11px; color:green;">👮 ${match.arbitre.nom}</span>
            </div>
        `;
    });
}

// 4. FEUILLE DE MATCH MANUELLE (Sélection Arbitre, Buteurs, Cartons)
function ouvrirFeuilleMatch(index) {
    currentModalMatchIndex = index;
    let match = matchsList[index];
    
    document.getElementById('modal-match-title').innerText = `📄 Feuille de Match : ${match.home.nom} VS ${match.away.nom}`;
    
    // Concaténer tous les joueurs présents des deux clubs pour les listes déroulantes
    let optionsJoueurs = `<option value="">-- Aucun / Sélectionner --</option>`;
    
    let htmlHomeJoueurs = "";
    match.home.joueurs.forEach(j => {
        let status = j.suspendu ? "❌ SUSPENDU" : "✅ Dispo";
        htmlHomeJoueurs += `<option value="H|${j.nom}" ${j.suspendu?'disabled':''}>${j.nom} (${j.poste}) ${status}</option>`;
    });
    
    let htmlAwayJoueurs = "";
    match.away.joueurs.forEach(j => {
        let status = j.suspendu ? "❌ SUSPENDU" : "✅ Dispo";
        htmlAwayJoueurs += `<option value="A|${j.nom}" ${j.suspendu?'disabled':''}>${j.nom} (${j.poste}) ${status}</option>`;
    });

    let optionsArbitres = "";
    refereesList.forEach(r => {
        optionsArbitres += `<option value="${r.nom}" ${match.arbitre.nom === r.nom ? 'selected' : ''}>${r.nom}</option>`;
    });

    let content = `
        <div style="text-align:left; font-size:13px;">
            <div style="margin-bottom:12px; background:#f1f3f5; padding:8px; border-radius:4px;">
                <label><b>👮 Changer l'Arbitre Central :</b></label>
                <select id="sheet-ref">${optionsArbitres}</select>
                <label>Note Match :</label><input type="number" id="sheet-ref-note" value="${match.noteRef}" min="1" max="10" style="width:40px;">
            </div>
            
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <div><label>Score <b>${match.home.nom}</b> :</label><input type="number" id="sheet-score-h" value="${match.scoreHome||0}" min="0" style="width:45px;"></div>
                <div><label>Score <b>${match.away.nom}</b> :</label><input type="number" id="sheet-score-a" value="${match.scoreAway||0}" min="0" style="width:45px;"></div>
            </div>
            
            <hr>
            <h4>⚽ Buteurs & Passeurs</h4>
            <div id="goals-inputs-zone">
                <p style="font-size:11px;color:#666;">Ajoutez les joueurs ayant marqué ou délivré une passe décisive :</p>
                <button type="button" onclick="ajouterLigneButeur('${htmlHomeJoueurs}', '${htmlAwayJoueurs}')">+ Ajouter un but</button>
                <div id="goals-list-container" style="margin-top:5px;"></div>
            </div>

            <hr>
            <h4>🟨 / 🟥 Discipline & Sanctions</h4>
            <div id="cards-inputs-zone">
                <button type="button" onclick="ajouterLigneSanction('${htmlHomeJoueurs}', '${htmlAwayJoueurs}')">+ Ajouter un carton</button>
                <div id="cards-list-container" style="margin-top:5px;"></div>
            </div>

            <hr>
            <h5>🧤 Notes des Gardiens de but</h5>
            <label>${match.home.nom} :</label> <input type="number" id="sheet-gk-h" value="${match.noteGkH}" min="1" max="10" style="width:40px;">
            <label>${match.away.nom} :</label> <input type="number" id="sheet-gk-a" value="${match.noteGkA}" min="1" max="10" style="width:40px;">
        </div>
    `;
    
    document.getElementById('modal-events-content').innerHTML = content;
    document.getElementById('overlay-match').style.display = "block";
    document.getElementById('modal-match').style.display = "block";

    // Recharger les lignes déjà enregistrées si le match avait déjà été saisi
    match.detailsButs.forEach(b => injecterLigneButeurExistante(b, htmlHomeJoueurs, htmlAwayJoueurs));
    match.detailsJaunes.forEach(j => injecterLigneSanctionExistante(j, "🟨", htmlHomeJoueurs, htmlAwayJoueurs));
    match.detailsRouges.forEach(r => injecterLigneSanctionExistante(r, "🟥", htmlHomeJoueurs, htmlAwayJoueurs));
}

function ajouterLigneButeur(homeOpt, awayOpt) {
    const container = document.getElementById('goals-list-container');
    container.innerHTML += `
        <div class="player-row goal-entry" style="background:#fff3cd; padding:4px; border-radius:4px;">
            ⚽ Buteur: <select class="g-scorer"><option value="">--</option><optgroup label="Domicile">${homeOpt}</optgroup><optgroup label="Extérieur">${awayOpt}</optgroup></select>
            👟 Passeur: <select class="g-passer"><option value="">--</option><optgroup label="Domicile">${homeOpt}</optgroup><optgroup label="Extérieur">${awayOpt}</optgroup></select>
            <button type="button" onclick="this.parentElement.remove()" style="background:red;padding:2px 5px;">X</button>
        </div>
    `;
}

function ajouterLigneSanction(homeOpt, awayOpt) {
    const container = document.getElementById('cards-list-container');
    container.innerHTML += `
        <div class="player-row card-entry" style="background:#f8d7da; padding:4px; border-radius:4px;">
            👤 Joueur: <select class="c-player"><option value="">--</option><optgroup label="Domicile">${homeOpt}</optgroup><optgroup label="Extérieur">${awayOpt}</optgroup></select>
            🎴 Type: <select class="c-type"><option value="🟨">🟨 Carton Jaune</option><option value="🟥">🟥 Carton Rouge Direct</option></select>
            <button type="button" onclick="this.parentElement.remove()" style="background:red;padding:2px 5px;">X</button>
        </div>
    `;
}

// Fonctions d'aide pour la ré-injection visuelle
function injecterLigneButeurExistante(obj, homeOpt, awayOpt) {
    ajouterLigneButeur(homeOpt, awayOpt);
    let rows = document.querySelectorAll('.goal-entry');
    let last = rows[rows.length - 1];
    last.querySelector('.g-scorer').value = obj.scorer;
    last.querySelector('.g-passer').value = obj.passer;
}
function injecterLigneSanctionExistante(nomJoueur, type, homeOpt, awayOpt) {
    ajouterLigneSanction(homeOpt, awayOpt);
    let rows = document.querySelectorAll('.card-entry');
    let last = rows[rows.length - 1];
    last.querySelector('.c-player').value = nomJoueur;
    last.querySelector('.c-type').value = type;
}

// 5. ENREGISTRER LA FEUILLE DE MATCH DE L'ARBITRE & APPLIQUER LES EFFETS
function fermerModalMatch() {
    let index = currentModalMatchIndex;
    let match = matchsList[index];
    
    let sh = parseInt(document.getElementById('sheet-score-h').value);
    let sa = parseInt(document.getElementById('sheet-score-a').value);
    let refNom = document.getElementById('sheet-ref').value;
    
    match.scoreHome = sh;
    match.scoreAway = sa;
    match.noteRef = parseInt(document.getElementById('sheet-ref-note').value);
    match.noteGkH = parseInt(document.getElementById('sheet-gk-h').value);
    match.noteGkA = parseInt(document.getElementById('sheet-gk-a').value);
    
    // Associer l'arbitre choisi
    let arbitreChoisi = refereesList.find(r => r.nom === refNom);
    match.arbitre = arbitreChoisi;

    // Vider les anciens détails pour recalculer proprement
    match.detailsButs = [];
    match.detailsPasses = [];
    match.detailsJaunes = [];
    match.detailsRouges = [];

    // Récupérer les buteurs/passeurs saisis
    document.querySelectorAll('.goal-entry').forEach(row => {
        let scorer = row.querySelector('.g-scorer').value;
        let passer = row.querySelector('.g-passer').value;
        if(scorer !== "") match.detailsButs.push({ scorer, passer });
    });

    // Récupérer les cartons saisis
    document.querySelectorAll('.card-entry').forEach(row => {
        let p = row.querySelector('.c-player').value;
        let t = row.querySelector('.c-type').value;
        if(p !== "") {
            if(t === "🟨") match.detailsJaunes.push(p);
            else match.detailsRouges.push(p);
        }
    });

    document.getElementById('overlay-match').style.display = "none";
    document.getElementById('modal-match').style.display = "none";
    
    // Lancer le recalcul global de la ligue
    recalculerStatistiquesGlobales();
    afficherMatchs();
}

// 6. ALGORITHME DE SYNCHRONISATION : METTRE À JOUR LES JOUEURS ET LES SUSPENSIONS
function recalculerStatistiquesGlobales() {
    // 1. Reset des équipes pour le classement général
    for (let team in statsTeams) statsTeams[team] = { pts: 0, bp: 0, bc: 0, diff: 0 };

    // 2. Reset individuel de tous les acteurs
    refereesList.forEach(r => { r.matchsDiriges = 0; r.noteTotale = 0; r.cartonsJaunes = 0; r.cartonsRouges = 0; });
    teamsData.forEach(club => {
        club.joueurs.forEach(j => {
            j.buts = 0; j.passes = 0; j.cartonsJ = 0; j.cartonsR = 0; j.note = 0; j.matchsJoues = 0; j.suspendu = false;
        });
    });

    // 3. Traiter l'historique de chaque feuille de match enregistrée
    matchsList.forEach(m => {
        if (m.scoreHome !== null && m.scoreAway !== null) {
            // Stats d'équipes
            statsTeams[m.home.nom].bp += m.scoreHome;
            statsTeams[m.home.nom].bc += m.scoreAway;
            statsTeams[m.away.nom].bp += m.scoreAway;
            statsTeams[m.away.nom].bc += m.scoreHome;

            if (m.scoreHome > m.scoreAway) statsTeams[m.home.nom].pts += 3;
            else if (m.scoreHome < m.scoreAway) statsTeams[m.away.nom].pts += 3;
            else { statsTeams[m.home.nom].pts += 1; statsTeams[m.away.nom].pts += 1; }

            statsTeams[m.home.nom].diff = statsTeams[m.home.nom].bp - statsTeams[m.home.nom].bc;
            statsTeams[m.away.nom].diff = statsTeams[m.away.nom].bp - statsTeams[m.away.nom].bc;

            // Arbitres
            m.arbitre.matchsDiriges++;
            m.arbitre.noteTotale += m.noteRef;
            m.arbitre.cartonsJaunes += m.detailsJaunes.length;
            m.arbitre.cartonsRouges += m.detailsRouges.length;

            // Compter les matchs joués pour tout le monde
            m.home.joueurs.forEach(j => { j.matchsJoues++; j.note += 5; }); // Base neutre de 5/10 par match
            m.away.joueurs.forEach(j => { j.matchsJoues++; j.note += 5; });

            // Gardiens
            let gkH = m.home.joueurs.find(j => j.poste === "Gardien");
            let gkA = m.away.joueurs.find(j => j.poste === "Gardien");
            if(gkH) gkH.note += (m.noteGkH - 5); // Rectifier avec la vraie note saisie
            if(gkA) gkA.note += (m.noteGkA - 5);

            // Appliquer les buts et passes de la feuille
            m.detailsButs.forEach(b => {
                let partsS = b.scorer.split('|'); // [H ou A, NomJoueur]
                let partsP = b.passer.split('|');
                
                let squadScorer = partsS[0] === 'H' ? m.home.joueurs : m.away.joueurs;
                let playerScorer = squadScorer.find(j => j.nom === partsS[1]);
                if(playerScorer) { playerScorer.buts++; playerScorer.note += 2; } // Bonus note pour un but

                if(b.passer !== "") {
                    let squadPasser = partsP[0] === 'H' ? m.home.joueurs : m.away.joueurs;
                    let playerPasser = squadPasser.find(j => j.nom === partsP[1]);
                    if(playerPasser) { playerPasser.passes++; playerPasser.note += 1; }
                }
            });

            // Appliquer les cartons de la feuille de match et gérer les exclusions à venir
            m.detailsJaunes.forEach(jStr => {
                let parts = jStr.split('|');
                let squad = parts[0] === 'H' ? m.home.joueurs : m.away.joueurs;
                let player = squad.find(j => j.nom === parts[1]);
                if(player) {
                    player.cartonsJ++;
                    player.note -= 0.5;
                    // Règle : 2 cartons jaunes cumulés = 1 match manqué (le joueur passe suspendu pour le tour d'après)
                    if(player.cartonsJ >= 2) player.suspendu = true;
                }
            });

            m.detailsRouges.forEach(rStr => {
                let parts = rStr.split('|');
                let squad = parts[0] === 'H' ? m.home.joueurs : m.away.joueurs;
                let player = squad.find(j => j.nom === parts[1]);
                if(player) {
                    player.cartonsR++;
                    player.note -= 2;
                    player.suspendu = true; // Suspendu immédiatement au match suivant
                }
            });
        }
    });

    actualiserTableauxClassement();
}

function actualiserTableauxClassement() {
    for (const groupName of Object.keys(groups)) {
        const idTable = `table-${groupName.replace(/\s+/g, '')}`;
        const tbody = document.getElementById(idTable);
        if (!tbody) continue;

        let members = [...groups[groupName]];
        members.sort((a, b) => {
            if (statsTeams[b.nom] !== statsTeams[a.nom]) return statsTeams[b.nom].pts - statsTeams[a.nom].pts;
            return statsTeams[b.nom].diff - statsTeams[a.nom].diff;
        });

        tbody.innerHTML = "";
        members.forEach((club, index) => {
            let rowStyle = (index < 2) ? "style='background-color: #e8f5e9;'" : "";
            tbody.innerHTML += `
                <tr ${rowStyle}>
                    <td style="text-align:left; padding:5px;">${index + 1}. ${club.nom}</td>
                    <td><b>${statsTeams[club.nom].pts}</b></td>
                    <td>${statsTeams[club.nom].bp}</td>
                    <td>${statsTeams[club.nom].bc}</td>
                    <td>${statsTeams[club.nom].diff}</td>
                </tr>
            `;
        });
    }
}

// 7. ARBRE DE PHASE FINALE
function genererPhaseFinale() {
    let qualifies = [];
    const sortedGroups = Object.keys(groups).sort();

    sortedGroups.forEach(groupName => {
        let members = [...groups[groupName]];
        members.sort((a, b) => statsTeams[b.nom].pts - statsTeams[a.nom].pts);
        qualifies.push(members[0]);
        qualifies.push(members[1]);
    });

    phaseFinaleData = { semis: [], finale: [], champion: "" };

    if (qualifies.length >= 4) {
        phaseFinaleData.semis.push({ home: qualifies[0], away: qualifies[3], winner: null });
        phaseFinaleData.semis.push({ home: qualifies[2], away: qualifies[1], winner: null });
        phaseFinaleData.finale = [{ home: "?", away: "?", winner: null }];
    } else {
        phaseFinaleData.finale = [{ home: qualifies[0]||"?", away: qualifies[1]||"?", winner: null }];
    }

    switchScreen('screen-poules', 'screen-tree');
    dessinerArbre();
}

function dessinerArbre() {
    const container = document.getElementById('tree-container');
    container.innerHTML = "";

    function creerColonneHTML(titre, matchs, etapeCle) {
        if (matchs.length === 0) return "";
        let html = `<div style="display: flex; flex-direction: column; justify-content: space-around; height: 350px;"><h4>${titre}</h4>`;
        matchs.forEach((m, index) => {
            let nameH = m.home.nom || m.home;
            let nameA = m.away.nom || m.away;
            let styleHome = m.winner && m.winner.nom === nameH ? "background:#c8e6c9;font-weight:bold;" : "";
            let styleAway = m.winner && m.winner.nom === nameA ? "background:#c8e6c9;font-weight:bold;" : "";
            
            html += `
                <div style="background: white; border: 1px solid #ced4da; border-radius: 6px; width: 180px; overflow: hidden; text-align:left;">
                    <div style="padding: 8px; cursor: pointer; ${styleHome}" onclick="designerVainqueur('${etapeCle}', ${index}, 'home')">${nameH}</div>
                    <div style="border-top: 1px solid #eee; padding: 8px; cursor: pointer; ${styleAway}" onclick="designerVainqueur('${etapeCle}', ${index}, 'away')">${nameA}</div>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    }

    if (phaseFinaleData.semis.length > 0) container.innerHTML += creerColonneHTML("Demi-Finales", phaseFinaleData.semis, "semis");
    if (phaseFinaleData.finale.length > 0) container.innerHTML += creerColonneHTML("Finale", phaseFinaleData.finale, "finale");

    if (phaseFinaleData.champion) {
        document.getElementById('champion-display').innerHTML = `🎉 CHAMPION : ${phaseFinaleData.champion.nom} 🎉`;
        document.getElementById('btn-recompenses').style.display = "inline-block";
    }
}

function designerVainqueur(etape, index, cote) {
    let match = phaseFinaleData[etape][index];
    if (cote === 'home' && match.home === "?") return;
    if (cote === 'away' && match.away === "?") return;

    let vainqueur = (cote === 'home') ? match.home : match.away;
    match.winner = vainqueur;

    if (etape === "semis") {
        if (index === 0) phaseFinaleData.finale[0].home = vainqueur;
        else phaseFinaleData.finale[0].away = vainqueur;
        phaseFinaleData.champion = "";
    } else if (etape === "finale") {
        phaseFinaleData.champion = vainqueur;
    }
    dessinerArbre();
}

// 8. PALMARÈS DE FIN REPOSANT SUR LES FEUILLES DE MATCHS REELLES
function afficherPalmaresFin() {
    switchScreen('screen-tree', 'screen-rewards');

    let tousLesJoueurs = [];
    teamsData.forEach(club => {
        club.joueurs.forEach(j => {
            j.clubNom = club.nom;
            tousLesJoueurs.push(j);
        });
    });

    // Calculs basés uniquement sur les compteurs de la feuille
    let meilleurButeur = [...tousLesJoueurs].sort((a,b) => b.buts - a.buts)[0];
    let meilleurPasseur = [...tousLesJoueurs].sort((a,b) => b.passes - a.passes)[0];
    let meilleurJoueur = [...tousLesJoueurs].sort((a,b) => (b.note/b.matchsJoues) - (a.note/a.matchsJoues))[0];
    let meilleurGardien = tousLesJoueurs.filter(j => j.poste === "Gardien").sort((a,b) => (b.note/b.matchsJoues) - (a.note/a.matchsJoues))[0];
    let meilleurArbitre = [...refereesList].filter(r => r.matchsDiriges > 0).sort((a,b) => (b.noteTotale/b.matchsDiriges) - (a.noteTotale/a.matchsDiriges))[0] || refereesList[0];
    let meilleurCoach = [...teamsData].sort(() => 0.5 - Math.random())[0]; 

    const awardsZone = document.getElementById('individual-awards');
    awardsZone.innerHTML = `
        <h4>🏅 Palmarès Officiel (Basé sur les Feuilles de Matchs)</h4>
        <p><b>⚽ Soulier d'or (Meilleur Buteur) :</b> ${meilleurButeur.nom} (${meilleurButeur.clubNom}) - <b>${meilleurButeur.buts}</b> buts</p>
        <p><b>👟 Meilleur Passeur :</b> ${meilleurPasseur.nom} (${meilleurPasseur.clubNom}) - <b>${meilleurPasseur.passes}</b> passes</p>
        <p><b>✨ Meilleur Joueur (MVP) :</b> ${meilleurJoueur.nom} (${meilleurJoueur.clubNom})</p>
        <p><b>🧤 Gants d'or (Meilleur Gardien) :</b> ${meilleurGardien ? meilleurGardien.nom : 'N/A'} (${meilleurGardien ? meilleurGardien.clubNom : ''})</p>
        <p><b>👔 Prix du Meilleur Entraîneur :</b> ${meilleurCoach.coach} (${meilleurCoach.nom})</p>
        <p><b>👮 Sifflet d'or (Meilleur Arbitre) :</b> ${meilleurArbitre.nom} (Note moy: ${(meilleurArbitre.noteTotale / (meilleurArbitre.matchsDiriges || 1)).toFixed(1)}/10) <br>
           <small>Cartons sortis : 🟨 ${meilleurArbitre.cartonsJaunes} | 🟥 ${meilleurArbitre.cartonsRouges}</small>
        </p>
    `;

    // 11 TYPE DE LA LIGUE
    let gk = tousLesJoueurs.filter(j => j.poste === "Gardien")[0];
    let defs = tousLesJoueurs.filter(j => j.poste === "Défenseur").slice(0, 2);
    let mils = tousLesJoueurs.filter(j => j.poste === "Milieu").slice(0, 2);
    let att = tousLesJoueurs.filter(j => j.poste === "Attaquant")[0];

    const terrain = document.getElementById('football-field');
    terrain.innerHTML = "";

    if(gk) terrain.innerHTML += `<div class="pos" style="bottom: 20px; left: 50%;">${gk.nom}</div>`;
    if(defs[0]) terrain.innerHTML += `<div class="pos" style="bottom: 120px; left: 30%;">${defs[0].nom}</div>`;
    if(defs[1]) terrain.innerHTML += `<div class="pos" style="bottom: 120px; left: 70%;">${defs[1].nom}</div>`;
    if(mils[0]) terrain.innerHTML += `<div class="pos" style="bottom: 240px; left: 30%;">${mils[0].nom}</div>`;
    if(mils[1]) terrain.innerHTML += `<div class="pos" style="bottom: 240px; left: 70%;">${mils[1].nom}</div>`;
    if(att) terrain.innerHTML += `<div class="pos" style="top: 40px; left: 50%;">${att.nom}</div>`;
}