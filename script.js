document.getElementById('generateBtn').addEventListener('click', async function() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Please select one or more files to generate the PDF.');
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type;

        if (fileType.startsWith('image/')) {
            const img = await loadImage(file);
            const imgData = getBase64Image(img);
            pdf.addImage(imgData, 'JPEG', 10, 10, 180, 80);
            pdf.addPage();
        } else if (fileType === 'text/plain') {
            const text = await readFile(file);
            pdf.text(text, 10, 10);
            pdf.addPage();
        }
    }

    pdf.deletePage(pdf.internal.getNumberOfPages()); // Remove the last empty page
    pdf.save('generated.pdf');
});

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => resolve(img);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getBase64Image(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg');
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
