import { EventItem, CategoryDefinition } from '../types';

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'all',
    label: 'All Gatherings',
    shortLabel: 'All',
    tagline: 'The complete seasonal directory of curated gatherings.',
    description: 'Explore the full spectrum of acoustic recitals, farm banquets, architectural forums, and studio ateliers.',
    iconName: 'Compass'
  },
  {
    id: 'Culinary & Wine',
    label: 'Culinary & Wine',
    shortLabel: 'Culinary',
    tagline: 'Gastronomy rooted in soil, ancient grains, and natural amphora vintages.',
    description: 'Communal sunset feasts, wood-fired hearth banquets, and biodynamic wine tastings in historic cellars and olive orchards.',
    iconName: 'UtensilsCrossed'
  },
  {
    id: 'Architecture & Design',
    label: 'Architecture & Design',
    shortLabel: 'Design',
    tagline: 'Quiet forums on materiality, timber joinery, and poetic spaces.',
    description: 'Symposiums and masterclasses led by Pritzker laureates and spatial researchers inside distinctive pavilions.',
    iconName: 'Building2'
  },
  {
    id: 'Fine Arts & Craft',
    label: 'Fine Arts & Craft',
    shortLabel: 'Art & Craft',
    tagline: 'Tactile ateliers exploring ceramics, natural pigments, and sculpture.',
    description: 'Immersive studio masterclasses guided by living heritage artisans, wabi-sabi potters, and paper makers.',
    iconName: 'Palette'
  },
  {
    id: 'Music & Performance',
    label: 'Music & Performance',
    shortLabel: 'Music',
    tagline: 'Unamplified acoustic recitals framed by ancient limestone resonance.',
    description: 'Chamber quartets, Renaissance vihuela sessions, and contemporary minimalism staged in vaulted spaces.',
    iconName: 'Music'
  },
  {
    id: 'Literature & Thought',
    label: 'Literature & Thought',
    shortLabel: 'Literature',
    tagline: 'Intimate literary dialogues and translation salons in historic conservatories.',
    description: 'Readings, essay discussions, and letterpress monographs hosted in glasshouse conservatories and private libraries.',
    iconName: 'BookOpen'
  },
  {
    id: 'Gatherings & Salons',
    label: 'Gatherings & Salons',
    shortLabel: 'Salons',
    tagline: 'Open-air sunset salons, kelim rug listening circles, and cultural retreats.',
    description: 'Nomadic gatherings designed for unhurried presence, conversation, and contemplative observation.',
    iconName: 'Sparkles'
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'symphony-in-the-quarry',
    title: 'Symphony in the Quarry: Nocturne & Strings',
    subtitle: 'An intimate candlelit chamber recital framed by natural limestone acoustics',
    category: 'Music & Performance',
    description: 'Experience an evocative twilight performance featuring the Solis String Quartet performing works by Arvo Pärt, Philip Glass, and Max Richter under open skies.',
    fullContent: 'Set within an ancient Mediterranean limestone amphitheater, Nocturne & Strings is curated for an audience of only 180 guests. As dusk descends across the quarry, raw candlelight illuminates the carved bedrock while acoustic resonance transports listeners into deep contemplation. Guests will be greeted with wild herb aperitifs prior to the opening movement.',
    date: 'Saturday, Oct 24, 2026',
    isoDate: '2026-10-24',
    time: '19:00 — 22:30',
    venue: {
      name: 'St. Claire Stone Quarry Pavilion',
      address: '42 Old Quarry Road',
      city: 'Avignon & Provence Basin',
      neighborhood: 'Gordes Foothills',
      mapNote: 'Arrival via shuttle from the Gordes Lower Gate; private parking reserved.',
      coordinates: { lat: 43.9113, lng: 5.2003 }
    },
    pricing: {
      currency: '$',
      startingPrice: 95,
      tiers: [
        {
          id: 'tier-ga',
          name: 'General Seating',
          price: 95,
          description: 'Acoustically optimized tiered limestone seating with wool wrap blankets.',
          available: 34,
          perks: ['Herbal aperitif upon arrival', 'Access to pavilion gardens', 'Curated print program']
        },
        {
          id: 'tier-patron',
          name: 'Patron Circle',
          price: 165,
          description: 'Front-three rows with cushioned seating and private salon access.',
          available: 12,
          perks: ['Front orchestra cushioned seating', 'Post-recital wine salon with the quartet', 'Dedicated shuttle valet', 'Signed vinyl edition']
        }
      ]
    },
    capacity: 180,
    attendeeCount: 134,
    imageUrl: '/src/assets/images/hero_symphony_hall_1790418903594.jpg',
    host: {
      name: 'Claire Dupont',
      role: 'Artistic Director, Sonus Atelier',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      bio: 'Claire has spent two decades staging site-specific acoustic gatherings across Europe, merging classical discipline with architectural phenomenology.'
    },
    agenda: [
      { time: '19:00', title: 'Arrival & Herbal Infusions', detail: 'Welcome reception amidst the olive groves with warm tisanes and local sparkling varietals.' },
      { time: '19:45', title: 'First Movement: The Quiet Mind', detail: 'Works for solo cello and violin responding to ambient twilight.' },
      { time: '21:00', title: 'Intermission in the Cloister', detail: 'Artisanal cheeses, roasted almonds, and natural cider served by firelight.' },
      { time: '21:30', title: 'Second Movement: Nocturne in Limestone', detail: 'Full quartet performance of Spiegel im Spiegel and Richter re-compositions.' }
    ],
    status: 'published',
    isFeatured: true,
    tags: ['Acoustic', 'Chamber Music', 'Architecture', 'Candlelit', 'Intimate'],
    curatorNote: 'Cell phone recording is strictly prohibited to maintain acoustic reverence.'
  },
  {
    id: 'harvest-terracotta-vineyard',
    title: 'Harvest & Terracotta: Autumn Vineyard Table',
    subtitle: 'A communal multi-course feast celebrating ancient grain baking and amphora wines',
    category: 'Culinary & Wine',
    description: 'Join Chef Matteo Rossi and ceramic artisan Elena Vance for a shared sunset banquet featuring heritage grains, roasted seasonal harvest, and natural clay-aged vintages.',
    fullContent: 'An ode to tactile hospitality and slow living. Long wooden banquets draped in raw unbleached linen stretch through the terracotta cellar courtyard. Every course is plated on bespoke ceramics fired specifically for this evening by Elena Vance, paired with rare amphora-fermented skin-contact wines from biodynamic estates.',
    date: 'Friday, Nov 06, 2026',
    isoDate: '2026-11-06',
    time: '17:30 — 21:45',
    venue: {
      name: 'Tenuta di Montevalle Cellars',
      address: 'Via delle Vigne 18',
      city: 'Chianti Valley, Tuscany',
      neighborhood: 'Greve Hills',
      mapNote: 'Follow private gravel driveway to the courtyard entrance.',
      coordinates: { lat: 43.5857, lng: 11.3168 }
    },
    pricing: {
      currency: '$',
      startingPrice: 140,
      tiers: [
        {
          id: 'tier-table',
          name: 'Banquet Seat',
          price: 140,
          description: 'Full 5-course seasonal menu with biodynamic wine pairings.',
          available: 18,
          perks: ['5-course chef menu', 'Sommelier wine pairings', 'Keepsake terracotta tasting cup']
        },
        {
          id: 'tier-cellar-vip',
          name: 'Cellar Master Experience',
          price: 210,
          description: 'Includes pre-dinner barrel tasting with the winemaker and signed ceramic set.',
          available: 6,
          perks: ['Private library vintage tasting', 'Chef kitchen tour', 'Two handcrafted ceramic plates to take home', 'Preferred banquet seating']
        }
      ]
    },
    capacity: 60,
    attendeeCount: 36,
    imageUrl: '/src/assets/images/event_culinary_pairing_1790418917631.jpg',
    host: {
      name: 'Matteo Rossi & Elena Vance',
      role: 'Gastronomist & Ceramicist Duo',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      bio: 'Combining culinary folklore with studio pottery, Matteo and Elena host nomadic dining experiences celebrating earthy terroir.'
    },
    agenda: [
      { time: '17:30', title: 'Courtyard Aperitivo & Clay Throwing Demo', detail: 'Live wheel demonstration with Elena accompanied by warm sourdough and herb butter.' },
      { time: '18:30', title: 'Seating & Opening Course', detail: 'Heirloom squash velouté with pumpkin seed emulsion and roasted chestnuts.' },
      { time: '19:45', title: 'The Main Table Hearth', detail: 'Slow-braised autumn vegetables, wild boar ragù, and polenta concia.' },
      { time: '21:00', title: 'Fireside Grappa & Pears', detail: 'Poached winter pears in spiced vin santo with bitter chocolate shavings.' }
    ],
    status: 'published',
    isFeatured: true,
    tags: ['Gastronomy', 'Natural Wine', 'Ceramics', 'Farm to Table', 'Sunset Feast'],
    curatorNote: 'Vegetarian and plant-forward adaptations prepared with equal reverence upon RSVP.'
  },
  {
    id: 'monolith-nordic-design',
    title: 'Monolith & Void: Nordic Architecture Symposium',
    subtitle: 'A quiet weekend forum on raw materiality, cedar construction, and light',
    category: 'Architecture & Design',
    description: 'Distinguished architects, sculptors, and material researchers gather for keynotes, physical scale models, and curated debates on post-industrial minimalism.',
    fullContent: 'Set inside a newly completed timber pavilion designed with zero steel fasteners, Monolith & Void explores how silence, shadow, and tactile authenticity can reshape contemporary public space. Attendees gain exclusive access to unseen monographs, material samples, and 1:1 scale structural prototypes.',
    date: 'Saturday, Nov 14, 2026',
    isoDate: '2026-11-14',
    time: '10:00 — 18:00',
    venue: {
      name: 'Nordic Timber Research Pavilion',
      address: 'Skeppsholmen Pier 7',
      city: 'Stockholm Harbor',
      neighborhood: 'Skeppsholmen Arts District',
      mapNote: 'Easily accessible via water ferry from Slussen or 10 min stroll across Skeppsholmsbron.',
      coordinates: { lat: 59.3248, lng: 18.0851 }
    },
    pricing: {
      currency: '$',
      startingPrice: 120,
      tiers: [
        {
          id: 'tier-standard',
          name: 'Symposium Pass',
          price: 120,
          description: 'Full-day access to all keynote lectures, panel debates, and catalog.',
          available: 45,
          perks: ['Access to all 4 keynote sessions', 'Printed exhibition monograph', 'Nordic lunch & fika break']
        },
        {
          id: 'tier-fellow',
          name: 'Practitioner & Archive Pass',
          price: 195,
          description: 'Includes evening architect roundtable dinner and structural blueprints archive.',
          available: 14,
          perks: ['All day access', 'Evening closed-door architectural dinner', 'Digital blueprint archive access', 'VIP lounge']
        }
      ]
    },
    capacity: 120,
    attendeeCount: 61,
    imageUrl: '/src/assets/images/event_contemporary_design_1790418929050.jpg',
    host: {
      name: 'Astrid Lindholm',
      role: 'Curator, Architectural Form Foundation',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      bio: 'Author of "The Weight of Shadow" and commissioner of the Scandinavian Pavilion Biennale.'
    },
    agenda: [
      { time: '10:00', title: 'Opening Discourse: The Honest Joint', detail: 'Keynote by Pritzker laureate on timber joinery and seismic grace.' },
      { time: '11:45', title: 'Material Dissection & Tactile Laboratory', detail: 'Hands-on examination of treated pine, rammed earth cores, and basalt fiber.' },
      { time: '13:00', title: 'Curated Fika & Networking', detail: 'Artisanal pour-over coffee, cardamom buns, and quiet book browsing.' },
      { time: '14:30', title: 'Panel: Cities of Quiet Solace', detail: 'Dialogue on designing spaces that calm sensory overload in modern metropolises.' }
    ],
    status: 'published',
    isFeatured: true,
    tags: ['Architecture', 'Design', 'Minimalism', 'Symposium', 'Sustainable Timber'],
    curatorNote: 'Eligible for 6 continuing education AIA and RIBA professional units.'
  },
  {
    id: 'acoustic-sunset-olive-grove',
    title: 'Acoustic Sunset in the Olive Grove',
    subtitle: 'Solo lute, Spanish classical guitar, and poetry under century-old olive canopies',
    category: 'Gatherings & Salons',
    description: 'An unamplified musical salon celebrating Spanish renaissance vihuela, flamenco roots, and Mediterranean verse as the sun dips beneath the horizon.',
    fullContent: 'Immerse your senses in pure acoustic purity. Without microphones, synthetic amplification, or screens, listeners gather on handwoven Berber kelim rugs amongst ancient olive trunks. Master lutenist Carlos De La Vega explores centuries of Iberian court traditions and poetic romance in golden sunset light.',
    date: 'Sunday, Nov 22, 2026',
    isoDate: '2026-11-22',
    time: '16:00 — 19:30',
    venue: {
      name: 'Mas de L’Espoir Estate',
      address: 'Chemin des Oliviers 14',
      city: 'Aix-en-Provence',
      neighborhood: 'Mont Sainte-Victoire Foothills',
      mapNote: 'Gate opens 45 minutes prior; walking shoes recommended for the grove path.',
      coordinates: { lat: 43.5297, lng: 5.4474 }
    },
    pricing: {
      currency: '$',
      startingPrice: 65,
      tiers: [
        {
          id: 'tier-rug',
          name: 'Lawn & Kelim Seating',
          price: 65,
          description: 'Open rug seating amidst the trees with lavender infusion.',
          available: 28,
          perks: ['Kelim rug spot with linen bolster', 'Lavender & honey sparkling water', 'Printed lyrics & translations']
        },
        {
          id: 'tier-bench',
          name: 'Terrace Bench & Wine',
          price: 110,
          description: 'Reserved cedar bench with estate olive oil tasting flight and local Grenache.',
          available: 10,
          perks: ['Reserved terrace seating', 'Estate olive oil & sourdough pairing', 'Bottle of estate vintage', 'Artist Q&A']
        }
      ]
    },
    capacity: 80,
    attendeeCount: 42,
    imageUrl: '/src/assets/images/event_acoustic_retreat_1790418942685.jpg',
    host: {
      name: 'Carlos De La Vega',
      role: 'Master of Early Iberian Instruments',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      bio: 'Carlos has performed for national conservatories in Madrid, Kyoto, and London, revitalizing 16th-century court melodies.'
    },
    agenda: [
      { time: '16:00', title: 'Estate Stroll & Cold-Pressed Olive Tasting', detail: 'Walk through the heirloom grove and taste this season’s virgin press.' },
      { time: '16:45', title: 'First Recital: Romanzas de Amor', detail: '16th-century vihuela solo pieces by Luis de Milán.' },
      { time: '18:00', title: 'Golden Hour Andalusian Suite', detail: 'Flamenco rhapsody accompanied by gentle wind in the olive canopy.' }
    ],
    status: 'published',
    isFeatured: true,
    tags: ['Acoustic', 'Guitar', 'Open Air', 'Golden Hour', 'Wine Tasting']
  },
  {
    id: 'vessel-clay-masterclass',
    title: 'Vessel & Clay: Japanese Ceramic Masterclass',
    subtitle: 'Wabi-sabi philosophy, wood firing traditions, and tactile form generation',
    category: 'Fine Arts & Craft',
    description: 'A 2-day intensive studio retreat guided by Kyoto master potter Kenji Takahashi exploring hand-pinching, kurinuki carving, and natural ash glazes.',
    fullContent: 'Discover the depth of imperfect beauty through the ancient traditions of kurinuki (carving from a solid clay block) and wood-fired anagama kilns. Participants sculpt two functional tea vessels and receive detailed individual mentoring in meditative form.',
    date: 'Saturday, Dec 05, 2026',
    isoDate: '2026-12-05',
    time: '09:30 — 16:30',
    venue: {
      name: 'Atelier Karesansui',
      address: '88 Studio Lane',
      city: 'Kyoto & Takayama Valley',
      neighborhood: 'Higashiyama Crafts Quarter',
      mapNote: 'Walking distance from Kiyomizu-Gojo Station.',
      coordinates: { lat: 34.9950, lng: 135.7725 }
    },
    pricing: {
      currency: '$',
      startingPrice: 180,
      tiers: [
        {
          id: 'tier-workshop',
          name: 'Full Studio Seat',
          price: 180,
          description: 'Complete hands-on materials, wheel access, firing, and international shipping of finished pieces.',
          available: 8,
          perks: ['Clay & studio tool kit provided', 'Wood firing in anagama kiln', 'Finished vessels shipped worldwide', 'Traditional matcha ceremony lunch']
        }
      ]
    },
    capacity: 16,
    attendeeCount: 8,
    imageUrl: '/src/assets/images/event_culinary_pairing_1790418917631.jpg',
    host: {
      name: 'Kenji Takahashi',
      role: 'Living Heritage Ceramicist',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      bio: 'Third generation artisan who crafts vessels for ceremonial tea schools in Uji and Tokyo.'
    },
    agenda: [
      { time: '09:30', title: 'Philosophy of Kurinuki & Clay Preparation', detail: 'Introduction to mountain clay compositions and breathing techniques.' },
      { time: '11:00', title: 'Carving the Form', detail: 'Subtractive sculptural carving guided by tactile intuition.' },
      { time: '13:00', title: 'Matcha & Chawan Appraisal', detail: 'Examination of historical Edo period tea bowls over bowl-whisked ceremonial matcha.' },
      { time: '14:30', title: 'Ash Glaze Chemistry & Kiln Loading', detail: 'Understanding wood smoke traces and flame patterns.' }
    ],
    status: 'published',
    isFeatured: false,
    tags: ['Ceramics', 'Masterclass', 'Wabi Sabi', 'Kyoto', 'Artisan']
  },
  {
    id: 'writers-solarium-dialogue',
    title: 'Writers’ Solarium: Dialogue on Solitude & Form',
    subtitle: 'An intimate salon on contemporary fiction, translation, and meditative essays',
    category: 'Literature & Thought',
    description: 'Booker-shortlisted authors and literary translators converse in an airy glasshouse salon on narrative rhythm, silence, and linguistic translation.',
    fullContent: 'Gather in a glass-walled greenhouse nestled in botanical gardens for quiet reading, candid reflections on the craft of sentences, and moderated audience dialogue. Includes book signings, rare first-edition viewings, and afternoon tea with warm scones.',
    date: 'Saturday, Dec 12, 2026',
    isoDate: '2026-12-12',
    time: '14:00 — 17:30',
    venue: {
      name: 'The Victorian Glasshouse Conservatory',
      address: 'Botanical Gardens Way',
      city: 'Oxford Botanical Grounds',
      neighborhood: 'Historic University Quarter',
      mapNote: 'Enter through the High Street gate; conservatory is opposite the rose garden.',
      coordinates: { lat: 51.7519, lng: -1.2483 }
    },
    pricing: {
      currency: '$',
      startingPrice: 50,
      tiers: [
        {
          id: 'tier-salon-pass',
          name: 'Salon Admission',
          price: 50,
          description: 'Glasshouse seating, afternoon botanical tea, and commemorative letterpress essay.',
          available: 22,
          perks: ['Botanical tea & pastry selection', 'Letterpress limited edition essay', 'Author book signing access']
        }
      ]
    },
    capacity: 70,
    attendeeCount: 48,
    imageUrl: '/src/assets/images/hero_symphony_hall_1790418903594.jpg',
    host: {
      name: 'Dr. Evelyn Ward',
      role: 'Literary Editor & Critic',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      bio: 'Evelyn has reviewed for The London Review and hosted literary roundtables for over 15 years.'
    },
    agenda: [
      { time: '14:00', title: 'Arrival & Conservatory Tea', detail: 'Bergamot and jasmine infusions served with fresh clotted cream scones.' },
      { time: '14:45', title: 'Keynote Reading & Analysis', detail: 'Reading from upcoming translated novella and discussion of unsaid spaces.' },
      { time: '16:00', title: 'Curated Open Dialogue', detail: 'Interactive conversational exchange between authors and attending guests.' }
    ],
    status: 'published',
    isFeatured: false,
    tags: ['Literature', 'Salon', 'Book Signing', 'Botanical', 'Dialogue']
  },
  {
    id: 'earthen-pigments-atelier',
    title: 'Earth, Ochre & Mineral: Natural Fresco Atelier',
    subtitle: 'Extracting wild soil pigments and Renaissance fresco plaster technique',
    category: 'Fine Arts & Craft',
    description: 'A tactile studio residency where participants grind Raw Siena, Cyprus umber, and chalk pigments into egg tempera and apply them to wet lime plaster.',
    fullContent: 'Rediscover painting as an elemental dialogue with geology. Guided by conservator Clara Morandi in a restored 15th-century studio, participants forage local ochres, grind pigments on porphyry slabs with glass mullers, and master true fresco (buon fresco) techniques on handheld terracotta tiles.',
    date: 'Saturday, Dec 19, 2026',
    isoDate: '2026-12-19',
    time: '10:00 — 16:30',
    venue: {
      name: 'Atelier Santa Maria Novella',
      address: 'Via delle Belle Arti 9',
      city: 'Florence, Italy',
      neighborhood: 'San Frediano Artisans Quarter',
      mapNote: 'Ring bell for Studio 4; courtyard entrance.',
      coordinates: { lat: 43.7696, lng: 11.2558 }
    },
    pricing: {
      currency: '$',
      startingPrice: 155,
      tiers: [
        {
          id: 'tier-fresco',
          name: 'Studio Apprentice Pass',
          price: 155,
          description: 'Includes porphyry grinding muller, hand-foraged mineral pigments, and fired terracotta tile to take home.',
          available: 10,
          perks: ['Set of 6 natural pigments in vials', 'Individual muller & palette access', 'Cured fresco artwork', 'Artisan lunch with Chianti']
        }
      ]
    },
    capacity: 20,
    attendeeCount: 14,
    imageUrl: '/src/assets/images/event_contemporary_design_1790418929050.jpg',
    host: {
      name: 'Clara Morandi',
      role: 'Master Fresco Conservator',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      bio: 'Restorer for Florentine municipal frescoes, devoted to safeguarding historic earth-binder traditions.'
    },
    agenda: [
      { time: '10:00', title: 'Geology of Colors & Soil Extraction', detail: 'Identification of iron oxides, clays, and chalk minerals.' },
      { time: '11:30', title: 'Mulling & Tempera Preparation', detail: 'Grinding raw rocks with pure distilled spring water and organic egg yolk.' },
      { time: '13:00', title: 'Studio Pranzo', detail: 'Rustic Tuscan bread, pecorino, and olive oil tasting.' },
      { time: '14:30', title: 'Intonaco Application & Painting', detail: 'Painting into fresh slaked lime plaster before carbonation occurs.' }
    ],
    status: 'published',
    isFeatured: false,
    tags: ['Art', 'Pigments', 'Fresco', 'Florence', 'Craftsmanship']
  },
  {
    id: 'solstice-amphora-hearth',
    title: 'Winter Solstice Hearth & Amphora Wine Table',
    subtitle: 'Slow wood-fired autumn gastronomy paired with subterranean clay amphorae',
    category: 'Culinary & Wine',
    description: 'An intimate candlelit dining experience inside an ancient subterranean wine cave, featuring fire-roasted foraged mushrooms, truffles, and rare orange skin-contact wines.',
    fullContent: 'As winter approaches, gather around a 20-meter reclaimed oak banquet lit entirely by beeswax tapers. Winemaker Lorenzo Donati and guest chef Miriam Vance unseal three terracotta amphorae buried beneath the cellar floor in 2021, serving each pour alongside dishes prepared over open holm-oak embers.',
    date: 'Saturday, Dec 21, 2026',
    isoDate: '2026-12-21',
    time: '18:30 — 22:30',
    venue: {
      name: 'Cantina Ipogea Donati',
      address: 'Strada di San Gimignano 33',
      city: 'San Gimignano, Tuscany',
      neighborhood: 'Elsa Valley',
      mapNote: 'Valet parking at cellar gates; warm outerwear recommended for the subterranean gallery.',
      coordinates: { lat: 43.4678, lng: 11.0433 }
    },
    pricing: {
      currency: '$',
      startingPrice: 175,
      tiers: [
        {
          id: 'tier-hearth-seat',
          name: 'Hearth Table Seat',
          price: 175,
          description: '6-course fire-cooked menu with private library amphora pairings.',
          available: 16,
          perks: ['6-course wood-fired dinner', 'Cellar amphora opening ceremony', 'Winemaker notes book', 'Hand-thrown tasting bowl']
        }
      ]
    },
    capacity: 35,
    attendeeCount: 22,
    imageUrl: '/src/assets/images/event_culinary_pairing_1790418917631.jpg',
    host: {
      name: 'Lorenzo Donati & Miriam Vance',
      role: 'Natural Winemaker & Hearth Chef',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      bio: 'Pioneers of unhurried biodynamic viticulture using clay amphorae buried in limestone cellars.'
    },
    agenda: [
      { time: '18:30', title: 'Cellar Torch Walk & Amphora Unsealing', detail: 'Descend into the underground gallery to break beeswax seals on the 2021 harvest.' },
      { time: '19:30', title: 'The Wood-Fired Hearth Dinner', detail: 'Wild boar ragout, ember-roasted cardoncelli mushrooms, and polenta.' },
      { time: '21:30', title: 'Fireside Vin Santo & Cantucci', detail: 'Aged dessert vintage served with almond biscuits by the open stone fireplace.' }
    ],
    status: 'published',
    isFeatured: true,
    tags: ['Culinary', 'Wine Tasting', 'Amphora', 'Tuscany', 'Solstice Feast']
  }
];

export const CATEGORIES = CATEGORY_DEFINITIONS.map((c) => ({
  label: c.label,
  value: c.id
}));
