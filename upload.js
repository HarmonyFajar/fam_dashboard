
document.addEventListener('DOMContentLoaded', function() {
  const databaseRef = firebase.database();

  // ========================
  // 1️⃣ UPLOAD RESI
  // ========================
  const uploadFormResi = document.getElementById('uploadFormResi');

  uploadFormResi.addEventListener('submit', function(e) {
    e.preventDefault();

    const file = document.getElementById('excelFile').files[0];
    const tanggal = document.getElementById('tanggal').value;
    const kloter = document.getElementById('kloter').value;

    if (!file || !tanggal || !kloter) {
      alert('Lengkapi semua field terlebih dahulu!');
      return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const resiData = {};

      jsonData.slice(1).forEach((row) => {
        const [resi, sku, qty, ekspedisi] = row;
        if (resi && sku && qty && ekspedisi) {
          if (!resiData[resi]) {
            resiData[resi] = {
              items: [],
              ekspedisi: ekspedisi,
              scanned: false
            };
          }
          resiData[resi].items.push({ sku, qty });
        }
      });

      Object.keys(resiData).forEach(resi => {
        databaseRef.ref(`resis/${tanggal}/${kloter}/${resi}`).set(resiData[resi]);
      });

      document.getElementById('resultResi').innerText = 'Upload Resi berhasil!';
      uploadFormResi.reset();
    };

    reader.readAsArrayBuffer(file);
  });

  // ========================
  // 2️⃣ UPLOAD GMV
  // ========================
  const uploadFormGMV = document.getElementById('uploadFormGMV');

  uploadFormGMV.addEventListener('submit', function(e) {
    e.preventDefault();

    const modalFile = document.getElementById('modalFile').files[0];
    const gmvFile = document.getElementById('gmvFile').files[0];
    const tanggal = document.getElementById('tanggalGMV').value;
    const platform = document.getElementById('platform').value;

    if (!modalFile || !gmvFile || !tanggal || !platform) {
      alert('Lengkapi semua data GMV!');
      return;
    }

    Promise.all([
      readExcelFile(modalFile),
      readExcelFile(gmvFile)
    ]).then(([modalData, gmvData]) => {
      const skuModalMap = {};
      modalData.slice(1).forEach(row => {
        const [sku, modal] = row;
        if (sku && modal) {
          skuModalMap[sku] = parseFloat(modal);
        }
      });

      let totalJual = 0;
      let totalModal = 0;
      let totalFee = 0;
      let totalQty = 0;
      let totalOrder = new Set();

      gmvData.slice(1).forEach(row => {
        const [resi, sku, qty, hargaJual] = row;
        const modal = skuModalMap[sku] || 0;
        const quantity = parseInt(qty);
        const jual = parseFloat(hargaJual);

        if (resi && sku && qty && hargaJual) {
          totalOrder.add(resi);
          totalQty += quantity;
          totalJual += jual * quantity;
          totalModal += modal * quantity;
          totalFee += (jual * 0.12) * quantity;
        }
      });

      const profit = totalJual - totalModal - totalFee;

      const gmvSummary = {
        platform: platform,
        total_order: totalOrder.size,
        total_qty: totalQty,
        total_jual: totalJual,
        total_modal: totalModal,
        total_fee: totalFee,
        profit_bersih: profit
      };

      databaseRef.ref(`gmv/${tanggal}`).set(gmvSummary);

      document.getElementById('resultGMV').innerText = 'Upload GMV berhasil!';
      uploadFormGMV.reset();
    });
  });

  function readExcelFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(json);
      };
      reader.readAsArrayBuffer(file);
    });
  }
});
    