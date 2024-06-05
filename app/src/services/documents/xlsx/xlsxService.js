const ExcelJS = require('exceljs');

async function excelBufferToString(buffer) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    let content = '';
    workbook.eachSheet((sheet) => {
      sheet.eachRow((row) => {
        let rowValues = row.values.map((cell) => {
          if (cell && typeof cell === 'object' && cell.formula) {
            return cell.result || `Formula: ${cell.formula}`;
          } else if (cell && typeof cell === 'object' && cell.richText) {
            return cell.richText.map((part) => part.text).join('');
          } else {
            return cell;
          }
        }).filter(val => val !== null && val !== undefined);

        content += rowValues.join(' ') + '\n';
      });
    });

    return content.trim();
  } catch (error) {
    console.error('Error processing Excel buffer:', error);
    throw error;
  }
}

async function convertExcelBufferToText(buffer) {
  try {
    return await excelBufferToString(buffer);
  } catch (error) {
    console.error('Error processing Excel buffer:', error);
    throw error;
  }
}

module.exports = {
  convertExcelBufferToText
};
