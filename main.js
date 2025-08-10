// Langues supportées
const LANGS = ['FR', 'EN', 'PT'];
let langIdx = 0;

// Fonction pour réactiver les animations
function restartAnimations() {
  // Relance toutes les animations CSS en réinitialisant les propriétés d'animation
  document.querySelectorAll('.anim-fadein-left, .anim-fadein-right, .anim-fadein-up').forEach(el => {
    el.style.animation = 'none';
    // Force reflow
    void el.offsetWidth;
    el.style.animation = '';
  });
  
  // Animation pour les blocs About
  document.querySelectorAll('.about-block').forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });
  
  // Animation pour services-intro
  document.querySelectorAll('.services-intro h1, .services-intro .services-slogan').forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });
  
  // Animation pour contact-section
  const contactSection = document.querySelector('.contact-section');
  if (contactSection) {
    contactSection.style.animation = 'none';
    void contactSection.offsetWidth;
    contactSection.style.animation = '';
  }
  
  // Animation du footer
  const footer = document.querySelector('footer');
  if (footer) {
    footer.style.transition = 'none';
    footer.classList.remove('footer-visible');
    void footer.offsetWidth;
    footer.style.transition = '';
    footer.classList.add('footer-visible');
  }
  
  // Animation des services-quick-contact
  document.querySelectorAll('.services-quick-contact').forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });
}

// Fonction centrale pour appliquer la langue partout
function applyLanguage(lang) {
  translateContact(lang);
  translateHome(lang);
  translateAbout(lang);
  translateServices(lang);
  translateLegal(lang);
  translateContactQuick(lang);
  translateNavFooter(lang);
}

// Gestion du select langue + stockage
const langSelect = document.getElementById('lang-select');
if (langSelect) {
  // Applique la langue stockée au chargement
  const storedLang = localStorage.getItem('selectedLang');
  if (storedLang && langSelect.value !== storedLang) {
    langSelect.value = storedLang;
  }

  langSelect.addEventListener('change', (e) => {
    const selectedValue = e.target.value;
    localStorage.setItem('selectedLang', selectedValue); // Sauvegarde la langue
    applyLanguage(selectedValue); // Applique la langue partout
    restartAnimations(); // Relance les animations
  });
  
  // Si vous voulez cycler au clic (au lieu d'utiliser le dropdown natif)
  // Décommentez ceci et commentez l'événement 'change' ci-dessus :
  /*
  langSelect.addEventListener('click', (e) => {
    e.preventDefault();
    langIdx = (langIdx + 1) % LANGS.length;
    langSelect.value = LANGS[langIdx];
    console.log('Langue cyclée vers:', LANGS[langIdx]);
  });
  */
}

// Animation légère sur les boutons (exclure le select de langue)
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('pointerdown', () => btn.style.transform = 'scale(0.97)');
  btn.addEventListener('pointerup', () => btn.style.transform = '');
  btn.addEventListener('mouseleave', () => btn.style.transform = '');
});

// (Optionnel) Forcer le repaint pour les animations CSS au chargement
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.anim-fadein-left, .anim-fadein-right, .anim-fadein-up').forEach(el => {
    // Force reflow pour garantir l'animation au reload
    void el.offsetWidth;
    el.classList.add('animated');
  });
});

// Animation du footer à l'apparition dans le viewport
window.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('footer');
  if (footer) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            footer.classList.add('footer-visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(footer);
  }
});

// Carrousel 3D services + mobile pile
window.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.carousel-track');
  const cards = Array.from(document.querySelectorAll('.carousel-card'));
  const leftBtn = document.querySelector('.carousel-arrow-left');
  const rightBtn = document.querySelector('.carousel-arrow-right');
  const mobileLeftBtn = document.getElementById('carousel-arrow-mobile-left');
  const mobileRightBtn = document.getElementById('carousel-arrow-mobile-right');
  let current = 0;
  let animating = false;

  function isMobile() {
    return window.matchMedia('(max-width: 700px)').matches;
  }

  function updateCarousel() {
    if (isMobile()) {
      cards.forEach((card, idx) => {
        card.classList.remove('active', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right', 'left', 'right');
        if (idx === current) card.classList.add('active');
        else card.classList.remove('active');
      });
    } else {
      cards.forEach((card, idx) => {
        card.classList.remove('active', 'left', 'right', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
        if (idx === current) card.classList.add('active');
        else if (idx === (current - 1 + cards.length) % cards.length) card.classList.add('left');
        else if (idx === (current + 1) % cards.length) card.classList.add('right');
      });
    }
  }

  function goToMobile(idx, direction) {
    if (animating || idx === current) return;
    animating = true;
    const prev = current;
    const next = idx;
    const outClass = direction === 'right' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'right' ? 'slide-in-right' : 'slide-in-left';

    cards[prev].classList.remove('active', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
    cards[prev].classList.add(outClass);
    cards[next].classList.remove('active', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
    cards[next].classList.add(inClass);

    setTimeout(() => {
      cards[prev].classList.remove(outClass);
      cards[next].classList.remove(inClass);
      cards[next].classList.add('active');
      current = next;
      animating = false;
    }, 450);
  }

  function goTo(idx, direction) {
    if (isMobile()) {
      goToMobile(idx, direction);
    } else {
      if (animating || idx === current) return;
      animating = true;
      current = idx;
      updateCarousel();
      setTimeout(() => { animating = false; }, 600);
    }
  }

  function handleResize() {
    updateCarousel();
  }

  if (cards.length) {
    updateCarousel();
    // Desktop arrows
    if (leftBtn && rightBtn) {
      leftBtn.addEventListener('click', () => {
        goTo((current - 1 + cards.length) % cards.length, 'left');
      });
      rightBtn.addEventListener('click', () => {
        goTo((current + 1) % cards.length, 'right');
      });
    }
    // Mobile arrows
    if (mobileLeftBtn && mobileRightBtn) {
      mobileLeftBtn.addEventListener('click', () => {
        goTo((current - 1 + cards.length) % cards.length, 'left');
      });
      mobileRightBtn.addEventListener('click', () => {
        goTo((current + 1) % cards.length, 'right');
      });
    }
    // Swipe support mobile
    let startX = null;
    if (track) {
      track.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
      });
      track.addEventListener('touchend', e => {
        if (startX === null) return;
        let dx = e.changedTouches[0].clientX - startX;
        if (dx > 40) goTo((current - 1 + cards.length) % cards.length, 'left');
        else if (dx < -40) goTo((current + 1) % cards.length, 'right');
        startX = null;
      });
    }
    window.addEventListener('resize', handleResize);
  }
});

// Exemple de structure pour la traduction dynamique
const translations = {
  FR: {
    "contact.title": "Offre sur mesure — Bots Discord personnalisés",
    "contact.desc1": "Vous avez une idée précise ou un besoin unique pour votre serveur Discord ? Je réalise des bots sur mesure, adaptés à vos envies et à votre communauté.",
    "contact.ul1": [
      "Modération avancée, logs, gestion d’utilisateurs",
      "Commandes personnalisées, interactions, jeux, mini-jeux",
      "Intégration Twitch, YouTube, API externes",
      "Gestion de rôles, salons, permissions, réactions",
      "Base de données, statistiques, automatisations",
      "Fonctionnalités streamer, notifications, paginations, embeds…",
      "Et bien plus : tout est possible, il suffit de demander !"
    ],
    "contact.h2": "Comment ça marche ?",
    "contact.ol1": [
      "<b>Contactez-moi</b> par <a href=\"https://mail.google.com/mail/?view=cm&to=devbyfab@gmail.com\" target=\"_blank\" rel=\"noopener\">mail</a> ou sur Discord : <span class=\"discord-tag\">devbyfab</span>",
      "<b>On discute ensemble</b> de toutes les fonctionnalités, commandes et besoins spécifiques pour votre bot.",
      "<b>L’offre sur mesure inclut de base toutes les fonctionnalités du pack complet</b> (modération, logs, base de données, paginations, MP, etc.).",
      "<b>Un prix fixe</b> est défini une fois toutes les fonctionnalités choisies, selon la complexité et le temps estimé."
    ],
    "contact.final": "<b>Vous ne payez qu’une fois que tout est clair et validé.</b><br>N’hésitez pas à me contacter pour discuter de votre projet, même si vous n’avez qu’une idée ou une question !",
    "contact.quick": "Contact rapide :",
    "contact.email": "Email : ",
    "contact.discord": "Discord : ",
    "contact.fiverr": "Fiverr : ",
    "home.heroTitle": "DevByFab — Custom Discord bots & freelance dev",
    "home.heroDesc": "Je crée des bots Discord personnalisés, des outils web et des solutions adaptées à vos besoins. Sérieux, rapide, à l’écoute.",
    "home.cta1": "Voir les services",
    "home.cta2": "Contact rapide",
    "home.heroBtn1": "Voir les services",
    "home.heroBtn2": "Contact rapide",
    "about.title": "À propos de moi",
    "about.desc": "Développeur freelance passionné, spécialisé dans la création de bots Discord et de solutions web sur mesure. Sérieux, polyvalent et toujours à l’écoute de vos besoins.",
    "about.skillsTitle1": "Langages",
    "about.skillsTitle2": "maîtrisés",
    "about.skillsList": [
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "SQLite",
      "MySQL"
    ],
    "about.styleTitle1": "Style",
    "about.styleTitle2": "de travail",
    "about.styleList": [
      "Polyvalent",
      "Sérieux",
      "Chill",
      "À l’écoute"
    ],
    "about.goalsTitle1": "Objectif",
    "about.goalsTitle2": "futur",
    "about.goalsList": [
      "Intégrations Twitch avancées",
      "Bots Discord encore plus personnalisés",
      "Apprentissage de nouvelles technologies"
    ],
    "services.introTitle": "Service freelance, création de bots Discord sur mesure.",
    "services.slogan": "Vos projets sont uniques, nos solutions authentiques.",
    "services.cards": [
      {
        title: "Starter",
        h2: "Modération basique + messages embed",
        desc: "Commandes de modération simples et messages personnalisés en embed.",
        btn: "Commander"
      },
      {
        title: "Logs+",
        h2: "Modération + logs (sans base de données)",
        desc: "Ajout de logs d’événements Discord, modération avancée, sans base de données.",
        btn: "Commander"
      },
      {
        title: "Full Pack",
        h2: "Full complet (base de données, paginations, MP)",
        desc: "Gestion complète : base de données, paginations, messages privés, logs, modération.",
        btn: "Commander"
      },
      {
        title: "Sur mesure",
        h2: "Sur mesure",
        desc: "Personnalisation complète : modération, logs, base de données, paginations, embeds, MP, intégration Twitch API, fonctionnalités streamers…",
        btn: "En savoir plus"
      }
    ],
    "nav.about": "À propos",
    "nav.services": "Services",
    "nav.contact": "Sur mesure",
    "footer.rights": "Tous droits réservés.",
    "footer.legal": "Mentions légales"
  },
  EN: {
    "contact.title": "Custom Offer — Personalized Discord Bots",
    "contact.desc1": "You have a specific idea or a unique need for your Discord server? I create custom bots tailored to your needs and your community.",
    "contact.ul1": [
      "Advanced moderation, logs, user management",
      "Custom commands, interactions, mini-games",
      "Twitch, YouTube, external API integration",
      "Role, channel, permissions, reaction management",
      "Database, statistics, automations",
      "Streamer features, notifications, paginations, embeds…",
      "And much more: anything is possible, just ask!"
    ],
    "contact.h2": "How does it work?",
    "contact.ol1": [
      "<b>Contact me</b> by <a href=\"https://mail.google.com/mail/?view=cm&to=devbyfab@gmail.com\" target=\"_blank\" rel=\"noopener\">email</a> or on Discord: <span class=\"discord-tag\">devbyfab</span>",
      "<b>We discuss together</b> all the features, commands, and specific needs for your bot.",
      "<b>The custom offer includes by default all features of the full pack</b> (moderation, logs, database, paginations, DMs, etc.).",
      "<b>A fixed price</b> is set once all features are chosen, depending on complexity and estimated time."
    ],
    "contact.final": "<b>You only pay once everything is clear and validated.</b><br>Feel free to contact me to discuss your project, even if you just have an idea or a question!",
    "contact.quick": "Quick contact:",
    "contact.email": "Email: ",
    "contact.discord": "Discord: ",
    "contact.fiverr": "Fiverr: ",
    "home.heroTitle": "DevByFab — Custom Discord bots & freelance dev",
    "home.heroDesc": "I create custom Discord bots, web tools, and solutions tailored to your needs. Reliable, fast, and attentive.",
    "home.cta1": "See services",
    "home.cta2": "Quick contact",
    "home.heroBtn1": "See services",
    "home.heroBtn2": "Quick contact",
    "about.title": "About me",
    "about.desc": "Passionate freelance developer, specialized in creating custom Discord bots and web solutions. Serious, versatile, and always attentive to your needs.",
    "about.skillsTitle1": "Languages",
    "about.skillsTitle2": "mastered",
    "about.skillsList": [
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "SQLite",
      "MySQL"
    ],
    "about.styleTitle1": "Work",
    "about.styleTitle2": "style",
    "about.styleList": [
      "Versatile",
      "Serious",
      "Chill",
      "Attentive"
    ],
    "about.goalsTitle1": "Future",
    "about.goalsTitle2": "goals",
    "about.goalsList": [
      "Advanced Twitch integrations",
      "Even more custom Discord bots",
      "Learning new technologies"
    ],
    "services.introTitle": "Freelance service, custom Discord bot creation.",
    "services.slogan": "Your projects are unique, our solutions are authentic.",
    "services.cards": [
      {
        title: "Starter",
        h2: "Basic moderation + embed messages",
        desc: "Simple moderation commands and custom embed messages.",
        btn: "Order"
      },
      {
        title: "Logs+",
        h2: "Moderation + logs (no database)",
        desc: "Add Discord event logs, advanced moderation, no database.",
        btn: "Order"
      },
      {
        title: "Full Pack",
        h2: "Full pack (database, paginations, DMs)",
        desc: "Complete management: database, paginations, private messages, logs, moderation.",
        btn: "Order"
      },
      {
        title: "Custom",
        h2: "Custom",
        desc: "Full customization: moderation, logs, database, paginations, embeds, DMs, Twitch API integration, streamer features…",
        btn: "Learn more"
      }
    ],
    "nav.about": "About",
    "nav.services": "Services",
    "nav.contact": "Custom",
    "footer.rights": "All rights reserved.",
    "footer.legal": "Legal Notice"
  },
  PT: {
    "contact.title": "Oferta sob medida — Bots Discord personalizados",
    "contact.desc1": "Você tem uma ideia específica ou uma necessidade única para seu servidor Discord? Eu crio bots sob medida, adaptados às suas necessidades e à sua comunidade.",
    "contact.ul1": [
      "Modération avançada, logs, gestão de usuários",
      "Comandos personalizados, interações, jogos, mini-jogos",
      "Integração com Twitch, YouTube, APIs externas",
      "Gestão de cargos, canais, permissões, reações",
      "Banco de dados, estatísticas, automações",
      "Funcionalidades para streamers, notificações, paginações, embeds…",
      "E muito mais: tudo é possível, basta pedir!"
    ],
    "contact.h2": "Como funciona?",
    "contact.ol1": [
      "<b>Entre em contato comigo</b> por <a href=\"https://mail.google.com/mail/?view=cm&to=devbyfab@gmail.com\" target=\"_blank\" rel=\"noopener\">email</a> ou no Discord: <span class=\"discord-tag\">devbyfab</span>",
      "<b>Conversamos juntos</b> sobre todas as funcionalidades, comandos e necessidades específicas para seu bot.",
      "<b>A oferta sob medida já inclui todas as funcionalidades do pacote completo</b> (moderação, logs, banco de dados, paginações, MPs, etc.).",
      "<b>Um preço fixo</b> é definido assim que todas as funcionalidades forem escolhidas, de acordo com a complexidade e o tempo estimado."
    ],
    "contact.final": "<b>Você só paga quando tudo estiver claro e validado.</b><br>Não hesite em me contatar para discutir seu projeto, mesmo que você só tenha uma ideia ou uma dúvida!",
    "contact.quick": "Contato rápido:",
    "contact.email": "Email: ",
    "contact.discord": "Discord: ",
    "contact.fiverr": "Fiverr: ",
    "home.heroTitle": "DevByFab — Custom Discord bots & freelance dev",
    "home.heroDesc": "Crio bots Discord personalizados, ferramentas web e soluções adaptadas às suas necessidades. Sério, rápido, atento.",
    "home.cta1": "Ver serviços",
    "home.cta2": "Contato rápido",
    "home.heroBtn1": "Ver serviços",
    "home.heroBtn2": "Contato rápido",
    "about.title": "Sobre mim",
    "about.desc": "Desenvolvedor freelancer apaixonado, especializado na criação de bots Discord e soluções web sob medida. Sério, versátil e sempre atento às suas necessidades.",
    "about.skillsTitle1": "Linguagens",
    "about.skillsTitle2": "dominadas",
    "about.skillsList": [
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "SQLite",
      "MySQL"
    ],
    "about.styleTitle1": "Estilo",
    "about.styleTitle2": "de trabalho",
    "about.styleList": [
      "Versátil",
      "Sério",
      "Tranquilo",
      "Atento"
    ],
    "about.goalsTitle1": "Objetivo",
    "about.goalsTitle2": "futuro",
    "about.goalsList": [
      "Integrações avançadas com Twitch",
      "Bots Discord ainda mais personalizados",
      "Aprender novas tecnologias"
    ],
    "services.introTitle": "Serviço freelancer, criação de bots Discord sob medida.",
    "services.slogan": "Seus projetos são únicos, nossas soluções são autênticas.",
    "services.cards": [
      {
        title: "Starter",
        h2: "Modération básica + mensagens embed",
        desc: "Comandos de moderação simples e mensagens personalizadas em embed.",
        btn: "Encomendar"
      },
      {
        title: "Logs+",
        h2: "Modération + logs (sem banco de dados)",
        desc: "Adição de logs de eventos do Discord, moderação avançada, sem banco de dados.",
        btn: "Encomendar"
      },
      {
        title: "Full Pack",
        h2: "Pacote completo (banco de dados, paginações, MPs)",
        desc: "Gestão completa: banco de dados, paginações, mensagens privadas, logs, moderação.",
        btn: "Encomendar"
      },
      {
        title: "Sob medida",
        h2: "Sob medida",
        desc: "Personalização total: moderação, logs, banco de dados, paginações, embeds, MPs, integração Twitch API, funcionalidades para streamers…",
        btn: "Saiba mais"
      }
    ],
    "nav.about": "Sobre",
    "nav.services": "Serviços",
    "nav.contact": "Sob medida",
    "footer.rights": "Todos os direitos reservados.",
    "footer.legal": "Aviso Legal"
  }
};

const legalTranslations = {
  FR: {
    title: "Mentions légales",
    content: `<p>
      <b>Éditeur du site :</b> DevByFab<br>
      <b>Contact :</b> devbyfab@gmail.com<br>
      <b>Plateforme d’hébergement :</b> <a href="https://pages.github.com" target="_blank">GitHub Pages</a>
    </p>
    <p>
      Ce site est un portfolio à titre informatif.<br>
      Aucune donnée personnelle n'est collectée.<br>
      Les services présentés sont proposés via des plateformes tierces (ex : Fiverr, Discord).
    </p>`
  },
  EN: {
    title: "Legal Notice",
    content: `<p>
      <b>Site publisher:</b> DevByFab<br>
      <b>Contact:</b> devbyfab@gmail.com<br>
      <b>Hosting platform:</b> <a href="https://pages.github.com" target="_blank">GitHub Pages</a>
    </p>
    <p>
      This site is a portfolio for informational purposes.<br>
      No personal data is collected.<br>
      The services presented are offered via third-party platforms (e.g.: Fiverr, Discord).
    </p>`
  },
  PT: {
    title: "Aviso Legal",
    content: `<p>
      <b>Editora do site:</b> DevByFab<br>
      <b>Contato:</b> devbyfab@gmail.com<br>
      <b>Plataforma de hospedagem:</b> <a href="https://pages.github.com" target="_blank">GitHub Pages</a>
    </p>
    <p>
      Este site é um portfólio para fins informativos.<br>
      Nenhum dado pessoal é coletado.<br>
      Os serviços apresentados são oferecidos por plataformas terceiras (ex: Fiverr, Discord).
    </p>`
  }
};

function translateLegal(lang) {
  if (!document.querySelector('.legal-section')) return;
  const t = legalTranslations[lang] || legalTranslations.FR;
  document.getElementById('legal-title').textContent = t.title;
  document.getElementById('legal-content').innerHTML = t.content;
  const legalLink = document.getElementById('legal-link');
  if (legalLink) {
    legalLink.textContent =
      lang === 'EN' ? 'Legal Notice' : lang === 'PT' ? 'Aviso Legal' : 'Mentions légales';
  }
}

// Fonction pour appliquer la traduction sur la page Contact
function translateContact(lang) {
  if (!document.querySelector('.contact-section')) return;
  const t = translations[lang];
  if (!t) return;

  document.querySelector('.contact-section h1').textContent = t["contact.title"];
  document.querySelector('.custom-bot-desc p').textContent = t["contact.desc1"];

  // Liste à puces
  const ul = document.querySelector('.custom-bot-desc ul');
  if (ul) {
    ul.innerHTML = "";
    t["contact.ul1"].forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });
  }

  // Sous-titre
  document.querySelector('.custom-bot-desc h2').textContent = t["contact.h2"];

  // Liste ordonnée
  const ol = document.querySelector('.custom-bot-desc ol');
  if (ol) {
    ol.innerHTML = "";
    t["contact.ol1"].forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = item;
      ol.appendChild(li);
    });
  }

  // Paragraphe final
  document.querySelector('.custom-bot-desc p:last-of-type').innerHTML = t["contact.final"];

  // Bloc contact rapide
  const quick = document.querySelector('.services-quick-contact');
  if (quick) {
    quick.querySelector('.quick-contact-label').textContent = t["contact.quick"];
    quick.querySelectorAll('span')[1].innerHTML = t["contact.email"] + `<a href="https://mail.google.com/mail/?view=cm&to=devbyfab@gmail.com" target="_blank" rel="noopener">devbyfab@gmail.com</a>`;
    quick.querySelectorAll('span')[3].innerHTML = t["contact.discord"] + `<span class="discord-tag">devbyfab</span>`;
    quick.querySelectorAll('span')[5].innerHTML = t["contact.fiverr"] + `<a href="https://fiverr.com/" target="_blank">Lien Fiverr</a>`;
  }
}

// Fonction pour appliquer la traduction sur tous les blocs .services-quick-contact
function translateContactQuick(lang) {
  // Met à jour tous les blocs .services-quick-contact de la page courante
  const t = translations[lang];
  if (!t) return;
  document.querySelectorAll('.services-quick-contact').forEach(quick => {
    // Nettoie le bloc pour éviter les doublons
    quick.innerHTML = `
      <span class="quick-contact-label">${t["contact.quick"]}</span>
      <span>${t["contact.email"]}<a href="https://mail.google.com/mail/?view=cm&to=devbyfab@gmail.com" target="_blank" rel="noopener">devbyfab@gmail.com</a></span>
      <span class="quick-sep">|</span>
      <span>${t["contact.discord"]}<span class="discord-tag">devbyfab</span></span>
      <span class="quick-sep">|</span>
      <span>${t["contact.fiverr"]}<a href="https://fiverr.com/" target="_blank">Lien Fiverr</a></span>
    `;
  });
}

// Fonction pour traduire la page Home
function translateHome(lang) {
  if (!document.querySelector('.hero-content')) return;
  const t = translations[lang];
  if (!t) return;

  // Titre principal
  // const h1 = document.querySelector('.hero-content h1');
  // if (h1) h1.textContent = t["home.heroTitle"];

  // Description
  const p = document.querySelector('.hero-content p');
  if (p) p.textContent = t["home.heroDesc"];

  // Boutons CTA
  const btns = document.querySelectorAll('.cta-group .btn');
  if (btns.length > 0) btns[0].textContent = t["home.heroBtn1"];
  if (btns.length > 1) btns[1].textContent = t["home.heroBtn2"];
}

// Fonction pour traduire la page About
function translateAbout(lang) {
  if (!document.body.classList.contains('about-page')) return;
  const t = translations[lang];
  if (!t) return;

  // Bloc avatar + titre + desc
  const h1 = document.querySelector('.about-block.about-left h1');
  if (h1) h1.textContent = t["about.title"];
  const desc = document.querySelector('.about-block.about-left p');
  if (desc) desc.textContent = t["about.desc"];

  // Bloc langages maîtrisés
  const skillsTitle = document.querySelectorAll('.about-block.about-right h2 span');
  if (skillsTitle.length >= 2) {
    skillsTitle[0].textContent = t["about.skillsTitle1"];
    skillsTitle[1].textContent = t["about.skillsTitle2"];
  }
  const skillsList = document.querySelector('.about-block.about-right .skills-list');
  if (skillsList) {
    const icons = ["python", "html", "css", "js", "sqlite", "mysql"];
    skillsList.innerHTML = "";
    t["about.skillsList"].forEach((skill, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="icon-skill ${icons[i]}"></span>${skill}`;
      skillsList.appendChild(li);
    });
  }

  // Bloc style de travail
  const styleBlocks = document.querySelectorAll('.about-block.about-left h2 span');
  if (styleBlocks.length >= 2) {
    styleBlocks[0].textContent = t["about.styleTitle1"];
    styleBlocks[1].textContent = t["about.styleTitle2"];
  }
  const styleList = document.querySelectorAll('.about-block.about-left ul');
  if (styleList.length > 1) {
    // Le 2e bloc about-left = style de travail
    styleList[1].innerHTML = "";
    t["about.styleList"].forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      styleList[1].appendChild(li);
    });
  }

  // Bloc objectifs futurs
  const goalsTitles = document.querySelectorAll('.about-block.about-right h2 span');
  if (goalsTitles.length >= 4) {
    goalsTitles[2].textContent = t["about.goalsTitle1"];
    goalsTitles[3].textContent = t["about.goalsTitle2"];
  }
  const goalsList = document.querySelectorAll('.about-block.about-right ul:not(.skills-list)');
  if (goalsList.length > 0) {
    goalsList[0].innerHTML = "";
    t["about.goalsList"].forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      goalsList[0].appendChild(li);
    });
  }
}

// Fonction pour traduire la page Services
function translateServices(lang) {
  if (!document.querySelector('.services-intro')) return;
  const t = translations[lang];
  if (!t) return;

  // Titre et slogan
  const h1 = document.querySelector('.services-intro h1');
  if (h1) h1.textContent = t["services.introTitle"];
  const slogan = document.querySelector('.services-intro .services-slogan');
  if (slogan) slogan.textContent = t["services.slogan"];

  // Cartes du carrousel
  const cards = document.querySelectorAll('.carousel-card');
  t["services.cards"].forEach((card, i) => {
    if (!cards[i]) return;
    const title = cards[i].querySelector('.service-title');
    const h2 = cards[i].querySelector('h2');
    const desc = cards[i].querySelector('p');
    const btn = cards[i].querySelector('.btn');
    if (title) title.textContent = card.title;
    if (h2) h2.textContent = card.h2;
    if (desc) desc.textContent = card.desc;
    if (btn) btn.textContent = card.btn;
    // Pour la dernière carte, le bouton doit pointer vers contact.html (EN/PT: "Learn more"/"Saiba mais"), sinon Fiverr
    if (i === 3 && btn) {
      btn.href = "contact.html";
      btn.className = "btn btn-secondary";
    } else if (btn) {
      btn.href = "https://fiverr.com/";
      btn.className = "btn btn-primary";
    }
  });
}

// Fonction pour traduire le menu et le footer
function translateNavFooter(lang) {
  const t = translations[lang];
  if (!t) return;

  // Menu principal (nav)
  document.querySelectorAll('nav ul').forEach(ul => {
    const items = ul.querySelectorAll('li');
    if (items.length >= 4) {
      // Home ne change pas
      items[1].querySelector('a').textContent = t["nav.about"];
      items[2].querySelector('a').textContent = t["nav.services"];
      items[3].querySelector('a').textContent = t["nav.contact"];
    }
  });

  // Footer
  document.querySelectorAll('.footer-copy').forEach(copy => {
    // Cherche le lien Mentions légales dans le même .footer-copy
    const legalLink = copy.querySelector('#legal-link');
    // Modifie le texte principal (avant le span)
    // On sépare le texte et le span pour garder la structure
    let baseText = `© DevByFab 2025. ${t["footer.rights"]}`;
    // Si le span existe, on le replace proprement à la suite
    if (legalLink) {
      // On retire tout sauf le lien
      copy.innerHTML = `${baseText}<span> · </span>`;
      copy.appendChild(legalLink);
      legalLink.textContent = t["footer.legal"];
    } else {
      copy.innerHTML = baseText;
    }
  });
}

// Menu burger responsive
window.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger-menu');
  const navUl = document.querySelector('nav ul');
  if (burger && navUl) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navUl.classList.toggle('open');
    });
  }
});

// Init traduction au chargement + animations
window.addEventListener('DOMContentLoaded', () => {
  // Applique la langue stockée si présente
  let selectedValue = 'FR';
  if (langSelect) {
    const storedLang = localStorage.getItem('selectedLang');
    if (storedLang) {
      langSelect.value = storedLang;
      selectedValue = storedLang;
    } else {
      selectedValue = langSelect.value;
    }
  }
  
  // Applique la langue complète au chargement (pas seulement nav/footer)
  applyLanguage(selectedValue);
  
  // Active les animations initiales
  setTimeout(() => {
    const footer = document.querySelector('footer');
    if (footer && footer.classList.contains('footer-visible')) {
      // Le footer est déjà visible, pas besoin de relancer
    } else {
      restartAnimations();
    }
  }, 100);
});


