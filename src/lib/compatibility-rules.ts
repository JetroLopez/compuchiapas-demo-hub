// Compatibility rules for PC Builder

export interface ComponentSpec {
  id: string;
  product_id: string;
  component_type: 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'psu' | 'case' | 'storage' | 'cooling';
  // Common
  is_gamer?: boolean | null;
  // CPU
  socket?: string | null;
  cpu_tdp?: number | null;
  cpu_base_frequency?: number | null;
  // Motherboard
  ram_type?: string | null;
  form_factor?: string | null;
  ram_slots?: number | null;
  max_ram_speed?: number | null;
  m2_slots?: number | null;
  chipset?: string | null;
  // RAM
  ram_capacity?: number | null;
  ram_speed?: number | null;
  ram_modules?: number | null;
  // GPU
  gpu_tdp?: number | null;
  gpu_length?: number | null;
  gpu_hdmi_ports?: number | null;
  gpu_displayport_ports?: number | null;
  gpu_mini_displayport_ports?: number | null;
  gpu_vga_ports?: number | null;
  gpu_dvi_ports?: number | null;
  gpu_brand?: string | null;
  // PSU
  psu_wattage?: number | null;
  psu_efficiency?: string | null;
  psu_form_factor?: string | null;
  psu_color?: string | null;
  psu_modular?: boolean | null;
  psu_pcie_cable?: boolean | null;
  // Case
  case_max_gpu_length?: number | null;
  case_form_factors?: string[] | null;
  case_color?: string | null;
  case_fans_included?: boolean | null;
  case_fans_count?: number | null;
  case_psu_position?: string | null;
  // Storage
  storage_type?: string | null;
  storage_capacity?: number | null;
  storage_interface?: string | null;
  storage_subtype?: string | null;
  storage_m2_size?: string | null;
  storage_speed?: number | null;
  storage_has_heatsink?: boolean | null;
  // Cooling
  cooling_fans_count?: number | null;
  cooling_color?: string | null;
  cooling_type?: string | null;
}

export interface Product {
  id: string;
  name: string;
  clave?: string | null;
  category_id?: string | null;
  existencias?: number | null;
  image_url?: string | null;
  costo?: number | null;
}

export interface ProductWithSpec extends Product {
  spec?: ComponentSpec | null;
}

export interface PCBuild {
  cpu?: ProductWithSpec | null;
  motherboard?: ProductWithSpec | null;
  ram?: ProductWithSpec | null;
  gpu?: ProductWithSpec | null;
  psu?: ProductWithSpec | null;
  case?: ProductWithSpec | null;
  storage?: ProductWithSpec | null;
  cooling?: ProductWithSpec | null;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  errors: string[];
  warnings: string[];
}

// Category IDs that correspond to each component type
export const COMPONENT_CATEGORIES: Record<string, string[]> = {
  cpu: ['MICRO'],
  motherboard: ['MOTHE'],
  ram: ['MEDIM'],
  gpu: ['VIDEO'],
  psu: ['FUENT'],
  case: ['GABIN'],
  storage: ['DDURI'],
  cooling: ['ENFRI'], // Optional cooling component
};

export const COMPONENT_LABELS: Record<string, string> = {
  cpu: 'Procesador',
  motherboard: 'Motherboard',
  ram: 'Memoria RAM',
  gpu: 'Tarjeta de Video',
  psu: 'Fuente de Poder',
  case: 'Gabinete',
  storage: 'Almacenamiento',
  cooling: 'Enfriamiento',
};

export const COMPONENT_ICONS: Record<string, string> = {
  cpu: '⚡',
  motherboard: '🔲',
  ram: '💾',
  gpu: '🎮',
  psu: '🔌',
  case: '📦',
  storage: '💿',
  cooling: '❄️',
};

// Socket compatibility groups
export const SOCKET_FAMILIES: Record<string, string[]> = {
  'AMD AM5': ['AM5'],
  'AMD AM4': ['AM4'],
  'Intel LGA1700': ['LGA1700'],
  'Intel LGA1200': ['LGA1200'],
  'Intel LGA1151': ['LGA1151'],
};

// Form factor compatibility (what fits in what)
export const FORM_FACTOR_COMPATIBILITY: Record<string, string[]> = {
  'ATX': ['ATX', 'mATX', 'ITX'],
  'mATX': ['mATX', 'ITX'],
  'ITX': ['ITX'],
};

// Base power consumption (W) for system without discrete GPU
const BASE_POWER_CONSUMPTION = 100;

export function checkCompatibility(build: PCBuild): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { cpu, motherboard, ram, gpu, psu, case: pcCase } = build;

  // CPU <-> Motherboard socket compatibility
  if (cpu?.spec?.socket && motherboard?.spec?.socket) {
    if (cpu.spec.socket !== motherboard.spec.socket) {
      errors.push(`Socket incompatible: CPU ${cpu.spec.socket} ≠ Motherboard ${motherboard.spec.socket}`);
    }
  } else if (cpu && motherboard && (!cpu.spec?.socket || !motherboard.spec?.socket)) {
    warnings.push('No se puede verificar compatibilidad de socket (faltan especificaciones)');
  }

  // RAM <-> Motherboard type compatibility
  if (ram?.spec?.ram_type && motherboard?.spec?.ram_type) {
    if (ram.spec.ram_type !== motherboard.spec.ram_type) {
      errors.push(`RAM incompatible: ${ram.spec.ram_type} ≠ Motherboard soporta ${motherboard.spec.ram_type}`);
    }
  } else if (ram && motherboard && (!ram.spec?.ram_type || !motherboard.spec?.ram_type)) {
    warnings.push('No se puede verificar compatibilidad de RAM (faltan especificaciones)');
  }

  // RAM speed warning
  if (ram?.spec?.ram_speed && motherboard?.spec?.max_ram_speed) {
    if (ram.spec.ram_speed > motherboard.spec.max_ram_speed) {
      warnings.push(`RAM ${ram.spec.ram_speed}MHz funcionará a ${motherboard.spec.max_ram_speed}MHz (límite del motherboard)`);
    }
  }

  // RAM slots check
  if (ram?.spec?.ram_modules && motherboard?.spec?.ram_slots) {
    if (ram.spec.ram_modules > motherboard.spec.ram_slots) {
      errors.push(`El kit de RAM tiene ${ram.spec.ram_modules} módulos pero el motherboard solo tiene ${motherboard.spec.ram_slots} slots`);
    }
  }

  // Motherboard <-> Case form factor
  if (motherboard?.spec?.form_factor && pcCase?.spec?.case_form_factors) {
    const moboFormFactor = motherboard.spec.form_factor;
    const caseFormFactors = pcCase.spec.case_form_factors;
    
    if (!caseFormFactors.includes(moboFormFactor)) {
      errors.push(`Motherboard ${moboFormFactor} no cabe en gabinete (soporta: ${caseFormFactors.join(', ')})`);
    }
  } else if (motherboard && pcCase && (!motherboard.spec?.form_factor || !pcCase.spec?.case_form_factors)) {
    warnings.push('No se puede verificar compatibilidad de tamaño motherboard/gabinete');
  }

  // GPU <-> Case length
  if (gpu?.spec?.gpu_length && pcCase?.spec?.case_max_gpu_length) {
    if (gpu.spec.gpu_length > pcCase.spec.case_max_gpu_length) {
      errors.push(`GPU demasiado larga: ${gpu.spec.gpu_length}mm > máximo del gabinete ${pcCase.spec.case_max_gpu_length}mm`);
    }
  }

  // Power consumption check
  const cpuTdp = cpu?.spec?.cpu_tdp || 0;
  const gpuTdp = gpu?.spec?.gpu_tdp || 0;
  const totalPowerNeeded = BASE_POWER_CONSUMPTION + cpuTdp + gpuTdp;
  const recommendedWattage = Math.ceil(totalPowerNeeded * 1.2); // 20% headroom

  if (psu?.spec?.psu_wattage) {
    if (psu.spec.psu_wattage < totalPowerNeeded) {
      errors.push(`Fuente insuficiente: ${psu.spec.psu_wattage}W < ${totalPowerNeeded}W necesarios`);
    } else if (psu.spec.psu_wattage < recommendedWattage) {
      warnings.push(`Fuente ${psu.spec.psu_wattage}W funciona pero se recomienda ${recommendedWattage}W para mejor eficiencia`);
    }
  } else if (psu && (cpuTdp > 0 || gpuTdp > 0)) {
    warnings.push(`Consumo estimado: ${totalPowerNeeded}W - Verificar que la fuente sea suficiente`);
  }

  return {
    isCompatible: errors.length === 0,
    errors,
    warnings,
  };
}

export function filterCompatibleProducts(
  products: ProductWithSpec[],
  componentType: keyof PCBuild,
  currentBuild: PCBuild
): ProductWithSpec[] {
  const { cpu, motherboard, ram, gpu, psu, case: pcCase } = currentBuild;

  return products.filter(product => {
    const spec = product.spec;

    switch (componentType) {
      case 'motherboard':
        // Filter by CPU socket if CPU is selected
        if (cpu?.spec?.socket && spec?.socket) {
          return spec.socket === cpu.spec.socket;
        }
        return true;

      case 'cpu':
        // Filter by motherboard socket if motherboard is selected
        if (motherboard?.spec?.socket && spec?.socket) {
          return spec.socket === motherboard.spec.socket;
        }
        return true;

      case 'ram':
        // Filter by motherboard RAM type
        if (motherboard?.spec?.ram_type && spec?.ram_type) {
          return spec.ram_type === motherboard.spec.ram_type;
        }
        return true;

      case 'case':
        // Filter by motherboard form factor
        if (motherboard?.spec?.form_factor && spec?.case_form_factors) {
          return spec.case_form_factors.includes(motherboard.spec.form_factor);
        }
        return true;

      case 'gpu':
        // Filter by case max GPU length
        if (pcCase?.spec?.case_max_gpu_length && spec?.gpu_length) {
          return spec.gpu_length <= pcCase.spec.case_max_gpu_length;
        }
        return true;

      default:
        return true;
    }
  });
}

export function calculateTotalPower(build: PCBuild): { needed: number; recommended: number } {
  const cpuTdp = build.cpu?.spec?.cpu_tdp || 0;
  const gpuTdp = build.gpu?.spec?.gpu_tdp || 0;
  const needed = BASE_POWER_CONSUMPTION + cpuTdp + gpuTdp;
  const recommended = Math.ceil(needed * 1.2);
  
  return { needed, recommended };
}
