class FileConverter {
    constructor() {
        // Initialize class properties
        this.files = new Map();
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.supportedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'text/plain']);
        this.isProcessing = false;

        // DOM elements
        this.elements = {
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput'),
            fileList: document.getElementById('fileList'),
            preview: document.getElementById('preview'),
            generateBtn: document.getElementById('generateBtn'),
            result: document.getElementById('result')
        };

        // Bind methods
        this.handleDrop = this.handleDrop.bind(this);
        this.handleFileInput = this.handleFileInput.bind(this);
        this.generatePDF = this.generatePDF.bind(this);

        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Drag and drop events
        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.dropZone.classList.add('border-primary');
        });

        this.elements.dropZone.addEventListener('dragleave', () => {
            this.elements.dropZone.classList.remove('border-primary');
        });

        this.elements.dropZone.addEventListener('drop', this.handleDrop);

        // File input change event
        this.elements.fileInput.addEventListener('change', this.handleFileInput);

        // Generate PDF button click event
        this.elements.generateBtn.addEventListener('click', this.generatePDF);
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.elements.dropZone.classList.remove('border-primary');
        const droppedFiles = Array.from(e.dataTransfer.files);
        this.processFiles(droppedFiles);
    }

    handleFileInput(e) {
        const selectedFiles = Array.from(e.target.files);
        this.processFiles(selectedFiles);
    }

    async processFiles(newFiles) {
        const validFiles = [];
        const errors = [];

        for (const file of newFiles) {
            try {
                if (!this.supportedTypes.has(file.type)) {
                    errors.push(`${file.name}: Unsupported file type`);
                    continue;
                }

                if (file.size > this.maxFileSize) {
                    errors.push(`${file.name}: File size exceeds 5MB limit`);
                    continue;
                }

                validFiles.push(file);
                this.files.set(file.name, file);
            } catch (error) {
                console.error('Error processing file:', error);
                errors.push(`${file.name}: Failed to process file`);
            }
        }

        if (errors.length > 0) {
            this.showStatus(errors.join('\n'), 'error');
        }

        if (validFiles.length > 0) {
            this.updateFileList();
            this.updatePreview(validFiles);
            this.elements.generateBtn.disabled = false;
        }
    }

    async updatePreview(newFiles) {
        this.elements.preview.innerHTML = '';

        for (const file of newFiles) {
            try {
                if (file.type.startsWith('image/')) {
                    await this.previewImage(file);
                } else if (file.type === 'text/plain') {
                    await this.previewText(file);
                }
            } catch (error) {
                console.error('Error creating preview:', error);
                this.showStatus(`Failed to preview ${file.name}`, 'error');
            }
        }
    }

    async previewImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'max-w-full h-auto mb-4 rounded';
                this.elements.preview.appendChild(img);
                resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async previewText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const pre = document.createElement('pre');
                pre.textContent = e.target.result;
                pre.className = 'bg-gray-50 p-4 rounded mb-4 overflow-x-auto';
                this.elements.preview.appendChild(pre);
                resolve();
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    updateFileList() {
        this.elements.fileList.innerHTML = '';

        for (const [fileName, file] of this.files.entries()) {
            const fileItem = this.createFileListItem(fileName, file);
            this.elements.fileList.appendChild(fileItem);
        }
    }

    createFileListItem(fileName, file) {
        const div = document.createElement('div');
        div.className = 'file-item';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const name = document.createElement('h3');
        name.textContent = fileName;
        
        const size = document.createElement('p');
        size.textContent = this.formatFileSize(file.size);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        removeButton.onclick = () => this.removeFile(fileName);

        fileInfo.appendChild(name);
        fileInfo.appendChild(size);
        div.appendChild(fileInfo);
        div.appendChild(removeButton);

        return div;
    }

    removeFile(fileName) {
        this.files.delete(fileName);
        this.updateFileList();
        this.elements.generateBtn.disabled = this.files.size === 0;
        
        if (this.files.size === 0) {
            this.elements.preview.innerHTML = '';
        }
    }

    async generatePDF() {
        if (this.files.size === 0) {
            this.showStatus('Please add at least one file', 'error');
            return;
        }

        this.isProcessing = true;
        this.elements.generateBtn.disabled = true;
        this.showStatus('Generating PDF...', 'info');

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            let yOffset = 10;

            for (const [_, file] of this.files) {
                if (file.type.startsWith('image/')) {
                    const imgData = await this.getImageData(file);
                    const imgProps = await this.getImageProperties(imgData);
                    
                    if (yOffset + imgProps.height > pdf.internal.pageSize.height - 20) {
                        pdf.addPage();
                        yOffset = 10;
                    }

                    pdf.addImage(imgData, 'JPEG', 10, yOffset, imgProps.width, imgProps.height);
                    yOffset += imgProps.height + 10;
                } else if (file.type === 'text/plain') {
                    const text = await this.readFileAsText(file);
                    const lines = pdf.splitTextToSize(text, 180);

                    if (yOffset + (lines.length * 7) > pdf.internal.pageSize.height - 20) {
                        pdf.addPage();
                        yOffset = 10;
                    }

                    pdf.text(lines, 10, yOffset);
                    yOffset += lines.length * 7 + 10;
                }
            }

            pdf.save('converted-files.pdf');
            this.showStatus('PDF generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showStatus('Failed to generate PDF. Please try again.', 'error');
        } finally {
            this.isProcessing = false;
            this.elements.generateBtn.disabled = false;
        }
    }

    async getImageData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async getImageProperties(imgData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const maxWidth = 180;
                const ratio = img.height / img.width;
                resolve({
                    width: maxWidth,
                    height: maxWidth * ratio
                });
            };
            img.src = imgData;
        });
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    showStatus(message, type = 'info') {
        this.elements.result.textContent = message;
        this.elements.result.className = `status ${type}`;
        this.elements.result.style.display = 'block';

        if (type !== 'info') {
            setTimeout(() => {
                this.elements.result.style.display = 'none';
            }, 5000);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.fileConverter = new FileConverter();
});