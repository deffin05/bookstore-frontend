
const API_BASE = 'http://localhost:8000'; // Change this to your Django server URL
let currentEditId = null;
let authorsData = [];
let publishersData = [];

// Load initial data
async function init() {
    await Promise.all([
        loadAuthors(),
        loadPublishers(),
        loadBooks()
    ]);
}

async function loadAuthors() {
    try {
        const response = await fetch(`${API_BASE}/authors/`);
        authorsData = await response.json();

        const authorSelect = document.getElementById('author');
        const filterAuthor = document.getElementById('filterAuthor');

        authorSelect.innerHTML = '<option value="">Select Author</option>';
        authorsData.forEach(author => {
            authorSelect.innerHTML += `<option value="${author.id}">${author.name}</option>`;
            filterAuthor.innerHTML += `<option value="${author.id}">${author.name}</option>`;
        });
    } catch (error) {
        showError('Failed to load authors');
    }
}

async function loadPublishers() {
    try {
        const response = await fetch(`${API_BASE}/publishers/`);
        publishersData = await response.json();

        const publisherSelect = document.getElementById('publisher');
        const filterPublisher = document.getElementById('filterPublisher');

        publisherSelect.innerHTML = '<option value="">Select Publisher</option>';
        publishersData.forEach(publisher => {
            publisherSelect.innerHTML += `<option value="${publisher.id}">${publisher.name}</option>`;
            filterPublisher.innerHTML += `<option value="${publisher.id}">${publisher.name}</option>`;
        });
    } catch (error) {
        showError('Failed to load publishers');
    }
}

async function loadBooks() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('booksContainer').style.display = 'none';

        const response = await fetch(`${API_BASE}/books/`);
        const books = await response.json();

        displayBooks(books);
    } catch (error) {
        showError('Failed to load books. Make sure your Django server is running.');
    }
}

async function searchBooks() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('booksContainer').style.display = 'none';

        const searchTerm = document.getElementById('searchBook').value;
        const authorId = document.getElementById('filterAuthor').value;
        const publisherId = document.getElementById('filterPublisher').value;

        let url = `${API_BASE}/books/?`;
        if (searchTerm) url += `book=${encodeURIComponent(searchTerm)}&`;
        if (authorId) url += `author=${authorId}&`;
        if (publisherId) url += `publisher=${publisherId}&`;

        const response = await fetch(url);
        const books = await response.json();

        displayBooks(books);
    } catch (error) {
        showError('Search failed');
    }
}

function displayBooks(books) {
    const container = document.getElementById('booksContainer');
    document.getElementById('loadingMessage').style.display = 'none';
    container.style.display = 'grid';

    if (books.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: white; font-size: 1.2em;">No books found</p>';
        return;
    }

    container.innerHTML = books.map(book => {
        const author = authorsData.find(a => a.id === book.author);
        const publisher = publishersData.find(p => p.id === book.publisher);

        return `
                    <div class="book-card">
                        <div class="book-title">${book.title}</div>
                        <div class="book-info">
                            <span>📝 ${author ? author.name : 'Unknown'}</span>
                            <span class="availability ${book.available ? 'available' : 'unavailable'}">
                                ${book.available ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                        <div class="book-info">
                            <span>🏢 ${publisher ? publisher.name : 'Unknown'}</span>
                        </div>
                        <div class="book-description">${book.description}</div>
                        <div class="book-price">$${book.price}</div>
                        <div class="book-info">
                            <span>📄 ${book.pages} pages</span>
                            <span>📅 ${book.year}</span>
                        </div>
                        <div class="book-actions">
                            <button onclick="editBook(${book.id})">Edit</button>
                            <button class="delete-btn" onclick="deleteBook(${book.id})">Delete</button>
                        </div>
                    </div>
                `;
    }).join('');
}

function openAddModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add New Book';
    document.getElementById('bookForm').reset();
    document.getElementById('bookModal').classList.add('active');
}

async function editBook(id) {
    try {
        const response = await fetch(`${API_BASE}/books/${id}`);
        const book = await response.json();

        currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Edit Book';
        document.getElementById('title').value = book.title;
        document.getElementById('description').value = book.description;
        document.getElementById('price').value = book.price;
        document.getElementById('author').value = book.author;
        document.getElementById('publisher').value = book.publisher;
        document.getElementById('pages').value = book.pages;
        document.getElementById('year').value = book.year;
        document.getElementById('available').checked = book.available;

        document.getElementById('bookModal').classList.add('active');
    } catch (error) {
        showError('Failed to load book details');
    }
}

async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
        const response = await fetch(`${API_BASE}/books/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadBooks();
        } else {
            showError('Failed to delete book');
        }
    } catch (error) {
        showError('Failed to delete book');
    }
}

function closeModal() {
    document.getElementById('bookModal').classList.remove('active');
    currentEditId = null;
}

document.getElementById('bookForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const bookData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        price: parseInt(document.getElementById('price').value),
        author: parseInt(document.getElementById('author').value),
        publisher: parseInt(document.getElementById('publisher').value),
        pages: parseInt(document.getElementById('pages').value),
        year: parseInt(document.getElementById('year').value),
        available: document.getElementById('available').checked
    };

    try {
        let response;
        if (currentEditId) {
            response = await fetch(`${API_BASE}/books/${currentEditId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookData)
            });
        } else {
            response = await fetch(`${API_BASE}/books/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookData)
            });
        }

        if (response.ok) {
            closeModal();
            loadBooks();
        } else {
            const error = await response.json();
            showError('Failed to save book: ' + JSON.stringify(error));
        }
    } catch (error) {
        showError('Failed to save book. Check your connection.');
    }
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('loadingMessage').style.display = 'none';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Close modal when clicking outside
document.getElementById('bookModal').addEventListener('click', (e) => {
    if (e.target.id === 'bookModal') {
        closeModal();
    }
});

// Initialize the app
init();