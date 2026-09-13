export interface ShoppableProductRef {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number; // in Rupees
  materials: string;
  image: string;
}

export interface BlogAuthor {
  name: string;
  role: string;
  studio: string;
  avatar: string;
}

export interface BlogChronicle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  coverImage: string;
  galleryImages: string[];
  category: 'Architectural Tours' | 'Bespoke Woodcraft' | 'Penthouse Living' | 'Materiality & Craft' | 'Interior Styling';
  categoryTags: string[];
  readTimeMinutes: number;
  publishedAt: string;
  isFeatured?: boolean;
  viewCount: number;
  author: BlogAuthor;
  shoppableProducts: ShoppableProductRef[];
  relatedProjectId?: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const BLOG_CHRONICLES: BlogChronicle[] = [
  {
    id: 'chronicle-sadashivanagar-penthouse',
    slug: 'harmonizing-reclaimed-burma-teak-in-sadashivanagar-penthouse',
    title: 'Harmonizing Reclaimed Burma Teak in Contemporary Sadashivanagar Penthouses',
    subtitle: 'How antique wood grains and unlacquered brass create grounding warmth across 4,200 sq.ft of glass and concrete.',
    excerpt: 'In the elevated canopy of Sadashivanagar, this duplex penthouse reconciles soaring glass curtain walls with 80-year-old aged Burma teak, custom-milled in our Bengaluru atelier.',
    coverImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop',
    ],
    category: 'Architectural Tours',
    categoryTags: ['Penthouses', 'Burma Teak', 'Sadashivanagar', 'Haute Living'],
    readTimeMinutes: 7,
    publishedAt: '2026-08-28T10:00:00.000Z',
    isFeatured: true,
    viewCount: 3420,
    author: {
      name: 'Ar. Kavita Rao',
      role: 'Principal Spatial Designer',
      studio: 'National Flagship Studio, Indiranagar',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    },
    shoppableProducts: [
      {
        id: '6aa05745ad65cf3101da30f6',
        slug: 'webster-48-pair-shoe-rack',
        name: 'Webster 48 Pair Shoe Rack in Sheesham Finish',
        category: 'Entryway & Storage',
        price: 84000,
        materials: 'Kiln-Dried Solid Sheesham & Soft-Close Brass Dampers',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
      },
      {
        id: 'prod-teak-dining-table',
        slug: 'burma-teak-dining-table',
        name: 'The Sovereign 8-Seater Reclaimed Teak Dining Table',
        category: 'Dining Atelier',
        price: 245000,
        materials: 'Aged Salvaged Burma Teak, Hand-Polished Beeswax',
        image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600&auto=format&fit=crop',
      },
      {
        id: 'prod-aura-armchair',
        slug: 'aura-bergere-armchair',
        name: 'Aura Bergère Armchair in Raw Sand Bouclé',
        category: 'Lounge & Seating',
        price: 68000,
        materials: 'Solid White Ash Frame & Belgian Heavy Bouclé',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop',
      },
    ],
    relatedProjectId: 'prestige-lakeside-habitat-3bhk',
    seo: {
      title: 'Harmonizing Reclaimed Burma Teak in Sadashivanagar Penthouses | NFI Journal',
      description: 'Discover how National Furniture & Interiors designed a 4,200 sq.ft duplex penthouse using reclaimed Burma teak, acoustic slatted millwork, and bespoke furnishings.',
      keywords: ['Burma Teak', 'Penthouse Interior Design Bangalore', 'Sadashivanagar luxury homes', 'bespoke furniture'],
    },
    content: `
      <p class="lead">When handling a residence blessed with panoramic views over Sankey Tank and Bengaluru's heritage green canopy, the greatest architectural challenge is not what to construct, but how to establish emotional warmth without interrupting the horizon.</p>
      
      <h2>The Architectural Canvas: 4,200 Sq.Ft of Volume</h2>
      <p>Modern luxury penthouses in Bengaluru increasingly feature expansive structural glazing. While this floods the residence with luminous daylight, it risks introducing an acoustic sterility. Concrete, porcelain slabs, and floor-to-ceiling glass bounce high-frequency sound, leaving vast living salons feeling like corporate galleries rather than sanctuaries.</p>
      
      <blockquote>"Wood possesses an innate acoustic memory. When you introduce genuine solid Burma teak into a high-ceilinged room, you are not simply adding furniture; you are tuning the emotional resonance of the space."</blockquote>

      <h2>Curating the Material Palette</h2>
      <p>For this project, our master artisans selected salvaged timber from 80-year-old colonial bungalows in the Nilgiris. Rather than masking the grain with heavy polyurethane coats, we employed traditional organic cold-pressed walnut oil and hand-buffed organic beeswax.</p>
      
      <ul>
        <li><strong>Focal Dining Table:</strong> A single continuous book-matched 8-seater slab resting on sculpturally tapered fluted teak pedestals.</li>
        <li><strong>Living Room Partition:</strong> Acoustically tuned vertical teak louvers that swivel smoothly on silent concealed needle bearings, demarcating the formal salon from the private family cinema.</li>
        <li><strong>Hardware Accent:</strong> Unlacquered brushed brass fixtures that will naturally develop a gentle, dignified patina alongside the teak over decades.</li>
      </ul>

      <h2>Spatial Flow & Entertaining</h2>
      <p>The client, an international venture partner and patron of classical Carnatic music, required an entertaining layout capable of hosting 35 guests without compromising intimate family evenings. We oriented the low-slung bouclé sectional toward the western balcony, allowing the twilight glow over the city to cascade over the textured upholstery.</p>

      <p>Every piece of furniture was dimensionally engineered inside our Indiranagar workshop to ensure zero visual obstruction of the sky terraces, cementing a fluid dialogue between indoor luxury and outdoor majesty.</p>
    `,
  },
  {
    id: 'chronicle-scandinavian-minimalism-whitefield',
    slug: 'the-architecture-of-light-scandinavian-warmth-in-whitefield',
    title: "The Architecture of Light: Scandinavian Warmth in Bengaluru's Tech Corridors",
    subtitle: 'Infusing airy ash wood, textured bouclé, and fluted acoustic paneling into a high-rise villa.',
    excerpt: 'Designed for a young founder couple in Whitefield, this turnkey interior balances minimalist restraint with tactile comfort, turning stark drywall into an oasis of calm.',
    coverImage: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1600&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200&auto=format&fit=crop',
    ],
    category: 'Interior Styling',
    categoryTags: ['Scandinavian', 'Minimalism', 'Whitefield', 'Acoustic Millwork'],
    readTimeMinutes: 5,
    publishedAt: '2026-08-20T14:30:00.000Z',
    viewCount: 2890,
    author: {
      name: 'Priya Sharma',
      role: 'Lead Interior Architect',
      studio: 'Atelier Design Studio, Whitefield',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop',
    },
    shoppableProducts: [
      {
        id: 'prod-ash-credenza',
        slug: 'nordic-fluted-ash-credenza',
        name: 'The Nordic Fluted Ash Wood Credenza',
        category: 'Living & Storage',
        price: 92000,
        materials: 'Natural White Ash & Brushed Champagne Brass',
        image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600&auto=format&fit=crop',
      },
      {
        id: 'prod-boucle-sofa',
        slug: 'haven-curved-boucle-sofa',
        name: 'Haven Curved Modular Sofa in Alabaster',
        category: 'Living & Lounge',
        price: 185000,
        materials: 'Feather-Down Blend & High-Performance Italian Bouclé',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
      },
    ],
    seo: {
      title: "Scandinavian Warmth in Bengaluru's Tech Corridors | NFI Journal",
      description: 'Explore how natural ash woodwork, curved bouclé sofas, and concealed lighting transform high-rise living into serene retreats.',
      keywords: ['Scandinavian interior Bangalore', 'Whitefield luxury apartment', 'curved sofa interior', 'fluted paneling'],
    },
    content: `
      <p class="lead">In an era where high-performance professionals spend their waking hours navigating digital complexity, home must function as an intentional decompression chamber.</p>
      
      <h2>Redefining "Warm Minimalism"</h2>
      <p>Too often, minimalism is mistaken for emptiness. Bare white walls and clinical acrylic finishes do not produce peace; they produce anxiety. For this duplex at Total Environment Learning to Fly in Whitefield, our approach was rooted in tactile materiality.</p>

      <p>Instead of cold gloss, we utilized European White Ash treated with an ultra-matte Danish soap finish that preserves the silky, raw texture of the grain. Walls are coated in lime-wash plaster that catches morning light with subtle organic modulation.</p>

      <blockquote>"Minimalism succeeds when the few elements present in the room possess an undeniable, handcrafted integrity."</blockquote>

      <h2>Ergonomics Meets Bespoke Cabinetry</h2>
      <p>All storage throughout the primary suite and study was executed flush-to-wall with concealed magnetic push-latches. By eradicating visual clutter and handles, the architecture breathes. Integrated warm-white (2700K) indirect LED channels cast an ambient perimeter glow that eliminates harsh overhead shadows at nightfall.</p>
    `,
  },
  {
    id: 'chronicle-solid-hardwood-vs-fast-furniture',
    slug: 'heirloom-millwork-why-solid-hardwoods-outlast-decades',
    title: 'Heirloom Millwork: Why Hand-Selected Solid Hardwoods Outlast Decades',
    subtitle: 'An insider look into timber curing, mortise-and-tenon joinery, and sustainable forest stewardship.',
    excerpt: 'Behind every National Furniture & Interiors piece lies 90 days of atmospheric kiln seasoning and centuries-old joinery techniques designed to outlive ephemeral decor trends.',
    coverImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4550?q=80&w=1200&auto=format&fit=crop',
    ],
    category: 'Bespoke Woodcraft',
    categoryTags: ['Joinery', 'Sheesham', 'Sustainable Forestry', 'Craftsmanship'],
    readTimeMinutes: 6,
    publishedAt: '2026-08-12T09:15:00.000Z',
    viewCount: 4120,
    author: {
      name: 'Vikram Patel',
      role: 'Master Craftsman & Joinery Director',
      studio: 'Woodworking Atelier, Bidadi Workshop',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    },
    shoppableProducts: [
      {
        id: 'prod-heirloom-bed',
        slug: 'imperial-teak-platform-bed',
        name: 'The Imperial Platform Bed with Floating Nightstands',
        category: 'Bedroom Atelier',
        price: 195000,
        materials: 'Solid Reclaimed Teak & Integrated Cord-Management Channels',
        image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?q=80&w=600&auto=format&fit=crop',
      },
    ],
    seo: {
      title: 'Heirloom Millwork: The Art of Solid Hardwood Joinery | NFI Journal',
      description: 'Learn why true heirloom furniture relies on mortise-and-tenon joints, moisture-controlled kiln curing, and artisanal grain alignment.',
      keywords: ['teak wood furniture quality', 'handcrafted furniture Bangalore', 'solid wood joinery', 'sustainable timber'],
    },
    content: `
      <p class="lead">Fast furniture is designed for the cardboard box; heirloom furniture is designed for generations. In our Bidadi craft workshop, we observe timber protocols honed across three generations of master joiners.</p>
      
      <h2>The Science of Moisture Equilibrium</h2>
      <p>Bengaluru experiences significant seasonal humidity shifts — from arid winter afternoons to monsoon deluges. If timber is worked before reaching moisture equilibrium, joints will eventually split or warp.</p>

      <p>Every plank of Sheesham, Walnut, and Teak entering our workshop undergoes 12 weeks of natural air-drying followed by precise low-heat dehumidification in our computer-monitored kiln ovens until internal moisture stabilizes at precisely 8% to 10%.</p>

      <blockquote>"Wood never truly sleeps; it breathes with the season. True master craftsmen do not force the timber; they construct joints that allow the grain to expand and contract naturally without ever losing structural tension."</blockquote>

      <h2>Mortise-and-Tenon: The Sovereign Joint</h2>
      <p>While mass-market manufacturers rely on cam locks, plastic dowels, and fast adhesives, every weight-bearing intersection in our catalog utilizes classical mortise-and-tenon or interlocking dovetail joints. Glued with marine-grade waterproof resin and secured with hand-carved rosewood pegs, these joints can withstand decades of vigorous daily use.</p>
    `,
  },
  {
    id: 'chronicle-biophilic-sanctuary-koramangala',
    slug: 'biophilic-sanctuary-integrating-living-flora-with-chettinad-woodcraft',
    title: 'Biophilic Sanctuary: Integrating Living Flora with Chettinad Woodcraft',
    subtitle: 'How an internal atrium, cascading ferns, and hand-carved pillars created an oasis in Koramangala.',
    excerpt: 'Step inside this 5,500 sq.ft private estate where courtyard water bodies, brass lotus vessels, and intricate teak carvings form a harmonious dialogue with tropical greenery.',
    coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop',
    ],
    category: 'Materiality & Craft',
    categoryTags: ['Biophilic Design', 'Chettinad Heritage', 'Koramangala', 'Courtyards'],
    readTimeMinutes: 8,
    publishedAt: '2026-07-30T16:00:00.000Z',
    viewCount: 3750,
    author: {
      name: 'Ar. Kavita Rao',
      role: 'Principal Spatial Designer',
      studio: 'National Flagship Studio, Indiranagar',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    },
    shoppableProducts: [
      {
        id: 'prod-teak-bench',
        slug: 'palakkad-fluted-entry-bench',
        name: 'The Palakkad Heritage Entryway Bench',
        category: 'Living & Entryway',
        price: 54000,
        materials: 'Reclaimed Teak & Hand-Woven Natural Rattan Cane',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
      },
    ],
    seo: {
      title: 'Biophilic Luxury & Chettinad Craft in Koramangala | NFI Journal',
      description: 'Explore the fusion of tropical indoor courtyards, natural slate, and traditional Chettinad woodwork in contemporary Bengaluru homes.',
      keywords: ['Biophilic luxury interior', 'Chettinad teak pillars', 'Koramangala villa design', 'indoor courtyard'],
    },
    content: `
      <p class="lead">To experience a traditional South Indian thotti mane (courtyard home) during monsoon season is to understand the healing relationship between natural architecture and seasonal cycles.</p>

      <h2>The Central Atrium Concept</h2>
      <p>For this newly constructed multi-generational residence in Koramangala 3rd Block, we placed an open-to-sky double-height glass atrium at the exact geometric center of the residence. Natural stone pavers, live Ficus trees, and a shallow reflecting basin provide the visual heartbeat for the surrounding formal living, dining, and library wings.</p>

      <h2>Harmonizing Heritage Columns with Contemporary Glass</h2>
      <p>We sourced four restored Chettinad teak columns featuring hand-chiseled yali and floral capitals. By anchoring them in sleek bronze bases against minimalist structural glass, the heritage artifacts are elevated as contemporary sculptures rather than rustic anachronisms.</p>
    `,
  },
  {
    id: 'chronicle-curating-the-executive-study',
    slug: 'curating-the-executive-study-ergonomics-and-fluted-wood',
    title: 'Curating the Executive Study: Ergonomics, Fluted Wood, and Brass Accents',
    subtitle: 'Designing spaces of intense intellectual focus and private contemplation for venture leaders.',
    excerpt: 'The modern home study is no longer a forgotten corner desk. Discover how acoustic wall cladding, tailored leather upholstery, and custom wire-management elevate intellectual performance.',
    coverImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
    ],
    category: 'Penthouse Living',
    categoryTags: ['Home Office', 'Executive Study', 'Acoustic Wood', 'Leather'],
    readTimeMinutes: 5,
    publishedAt: '2026-07-15T11:45:00.000Z',
    viewCount: 1980,
    author: {
      name: 'Arjun Mehta',
      role: 'Senior Project Consultant',
      studio: 'National Flagship Studio, Indiranagar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    },
    shoppableProducts: [
      {
        id: 'prod-executive-desk',
        slug: 'monarch-fluted-executive-desk',
        name: 'The Monarch Fluted Executive Desk',
        category: 'Study & Work',
        price: 165000,
        materials: 'Solid American Walnut, Full-Grain Cognac Leather Inlay, Concealed USB-C Hub',
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop',
      },
    ],
    seo: {
      title: 'Curating the Executive Study: Ergonomics & Fluted Wood | NFI Journal',
      description: 'Designing private executive libraries and home offices with acoustic fluted millwork, leather desktop inlays, and customized illumination.',
      keywords: ['luxury home office Bangalore', 'executive study furniture', 'fluted walnut desk', 'acoustic library interior'],
    },
    content: `
      <p class="lead">Intellectual clarity requires an environment engineered to eliminate friction. For executive leaders managing international portfolios from Bengaluru, the private study is the strategic nerve center of the estate.</p>

      <h2>Acoustic Cocooning</h2>
      <p>To eliminate audio bleed during late-night international board meetings, we lined the walls with staggered-depth American walnut acoustic ribs over recycled felt dampening layers. The result is a library with room acoustic neutrality comparable to a professional recording studio.</p>

      <h2>The Ergonomics of Dignity</h2>
      <p>Most commercial ergonomic chairs sacrifice aesthetic refinement for plastic mechanical dials. In our study commissions, we collaborate with Italian leather tanneries to hand-stitch semi-aniline full-grain upholstery over multi-density cold-cured foam, providing orthopedic lumbar support within an iconic mid-century silhouette.</p>
    `,
  },
];
