const ExcelJS = require('exceljs');

async function excelBufferToString(buffer) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    let content = '';
    workbook.eachSheet((sheet) => {
      sheet.eachRow((row) => {
        const rowValues = row.values.filter((val) => val !== null && val !== undefined);
        content += rowValues.join(' ') + '\n';
      });
    });

    return content.trim();
  } catch (error) {
    console.error('Error processing Excel buffer:', error);
    throw error;
  }
}

async function processExcelBuffer(buffer) {
  try {
    return await excelBufferToString(buffer);
  } catch (error) {
    console.error('Error processing Excel buffer:', error);
    throw error;
  }
}

module.exports = {
  processExcelBuffer
};
