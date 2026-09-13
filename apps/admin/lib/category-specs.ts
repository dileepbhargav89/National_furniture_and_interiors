export interface SpecField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  options?: string[]; // for select/multiselect
  required?: boolean;
}

export interface CategorySpec {
  categoryId: string; // The specific subcategory or main category ID
  fields: SpecField[];
}

export const FURNITURE_SPECS: SpecField[] = [
  { name: 'primaryMaterial', label: 'Primary Material', type: 'select', options: ['Wood', 'Metal', 'Fabric', 'Leather', 'Glass', 'Engineered Wood'] },
  { name: 'style', label: 'Style', type: 'select', options: ['Modern', 'Contemporary', 'Minimalist', 'Traditional', 'Industrial', 'Scandinavian'] },
  { name: 'assemblyRequired', label: 'Assembly Required', type: 'boolean' },
];

export const CATEGORY_SPECS: Record<string, SpecField[]> = {
  // Sofas
  'sofas': [
    ...FURNITURE_SPECS,
    { name: 'seatingCapacity', label: 'Seating Capacity', type: 'number' },
    { name: 'upholsteryMaterial', label: 'Upholstery Material', type: 'select', options: ['Cotton', 'Linen', 'Velvet', 'Leather', 'Polyester'] },
    { name: 'frameMaterial', label: 'Frame Material', type: 'text' },
    { name: 'fillMaterial', label: 'Fill Material', type: 'text' },
  ],
  // Beds
  'beds': [
    ...FURNITURE_SPECS,
    { name: 'size', label: 'Bed Size', type: 'select', options: ['Single', 'Double', 'Queen', 'King', 'Super King'] },
    { name: 'includesStorage', label: 'Includes Storage', type: 'boolean' },
    { name: 'storageType', label: 'Storage Type', type: 'select', options: ['Hydraulic', 'Drawer', 'Box'] },
  ],
  // Tables
  'tables': [
    ...FURNITURE_SPECS,
    { name: 'shape', label: 'Shape', type: 'select', options: ['Rectangular', 'Square', 'Round', 'Oval'] },
    { name: 'topMaterial', label: 'Top Material', type: 'select', options: ['Glass', 'Wood', 'Marble', 'Metal'] },
    { name: 'baseMaterial', label: 'Base Material', type: 'select', options: ['Wood', 'Metal'] },
  ],
  // Chairs
  'chairs': [
    ...FURNITURE_SPECS,
    { name: 'isErgonomic', label: 'Ergonomic', type: 'boolean' },
    { name: 'hasArmrest', label: 'Has Armrest', type: 'boolean' },
    { name: 'swivel', label: 'Swivel Capability', type: 'boolean' },
  ]
};

export function getSpecsForCategory(categorySlug: string): SpecField[] {
  // Simple matching, ideally we'd map ID or full ancestor path
  const key = Object.keys(CATEGORY_SPECS).find(k => categorySlug.toLowerCase().includes(k));
  return (key && CATEGORY_SPECS[key]) || FURNITURE_SPECS;
}
