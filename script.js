document.getElementById('generateBtn').addEventListener('click', async function() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const progress = document.getElementById('result');
    const previewDiv = document.getElementById('preview');

    if (files.length === 0) {
        showResult('Please select one or more files to generate the PDF.', false);
        return;
    }

    progress.textContent = 'Generating PDF...';
    progress.style.color = 'black';
    progress.style.display = 'block';

    try {
        let yOffset = 10; // Initial Y position for content

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileType = file.type;

            if (file.size > 5 * 1024 * 1024) { // 5 MB size limit
                showResult(`File ${file.name} is too large. Please select files under 5MB.`, false);
                continue;
            }

            if (fileType.startsWith('image/')) {
                const img = await loadImage(file);
                const imgData = getBase64Image(img);
                const imgWidth = 180;
                const imgHeight = (img.height * imgWidth) / img.width;

                if (yOffset + imgHeight > pdf.internal.pageSize.height - 20) {
                    pdf.addPage();
                    yOffset = 10;
                }

                pdf.addImage(imgData, 'JPEG', 10, yOffset, imgWidth, imgHeight);
                yOffset += imgHeight + 10;
                previewDiv.appendChild(img);
            } else if (fileType === 'text/plain') {
                const text = await readFile(file);
                const lines = pdf.splitTextToSize(text, 180);

                if (yOffset + (lines.length * 7) > pdf.internal.pageSize.height - 20) {
                    pdf.addPage();
                    yOffset = 10;
                }

                pdf.text(lines, 10, yOffset);
                yOffset += lines.length * 7 + 10;
                const pre = document.createElement('pre');
                pre.textContent = text;
                previewDiv.appendChild(pre);
            } else {
                showResult(`Unsupported file type: ${fileType}`, false);
                continue;
            }
        }

        pdf.save('generated.pdf');
        showResult('PDF generated successfully!', true);
    } catch (error) {
        showResult('An error occurred while generating the PDF.', false);
        console.error(error);
    } finally {
        progress.style.display = 'none'; // Hide progress indicator
    }
});

document.getElementById('generatePowerPoint').addEventListener('click', generatePowerPoint);
document.getElementById('generateExcel').addEventListener('click', generateExcel);

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

function showResult(message, isSuccess) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.style.color = isSuccess ? 'green' : 'red';
    resultDiv.style.display = 'block';
}

// Drag and Drop Support
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.style.backgroundColor = '#eee';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = '';
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.style.backgroundColor = '';
    fileInput.files = event.dataTransfer.files;
    previewFiles(event.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
    previewFiles(fileInput.files);
});

function previewFiles(files) {
    const previewDiv = document.getElementById('preview');
    previewDiv.innerHTML = '';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type;

        if (fileType.startsWith('image/')) {
            loadImage(file).then(img => {
                previewDiv.appendChild(img);
            });
        } else if (fileType === 'text/plain') {
            readFile(file).then(text => {
                const textElement = document.createElement('pre');
                textElement.textContent = text;
                previewDiv.appendChild(textElement);
            });
        }
    }
}

function generatePowerPoint() {
    const files = fileInput.files;
    let content = `PowerPoint Presentation Content:\n`;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        content += `Slide ${i + 1}: ${file.name}\n`;
        content += `- Type: ${file.type}\n`;
        content += `- Size: ${file.size} bytes\n\n`;
    }

    downloadTextFile(content, 'presentation.txt');
}

function generateExcel() {
    const files = fileInput.files;
    let content = `File Name,File Type,File Size (bytes)\n`;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        content += `${file.name},${file.type},${file.size}\n`;
    }

    downloadTextFile(content, 'file_data.csv');
}

function downloadTextFile(content, fileName) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
