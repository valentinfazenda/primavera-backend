function validateOrderData(data) {
    const requiredFields = ['symbol', 'side', 'order_type', 'quantity'];
    requiredFields.forEach((field) => {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });
  }
  
  module.exports = { validateOrderData };
  