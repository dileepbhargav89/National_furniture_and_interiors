export interface MaterialSpec {
  category: string;
  detail: string;
}

export interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  community: string;
  locality: string;
  city: 'Bengaluru';
  sector?: 'residential' | 'commercial';
  category: '3bhk-4bhk' | '2bhk' | 'villa' | 'kitchen' | 'penthouse' | 'office' | 'restaurant' | 'hotel' | 'retail';
  categoryLabel: string;
  areaSqFt: number;
  budgetInLakhs: number;
  budgetString: string;
  turnaroundDays: number;
  style: string;
  coverImage: string;
  galleryImages: string[];
  scope: string[];
  materials: MaterialSpec[];
  designerNotes: string;
  clientTestimonial?: {
    clientName: string;
    society: string;
    quote: string;
    rating: number;
  };
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'proj-prestige-lakeside',
    slug: 'prestige-lakeside-habitat-3bhk',
    title: 'The Warm Minimalist 3BHK',
    subtitle: 'Contemporary warmth with fluted oakwood and seamless concealed storage',
    community: 'Prestige Lakeside Habitat',
    locality: 'Whitefield',
    city: 'Bengaluru',
    sector: 'residential',
    category: '3bhk-4bhk',
    categoryLabel: '3 & 4 BHK',
    areaSqFt: 1850,
    budgetInLakhs: 14.5,
    budgetString: '₹14.5 Lakhs',
    turnaroundDays: 42,
    style: 'Warm Contemporary & Scandinavian',
    coverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Full Home Turnkey Interiors',
      'German Modular Kitchen with Quartz Island',
      'Master Walk-in Wardrobe with Sensor Lighting',
      'Acoustic TV Media Wall with Fluted Oak Panelling',
      'Integrated False Ceiling with Mood Dimming',
    ],
    materials: [
      { category: 'Carcass Substrate', detail: 'Century Ply 710 Club Prime BWP Marine Grade Plywood' },
      { category: 'Hardware & Fittings', detail: 'Blum Servo-Drive Soft-Close Lift Systems & Tandembox' },
      { category: 'Surface Finishes', detail: 'Anti-Fingerprint Super-Matte Acrylic & Natural White Oak' },
      { category: 'Countertops', detail: 'Silestone Antibacterial Engineered Quartz' },
    ],
    designerNotes:
      'Designed for a software architect couple in Whitefield, this home emphasizes natural morning light, acoustic dampening for hybrid work, and uncluttered spatial flow with concealed handleless storage throughout.',
    clientTestimonial: {
      clientName: 'Rahul & Sneha Nair',
      society: 'Prestige Lakeside Habitat, Tower 8',
      quote:
        'NFI delivered our 3BHK in exactly 42 days right before our housewarming ceremony. Their Bangalore in-house factory quality was visibly superior to modular assemblers we visited.',
      rating: 5,
    },
  },
  {
    id: 'proj-kingfisher-penthouse',
    slug: 'kingfisher-towers-heritage-penthouse',
    title: 'The Neo-Classical Heritage Penthouse',
    subtitle: 'Bespoke solid CP teakwood joinery, brass inlay details, and Italian Statuario marble',
    community: 'Kingfisher Towers',
    locality: 'Lavelle Road',
    city: 'Bengaluru',
    sector: 'residential',
    category: 'penthouse',
    categoryLabel: 'Penthouse & Luxury',
    areaSqFt: 4200,
    budgetInLakhs: 38.0,
    budgetString: '₹38.0 Lakhs',
    turnaroundDays: 60,
    style: 'Neo-Classical Luxury & Heritage',
    coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Architectural Millwork & Wall Wainscoting',
      'Handcrafted Central Pooja Room in Solid Teakwood',
      'Formal Grand Living Room with Brass Inlay Console',
      'Acoustic Home Cinema Room with Recliner Platform',
      'Master Penthouse Suite with Italian Statuario Cladding',
    ],
    materials: [
      { category: 'Solid Hardwood', detail: 'Kiln-Dried 100% Grade-A Seasoned Central Province (CP) Teakwood' },
      { category: 'Stone & Cladding', detail: 'Imported First-Choice Statuario Italian Marble with Bookmatch Veins' },
      { category: 'Metals & Accents', detail: 'Hand-Polished Antique Brass Profile Trims & Mother-of-Pearl Inlay' },
      { category: 'Finishes', detail: 'Milesi 5-Coat Italian High-Gloss PU Lacquer' },
    ],
    designerNotes:
      'A timeless celebration of Indian artisanal heritage and modern high-rise luxury. Every partition and console was custom fabricated at our Bangalore workshop with zero on-site dusty carpentry.',
    clientTestimonial: {
      clientName: 'Vikramaditya & Gayatri Rao',
      society: 'Kingfisher Towers, Lavelle Road',
      quote:
        'The level of teakwood precision and brass detailing NFI delivered is on par with bespoke European ateliers. Their Indiranagar studio team orchestrated everything effortlessly.',
      rating: 5,
    },
  },
  {
    id: 'proj-sobha-dream-acres',
    slug: 'sobha-dream-acres-japandi-2bhk',
    title: 'The Japandi Zen 2BHK',
    subtitle: 'Space-saving multifunction furniture, cane-webbed accents, and organic textures',
    community: 'Sobha Dream Acres',
    locality: 'Panathur / Outer Ring Road',
    city: 'Bengaluru',
    sector: 'residential',
    category: '2bhk',
    categoryLabel: '2 BHK',
    areaSqFt: 1220,
    budgetInLakhs: 8.9,
    budgetString: '₹8.9 Lakhs',
    turnaroundDays: 38,
    style: 'Japandi (Japanese-Scandinavian)',
    coverImage: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Compact 2BHK Turnkey Interior Architecture',
      'Breakfast Counter cum Workstation with Cane Bar Stools',
      'Concealed Storage Beds with Hydraulic German Lift',
      'Parallel Modular Kitchen with Pull-out Pantry',
      'Balcony Green Reading Nook with Teak Deck Tiles',
    ],
    materials: [
      { category: 'Base Material', detail: 'Greenpanel Club BWP Plywood with 0.8mm Backer' },
      { category: 'Surfaces', detail: 'Merino Matte Laminates with Hand-Woven Natural Rattan Cane' },
      { category: 'Hardware', detail: 'Hettich Sensys Soft-Close Hinges & InnoTech Drawers' },
      { category: 'Lighting', detail: 'Warm 3000K Recessed COB LEDs with CRI > 90' },
    ],
    designerNotes:
      'Crafted for modern tech professionals seeking mindful serenity. We transformed the 1,220 sq.ft layout with light oak wood tones, organic linen drapes, and dual-purpose ergonomics.',
    clientTestimonial: {
      clientName: 'Ananya & Koushik Sen',
      society: 'Sobha Dream Acres, Wing 14',
      quote:
        'Our compact 2BHK feels twice as large now! The cane storage credenza and foldaway study desk have gotten compliments from every single guest.',
      rating: 5,
    },
  },
  {
    id: 'proj-adarsh-palm-villa',
    slug: 'adarsh-palm-retreat-contemporary-villa',
    title: 'The Contemporary Architectural Villa',
    subtitle: 'Double-height living space, motorized Häfele glass partitions, and private deck interiors',
    community: 'Adarsh Palm Retreat',
    locality: 'Bellandur / Outer Ring Road',
    city: 'Bengaluru',
    sector: 'residential',
    category: 'villa',
    categoryLabel: 'Luxury Villa',
    areaSqFt: 3600,
    budgetInLakhs: 29.5,
    budgetString: '₹29.5 Lakhs',
    turnaroundDays: 52,
    style: 'Modern Architectural Luxury',
    coverImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Double-Height Feature Wall with Italian Travertine Slabs',
      'Open-Plan Show Kitchen & Wet Preparation Kitchen',
      'Master Walk-in Wardrobe with Bronze Fluted Glass Doors',
      'Wine Tasting Bar Lounge with Thermostatically Controlled Storage',
      'Covered Outdoor Garden Lounge with All-Weather Furniture',
    ],
    materials: [
      { category: 'Carcass', detail: 'Century Sainik 710 Boiling Waterproof Grade Plywood' },
      { category: 'Hardware', detail: 'Häfele Matrix Box Systems with Integrated LED Profiling' },
      { category: 'Veneers', detail: 'Decowood Smoked European Walnut Natural Wood Veneers' },
      { category: 'Glass & Partitions', detail: 'Saint-Gobain Bronze Reflective Toughened Glass in Slim Black Aluminum' },
    ],
    designerNotes:
      'Seamlessly bridged indoor and outdoor living for this Bellandur villa. The 20-foot double height wall anchors the entire ground level with backlit acoustic fluting.',
    clientTestimonial: {
      clientName: 'Pradeep & Shalini Reddy',
      society: 'Adarsh Palm Retreat, Phase 2',
      quote:
        'Managing a villa interior project from abroad seemed daunting, but NFI provided weekly 3D VR walkthrough updates and delivered flawless craftsmanship within our agreed timeline.',
      rating: 5,
    },
  },
  {
    id: 'proj-brigade-gateway',
    slug: 'brigade-gateway-industrial-chic-3bhk',
    title: 'The Industrial Chic Urban 3BHK',
    subtitle: 'Gunmetal accents, smoked walnut millwork, and warm ambient gallery illumination',
    community: 'Brigade Gateway',
    locality: 'Rajajinagar / Malleshwaram',
    city: 'Bengaluru',
    sector: 'residential',
    category: '3bhk-4bhk',
    categoryLabel: '3 & 4 BHK',
    areaSqFt: 2100,
    budgetInLakhs: 16.8,
    budgetString: '₹16.8 Lakhs',
    turnaroundDays: 45,
    style: 'Industrial Chic & Urban Luxury',
    coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Complete 3BHK Living, Dining & Foyer Renovation',
      'Black Powder-Coated Metal Partition with Fluted Glass',
      'Custom Bar Credenza with Integrated Stemware Rack',
      'Master Bedroom with Concrete Stucco Texture Accent Wall',
    ],
    materials: [
      { category: 'Wood Substrate', detail: 'Century Club Prime Marine Plywood' },
      { category: 'Metals', detail: 'Aviation-Grade Anodized Gunmetal Aluminum' },
      { category: 'Fabric & Soft Furnishings', detail: 'D’Decor Velvet & Top-Grain Leather Upholstery' },
      { category: 'Hardware', detail: 'Blum Soft-Close Concealed Tandem Runners' },
    ],
    designerNotes:
      'Created for an art collector and founder in North Bengaluru. We balanced industrial raw finishes (exposed brick texture and matte metal) with plush velvet comfort and custom warm lighting.',
    clientTestimonial: {
      clientName: 'Siddharth & Meera Varma',
      society: 'Brigade Gateway, Tower C',
      quote:
        'The industrial aesthetic without feeling cold or uninviting was achieved perfectly. The built-in bar unit is the highlight of every weekend get-together.',
      rating: 5,
    },
  },
  {
    id: 'proj-assetz-marq-kitchen',
    slug: 'assetz-marq-german-modular-kitchen',
    title: 'The Gourmet German Modular Kitchen & Dining',
    subtitle: 'Anti-scratch ceramic surfaces, servo-drive magic corner carousels, and island breakfast bar',
    community: 'Assetz Marq',
    locality: 'Whitefield-Hosakote Road',
    city: 'Bengaluru',
    sector: 'residential',
    category: 'kitchen',
    categoryLabel: 'Modular Kitchen',
    areaSqFt: 450,
    budgetInLakhs: 6.8,
    budgetString: '₹6.8 Lakhs',
    turnaroundDays: 28,
    style: 'German Minimalist Ergonomics',
    coverImage: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'L-Shaped German Modular Kitchen with 8ft Breakfast Island',
      'Tandem Pantry Tall Unit with 12 Pull-out Baskets',
      'Integrated Bosch Appliance Garages & Hidden Dustbin Drawers',
      'Heat-Resistant Porcelain Slab Splashback with Under-Cabinet LED',
    ],
    materials: [
      { category: 'Base Substrate', detail: 'Century 100% Calibrated BWP Marine Ply with Thermal Hot-Press' },
      { category: 'Shutters', detail: 'German REHAU Laser-Edged Senosan High-Gloss Acrylic' },
      { category: 'Fittings & Runners', detail: 'Blum Legrabox Pure & Aventos HF Bi-Fold Lift Systems' },
      { category: 'Sink & Faucet', detail: 'Franke Fragranite Onyx Sink with Pull-Out Spray Faucet' },
    ],
    designerNotes:
      'Engineered specifically for heavy Indian culinary workflows with high-suction chimney ducting, zero oil-stain absorption surfaces, and smooth one-touch electric drawer openings.',
    clientTestimonial: {
      clientName: 'Divya & Karthik Balasubramanian',
      society: 'Assetz Marq, Phase 1',
      quote:
        'Cooking in this kitchen is an absolute dream. The Blum servo-drive drawers and heat-proof porcelain splashback make maintenance completely effortless.',
      rating: 5,
    },
  },
  {
    id: 'proj-godrej-woodsman',
    slug: 'godrej-woodsman-master-suite',
    title: 'The Serene Master Suite & Walk-in Closet',
    subtitle: 'Fluted velvet wall cladding, bronze glass wardrobes with warm sensor illumination, and vanity console',
    community: 'Godrej Woodsman Estate',
    locality: 'Hebbal',
    city: 'Bengaluru',
    sector: 'residential',
    category: '3bhk-4bhk',
    categoryLabel: '3 & 4 BHK',
    areaSqFt: 650,
    budgetInLakhs: 5.5,
    budgetString: '₹5.5 Lakhs',
    turnaroundDays: 25,
    style: 'Soft Organic Luxury',
    coverImage: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef2?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Master Bedroom Full Architecture & Soft Furnishings',
      'Walk-in Wardrobe with Bronze Toughened Glass Sliders',
      'Custom King Bed with Hydraulic Storage & Velvet Headboard',
      'Dressing Island with Velvet Jewellery Organizers',
    ],
    materials: [
      { category: 'Wood Base', detail: 'Century Prime BWP Marine Grade Plywood' },
      { category: 'Wardrobe Profile', detail: 'Italian Sleek Anodized Bronze Profile with 4mm Toughened Glass' },
      { category: 'Headboard', detail: 'High-Density Foam with Stain-Resistant Italian Suede' },
      { category: 'Hardware', detail: 'Häfele Soft-Closing Top-Hung Wardrobe Sliders' },
    ],
    designerNotes:
      'Created as a five-star hotel retreat within the home. The lighting design uses indirect warm coves and wardrobe sensor bars to ensure zero glare during relaxation.',
    clientTestimonial: {
      clientName: 'Dr. Arjun & Radhika Murthy',
      society: 'Godrej Woodsman Estate, Hebbal',
      quote:
        'It feels like checking into a luxury suite every evening. The wardrobe organization and suede headboard were executed to perfection.',
      rating: 5,
    },
  },
  {
    id: 'proj-indiranagar-study',
    slug: 'indiranagar-executive-study',
    title: 'The Executive Mid-Century Library & Study',
    subtitle: 'Solid Sheesham live-edge executive desk, acoustic wood slat wall, and curated book shelving',
    community: 'Defense Colony',
    locality: 'Indiranagar',
    city: 'Bengaluru',
    sector: 'residential',
    category: 'penthouse',
    categoryLabel: 'Penthouse & Luxury',
    areaSqFt: 380,
    budgetInLakhs: 4.2,
    budgetString: '₹4.2 Lakhs',
    turnaroundDays: 21,
    style: 'Mid-Century Modern & Heritage Teak',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Soundproof Executive Home Office & Library',
      '8-Foot Solid Live-Edge Sheesham Executive Desk',
      'Floor-to-Ceiling Bookshelves with Brass Accent Ladders',
      'Reading Armchair in Hand-Tufted Camel Leather',
    ],
    materials: [
      { category: 'Solid Hardwood', detail: 'Artisanal Natural Live-Edge Sheesham & Plantation Teakwood' },
      { category: 'Acoustics', detail: 'PET Felt Acoustic Slat Wall Panelling with Black MDF Core' },
      { category: 'Hardware', detail: 'Heavy-Duty Brass Rail Systems & Concealed Soft Hinges' },
      { category: 'Finish', detail: 'Natural Matte Organic Oil Wax' },
    ],
    designerNotes:
      'Custom built for a venture partner in Indiranagar. The room features high acoustic isolation for international conference calls while showcasing a private library and rare wood craftsmanship.',
    clientTestimonial: {
      clientName: 'Sanjay Krishnaswamy',
      society: 'Defense Colony, 12th Main Indiranagar',
      quote:
        'The live-edge Sheesham desk and acoustic panelled library have made working from home a true pleasure. Delivered cleanly in three weeks.',
      rating: 5,
    },
  },
  {
    id: 'proj-indiranagar-bistro',
    slug: 'the-botanist-bistro-and-cocktail-lounge',
    title: 'The Botanist Bistro & Cocktail Lounge',
    subtitle: 'Fine dining architecture, curved fluted teakwood bar, velvet banquet booths, and acoustic timber baffles',
    community: '100 Feet Road',
    locality: 'Indiranagar',
    city: 'Bengaluru',
    sector: 'commercial',
    category: 'restaurant',
    categoryLabel: 'Restaurant & Café',
    areaSqFt: 3400,
    budgetInLakhs: 44.0,
    budgetString: '₹44.0 Lakhs',
    turnaroundDays: 45,
    style: 'Botanical Art Deco & Brass',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      '24-Foot Solid Teak & Brass Island Cocktail Bar',
      'Commercial Grade Velvet Banquet Booth Seating',
      'Acoustic Sound-Dampening Timber Ceiling Baffles',
      'Commercial Kitchen Stainless Steel Pass-Through & Service Stations',
      'Outdoor Terrace Garden Dining with All-Weather Pergola',
    ],
    materials: [
      { category: 'Bar Counter', detail: 'Backlit Emerald Quartzite with Antique Brushed Brass Gantry' },
      { category: 'Seating Upholstery', detail: 'Commercial High-Rub Velvet (Martindale > 80,000 Cycles)' },
      { category: 'Acoustics', detail: 'Perforated Micro-Grooved Timber Acoustic Panelling (NRC 0.85)' },
      { category: 'Lighting', detail: 'DALI Smart Dimmable Scene Control for Day & Evening Ambiance' },
    ],
    designerNotes:
      'Engineered for high footfall while creating intimate acoustic dining zones. The curved brass gantry acts as a visual magnet from the 100ft Road streetscape.',
    clientTestimonial: {
      clientName: 'Chef Anirudh & Shreya Mehta',
      society: 'The Botanist Hospitality Group, Indiranagar',
      quote:
        'NFI understood hospitality dynamics thoroughly. The acoustic panels keep ambient noise under 65dB even at full 140-cover capacity, and the teak bar is a work of art.',
      rating: 5,
    },
  },
  {
    id: 'proj-sadashivanagar-hotel',
    slug: 'the-heritage-manor-boutique-hotel-suites',
    title: 'The Heritage Manor Boutique Hotel & Club Suites',
    subtitle: 'Luxury guest suites, central lobby reception, solid CP teak four-poster beds, and luggage millwork',
    community: 'Palace Cross Road',
    locality: 'Sadashivanagar',
    city: 'Bengaluru',
    sector: 'commercial',
    category: 'hotel',
    categoryLabel: 'Hotel & Hospitality',
    areaSqFt: 6800,
    budgetInLakhs: 85.0,
    budgetString: '₹85.0 Lakhs',
    turnaroundDays: 55,
    style: 'Colonial Heritage Luxury',
    coverImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      '12 Bespoke Luxury Guest Suites & Ensuite Dressing Rooms',
      'Grand Double-Height Reception Lobby with Teak Wall Panelling',
      'Keyless RFID Commercial Smart Door Locks & Card Energy Savers',
      'Executive Club Lounge & Cigar Room Furniture',
      'Heavy-Duty Anti-Bacterial Hotel Mattresses & Headboards',
    ],
    materials: [
      { category: 'Suite Joinery', detail: 'Kiln-Dried 100% Grade-A Seasoned CP Teakwood with Brass Hardware' },
      { category: 'Flooring', detail: 'Heavy Commercial Grade Italian Botticino Marble with Border Inlays' },
      { category: 'Sound Insulation', detail: 'Acoustic Soundproof Suite Entry Doors (STC 42 Rating)' },
      { category: 'Lobby Counter', detail: 'Solid Block Carved Granite Reception Desk with Backlit Fluting' },
    ],
    designerNotes:
      'Restored the regal legacy of vintage Bengaluru with bespoke woodwork tailored to international five-star hospitality standards.',
    clientTestimonial: {
      clientName: 'Col. R. K. Somanna (Retd.)',
      society: 'The Manor Hospitality, Sadashivanagar',
      quote:
        'Our guests constantly photograph the lobby millwork and the four-poster teakwood beds. NFI completed all 12 suites on schedule with outstanding durability.',
      rating: 5,
    },
  },
  {
    id: 'proj-bellandur-tech-office',
    slug: 'the-zen-tech-innovation-hub',
    title: 'The Zen Tech Corporate Innovation Hub',
    subtitle: 'High-performance collaborative workspaces, ergonomic motorized desks, acoustic pods, and boardroom technology',
    community: 'Outer Ring Road / EcoWorld',
    locality: 'Bellandur / Outer Ring Road',
    city: 'Bengaluru',
    sector: 'commercial',
    category: 'office',
    categoryLabel: 'Office & Workspace',
    areaSqFt: 5200,
    budgetInLakhs: 52.0,
    budgetString: '₹52.0 Lakhs',
    turnaroundDays: 35,
    style: 'Minimalist High-Tech Ergonomics',
    coverImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      '65 Modular Ergonomic Workstations with Integrated Cable Trays',
      '20-Seater Executive Boardroom with Concealed Video Conference Tech',
      '4 Private Acoustic Phone Booths with Ventilation Sensors',
      'Townhall Cafeteria & Breakout Lounge with Bleacher Seating',
      'Custom Reception Brand Wall with Biophilic Green Moss Cladding',
    ],
    materials: [
      { category: 'Workstation Surfaces', detail: 'Anti-Glare High-Density Laminated Tops with Laser ABS Edge' },
      { category: 'Partitions', detail: 'Double-Glazed Acoustic Glass Partitions (STC 45 Rating)' },
      { category: 'Ceiling & HVAC', detail: 'Open-Plenum Industrial Ceiling with Sound Baffles & VRF Air Conditioning' },
      { category: 'Flooring', detail: 'Shaw Contract Commercial Nylon Carpet Tiles with Sound Cushion' },
    ],
    designerNotes:
      'Engineered for high-output software teams on Outer Ring Road. Balances energetic collaboration areas with pin-drop silent focus zones.',
    clientTestimonial: {
      clientName: 'Kiran George, VP Engineering',
      society: 'Apex Cloud Systems, EcoWorld ORR',
      quote:
        'Our team productivity and employee pride shot up immediately after moving into this space. NFI completed the entire 5,200 sq.ft fit-out in 35 days without a single defect.',
      rating: 5,
    },
  },
  {
    id: 'proj-ubcity-luxury-boutique',
    slug: 'the-haute-couture-diamond-and-silk-boutique',
    title: 'The Haute Couture Diamond & Silk Boutique',
    subtitle: 'Museum-grade anti-reflective glass display cases, VIP private salon, and custom onyx lighting counters',
    community: 'Vittal Mallya Road',
    locality: 'Lavelle Road',
    city: 'Bengaluru',
    sector: 'commercial',
    category: 'retail',
    categoryLabel: 'Shop & Retail Showroom',
    areaSqFt: 2200,
    budgetInLakhs: 28.5,
    budgetString: '₹28.5 Lakhs',
    turnaroundDays: 30,
    style: 'High-Luxury Minimalist Retail',
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1200&auto=format&fit=crop',
    ],
    scope: [
      'Custom Millwork Jewelry & Apparel Display Casework with LED Bars',
      'Private VIP Bridal Salon with Touch-to-Dim Smart Mirrors',
      'Illuminated Translucent White Onyx Cashier & Concierge Desk',
      'High-CRI (98+) Directional Track Spotlights for True Diamond Sparkle',
      'Reinforced Concealed Vault Room & Security Counter Interlocks',
    ],
    materials: [
      { category: 'Display Glass', detail: 'Extra-Clear Optiwhite Anti-Reflective Low-Iron Toughened Glass' },
      { category: 'Counters', detail: 'Solid Backlit White Onyx Stone with Chamfered Edges' },
      { category: 'Cabinetry', detail: 'Piano High-Gloss PU Lacquer on Marine Ply with Champagne Gold Trims' },
      { category: 'VIP Lounge', detail: 'Plush Custom Silk-Blend Carpet with Italian Velvet Armchairs' },
    ],
    designerNotes:
      'Maximizes high-ticket conversion by creating an ultra-luxurious, secure sanctuary where clients feel pampered while examining fine diamonds and couture.',
    clientTestimonial: {
      clientName: 'Pooja & Yashwardhan Jain',
      society: 'Aura Fine Jewels & Couture, Vittal Mallya Rd',
      quote:
        'Our store footfall conversion jumped by 35% in month one. The custom onyx counter and diamond display cases are praised by every client.',
      rating: 5,
    },
  },
];
