document.getElementById('generateBtn').addEventListener('click', async function() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const progress = document.getElementById('result');
    const previewDiv = document.getElementById('preview');

    if (files.length === 0) {
        alert('Please select one or more files to generate the PDF.');
        return;
    }

    progress.textContent = 'Generating PDF...';
    progress.style.color = 'black';
    progress.style.display = 'block';

    try {
        let sections = []; // For Table of Contents

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileType = file.type;

            if (file.size > 5 * 1024 * 1024) { // 5 MB size limit
                alert(`File ${file.name} is too large. Please select files under 5MB.`);
                continue;
            }

            if (fileType.startsWith('image/')) {
                const img = await loadImage(file);
                const imgData = getBase64Image(img);
                pdf.addImage(imgData, 'JPEG', 10, 10, 180, 80);
                pdf.addPage();
                previewDiv.innerHTML += `<img src="${img.src}" alt="${file.name}">`;
                sections.push(file.name); // Add to Table of Contents
            } else if (fileType === 'text/plain') {
                const text = await readFile(file);
                pdf.text(text, 10, 10);
                pdf.addPage();
                previewDiv.innerHTML += `<pre>${text}</pre>`;
                sections.push(file.name); // Add to Table of Contents
            } else {
                alert(`Unsupported file type: ${fileType}`);
                continue;
            }
        }

        // Add Table of Contents
        pdf.addPage();
        addTableOfContents(pdf, sections);

        // Add Header and Footer to each page
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            addHeaderFooter(pdf, i);
        }

        // PDF Metadata
        pdf.setProperties({
            title: 'Generated PDF',
            subject: 'Subject of the PDF',
            author: 'Your Name',
            creator: 'Your Application'
        });

        pdf.deletePage(pdf.internal.getNumberOfPages()); // Remove the last empty page
        pdf.save('generated.pdf');
        showResult('PDF generated successfully!', true);
    } catch (error) {
        showResult('An error occurred while generating the PDF.', false);
        console.error(error);
    } finally {
        progress.style.display = 'none'; // Hide progress indicator
    }
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

function addHeaderFooter(pdf, pageIndex) {
    const headerText = 'My PDF Header';
    const footerText = `Page ${pageIndex}`;
    pdf.setFontSize(12);
    pdf.text(headerText, 10, 10);
    pdf.text(footerText, 10, pdf.internal.pageSize.height - 10);
}

function addTableOfContents(pdf, sections) {
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Table of Contents', 10, 10);
    sections.forEach((section, index) => {
        pdf.text(`${index + 1}. ${section}`, 10, 20 + index * 10);
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
    fileInput.files = event.dataTransfer.files; // Set dropped files to file input
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
                const imgElement = document.createElement('img');
                imgElement.src = img.src;
                previewDiv.appendChild(imgElement);
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
