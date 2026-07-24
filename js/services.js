/* ==========================================================================
   SERVICES — data-driven treatment grid + detail modal population
   ========================================================================== */

(() => {
  const SERVICES = [
    { id: 'skin', name: 'Skin Diseases', icon: 'fa-spa', badge: 'Dermatology', duration: '6-10 weeks', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&h=400&fit=crop',
      desc: 'Deep-acting constitutional remedies for chronic and acute skin conditions, treating the root cause rather than masking symptoms.',
      symptoms: ['Eczema &amp; dermatitis', 'Psoriasis', 'Acne &amp; scarring', 'Chronic urticaria (hives)'],
      approach: ['Detailed case history intake', 'Constitutional remedy selection', 'Diet &amp; lifestyle guidance', 'Monthly progress review'] },
    { id: 'hair', name: 'Hair Problems', icon: 'fa-wind', badge: 'Trichology', duration: '3-6 months', image: 'https://images.unsplash.com/photo-1512084747998-038941f49b84?q=80&w=600&h=400&fit=crop',
      desc: 'Natural remedies to restore scalp health, strengthen roots, and address hormonal or stress-related hair loss.',
      symptoms: ['Hair fall &amp; thinning', 'Premature greying', 'Dandruff', 'Alopecia areata'],
      approach: ['Scalp &amp; hormone assessment', 'Personalised remedy plan', 'Topical + oral protocol', 'Quarterly regrowth tracking'] },
    { id: 'diabetes', name: 'Diabetes Management', icon: 'fa-droplet', badge: 'Endocrine', duration: 'Ongoing care', image: 'https://images.unsplash.com/photo-1683727186226-910f31a9da45?q=80&w=600&h=400&fit=crop',
      desc: 'Supportive homeopathic management to help regulate blood sugar levels alongside your existing care plan.',
      symptoms: ['Type 2 diabetes support', 'Blood sugar fluctuations', 'Diabetic fatigue', 'Peripheral neuropathy'],
      approach: ['Baseline sugar &amp; symptom mapping', 'Constitutional treatment', 'Nutrition coordination', 'Monthly HbA1c review'] },
    { id: 'joint', name: 'Joint &amp; Bone Pain', icon: 'fa-bone', badge: 'Orthopedic', duration: '6-8 weeks', image: 'https://images.unsplash.com/photo-1778826393424-2e063bf5fd64?q=80&w=600&h=400&fit=crop',
      desc: 'Anti-inflammatory constitutional care for arthritis, stiffness, and chronic joint discomfort.',
      symptoms: ['Osteoarthritis', 'Rheumatoid arthritis', 'Gout', 'Frozen shoulder'],
      approach: ['Mobility &amp; pain assessment', 'Targeted remedy course', 'Gentle physiotherapy guidance', 'Bi-weekly check-ins'] },
    { id: 'migraine', name: 'Migraine &amp; Headache', icon: 'fa-brain', badge: 'Neurology', duration: '4-6 weeks', image: 'https://images.unsplash.com/photo-1774543793845-9dafc1c19f02?q=80&w=600&h=400&fit=crop',
      desc: 'Trigger-based treatment plans that reduce frequency and intensity of migraines without dependency.',
      symptoms: ['Chronic migraine', 'Tension headaches', 'Cluster headaches', 'Light/sound sensitivity'],
      approach: ['Trigger &amp; pattern diary', 'Constitutional remedy', 'Stress-reduction plan', 'Frequency tracking'] },
    { id: 'allergy', name: 'Allergy Relief', icon: 'fa-wind', badge: 'Immunology', duration: '4-8 weeks', image: 'https://images.unsplash.com/photo-1529386317747-0a2a51add902?q=80&w=600&h=400&fit=crop',
      desc: 'Immune-modulating remedies that reduce hypersensitivity reactions over time.',
      symptoms: ['Seasonal allergies', 'Food sensitivities', 'Allergic rhinitis', 'Skin allergies'],
      approach: ['Allergen history mapping', 'Desensitising remedy course', 'Diet elimination guidance', 'Seasonal follow-up'] },
    { id: 'women', name: "Women's Health", icon: 'fa-venus', badge: 'Gynecology', duration: '2-3 cycles', image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=600&h=400&fit=crop',
      desc: 'Gentle hormonal balancing for menstrual, menopausal, and reproductive wellness.',
      symptoms: ['Irregular periods', 'PCOS/PCOD', 'Menopausal symptoms', 'PMS'],
      approach: ['Hormonal &amp; cycle history', 'Constitutional treatment', 'Lifestyle coordination', 'Cycle-based review'] },
    { id: 'men', name: "Men's Health", icon: 'fa-mars', badge: 'Men\'s Wellness', duration: '6-10 weeks', image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=600&h=400&fit=crop',
      desc: 'Confidential, judgment-free care for male vitality, prostate, and reproductive health.',
      symptoms: ['Low energy &amp; vitality', 'Prostate concerns', 'Stress-related issues', 'Hormonal imbalance'],
      approach: ['Private consultation', 'Constitutional remedy', 'Lifestyle optimisation', 'Confidential follow-up'] },
    { id: 'children', name: 'Children Care', icon: 'fa-child', badge: 'Pediatric', duration: '3-4 weeks', image: 'https://images.unsplash.com/photo-1498674202614-ac0172c6c61a?q=80&w=600&h=400&fit=crop',
      desc: 'Safe, gentle remedies formulated specifically for infants and children.',
      symptoms: ['Recurring cold &amp; cough', 'Teething discomfort', 'Growth &amp; appetite issues', 'Behavioural concerns'],
      approach: ['Gentle pediatric intake', 'Low-dose remedy plan', 'Parent guidance session', 'Growth tracking'] },
    { id: 'stress', name: 'Stress &amp; Mental Wellness', icon: 'fa-heart-pulse', badge: 'Mind Care', duration: '4-6 weeks', image: 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=600&h=400&fit=crop',
      desc: 'Nervous-system calming remedies for chronic work and life stress, anxiety, and restlessness.',
      symptoms: ['Chronic stress', 'Anxiety &amp; overthinking', 'Irritability', 'Sleep disturbance'],
      approach: ['Stress trigger mapping', 'Calming remedy course', 'Breathing &amp; routine plan', 'Progress check-in'] }
  ];

  window.BD_SERVICES = SERVICES;

  // Use admin-managed content when available, else built-in defaults
  const getServices = () => (window.BD_CONTENT?.services?.length ? window.BD_CONTENT.services : SERVICES);

  const grid = document.getElementById('services-grid');
  const renderGrid = () => {
    if (!grid) return;
    grid.innerHTML = getServices().map((s, i) => `
      <button class="service-card reveal-scale" data-reveal-delay="${(i % 6) * 70}" data-service="${s.id}" type="button">
        ${s.image
          ? `<span class="service-img"><img src="${s.image}" alt="${s.name}" loading="lazy"><span class="service-img-icon"><i class="fa-solid ${s.icon}"></i></span></span>`
          : `<span class="icon-tile"><i class="fa-solid ${s.icon}"></i></span>`}
        <h3>${s.name}</h3>
        <span class="service-card-link">View Details <i class="fa-solid fa-arrow-right"></i></span>
      </button>
    `).join('');
    BD.revealCards(grid);
  };
  renderGrid();
  document.addEventListener('bd:content', renderGrid);

  const modal = document.getElementById('service-modal');
  if (!modal) return;

  const fill = (id, list) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = list.map(x => `<li><i class="fa-solid fa-check"></i> ${x}</li>`).join('');
  };

  const openServiceModal = (id) => {
    const s = getServices().find(x => x.id === id);
    if (!s) return;
    document.getElementById('service-modal-icon').innerHTML = `<i class="fa-solid ${s.icon}"></i>`;
    document.getElementById('service-modal-badge').textContent = s.badge;
    document.getElementById('service-modal-title').textContent = s.name.replace(/&amp;/g, '&');
    document.getElementById('service-modal-desc').textContent = s.desc;
    document.getElementById('service-modal-duration').textContent = s.duration;
    fill('service-modal-symptoms', s.symptoms);
    fill('service-modal-approach', s.approach);
    window.BD_openModal?.(modal);
  };

  grid?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-service]');
    if (card) openServiceModal(card.dataset.service);
  });
})();
