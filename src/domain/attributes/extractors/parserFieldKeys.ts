/** Parser output attribute keys (snake_case). Resolver maps these to canonical meanings. */

export const PARSER_KEYS = {
  // Hydraulic
  coil_rating: 'coil_rating',
  function_code: 'function_code',
  spool_symbol: 'spool_symbol',
  connector_type: 'connector_type',
  electrical_option: 'electrical_option',
  spring_arrangement: 'spring_arrangement',
  tank_pressure_rating: 'tank_pressure_rating',
  design_series: 'design_series',
  design_number: 'design_number',
  pilot_drain_type: 'pilot_drain_type',
  mounting_standard: 'mounting_standard',
  manual_override: 'manual_override',
  switching_position_variant: 'switching_position_variant',
  // Pneumatic
  cushioning_type: 'cushioning_type',
  variant_code: 'variant_code',
  bore: 'bore',
  stroke: 'stroke',
  standard_family: 'standard_family',
} as const;
