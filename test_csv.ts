const csv = `plateNumber,status,storeName
XEM123L722,Available,ZAP POINT OD 03
XEM123L729,Available,ZAP POINT OD 02
"Quoted, value",Available,"ZAP POINT OD 02"`;

const parseCSV = (csv) => {
  if (!csv || !csv.trim()) return [];
  
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    // Regex to handle commas inside quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    console.log("values for line:", line, "->", values);
    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index]?.trim().replace(/^"|"$/g, '');
      
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      if (val !== '' && !isNaN(val) && !header.toLowerCase().includes('phone') && !header.toLowerCase().includes('aadhar')) {
        val = Number(val);
      }
      
      obj[header] = val;
    });
    return obj;
  }).filter(row => Object.keys(row).length > 0 && Object.values(row).some(v => v !== null && v !== ''));
};

console.log(parseCSV(csv));
