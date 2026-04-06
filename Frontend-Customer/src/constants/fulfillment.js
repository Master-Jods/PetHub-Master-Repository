export const SHIPPING_OPTIONS = [
  { value: '', label: 'Select Lucena area', fee: 0, description: 'Delivery is available within Lucena City area only.' },
  { value: 'pleasantville', label: 'Pleasantville', fee: 0, description: 'Free delivery for Pleasantville.' },
  { value: 'iyam', label: 'Ibabang Iyam / Ilayang Iyam', fee: 50, description: 'Delivery fee for Ibabang Iyam and Ilayang Iyam.' },
  { value: 'town-proper', label: 'Brgy. 1-11 (Town Proper Area)', fee: 70, description: 'Delivery fee for Barangays 1 to 11 in the town proper area.' },
  { value: 'gulang-bocohan', label: 'Gulang-gulang / Bocohan', fee: 120, description: 'Delivery fee for Gulang-gulang and Bocohan.' },
  { value: 'outer-lucena', label: 'Domoit / Ibabang Dupay / Red-V / Marketview / Ilayang Dupay / Silangang Mayao / Mayao Parada / Cotta / Isabang', fee: 150, description: 'Delivery fee for the listed outer Lucena City areas.' }
];

export const DEFAULT_FULFILLMENT = {
  fulfillmentMethod: 'pickup',
  shippingOption: ''
};

export const getShippingFee = (fulfillmentMethod, shippingOption) => {
  if (fulfillmentMethod !== 'delivery') {
    return 0;
  }

  return SHIPPING_OPTIONS.find((option) => option.value === shippingOption)?.fee || 0;
};
