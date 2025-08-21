// Common script for AlphaDrive Marketplace

// Helper to retrieve data from localStorage
function getData(key, defaultValue) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

// Helper to save data to localStorage
function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Default categories for marketplace (tailored for driving instructors)
// Added adminOnly flag: categories marked adminOnly will not appear in public sell form
const defaultCategories = [
  { id: crypto.randomUUID(), name: 'רכב לימוד', description: 'מכירת רכבי לימוד עם דוושות ואמצעי בטיחות', adminOnly: false, excludeFromMain: false },
  { id: crypto.randomUUID(), name: 'אביזרים', description: 'שלטי נהג חדש, שילוט, מראות וכובעים למורים', adminOnly: false, excludeFromMain: false },
  { id: crypto.randomUUID(), name: 'ביטוחים', description: 'פוליסות ביטוח לרכב לימוד ולמורים', adminOnly: true, excludeFromMain: true },
  { id: crypto.randomUUID(), name: 'מצלמות דרך', description: 'מצלמות לרכב לימוד ואמצעי תיעוד', adminOnly: false, excludeFromMain: false },
  { id: crypto.randomUUID(), name: 'מבצעים', description: 'מבצעים מיוחדים והצעות קבוצתיות למורי נהיגה', adminOnly: true, excludeFromMain: true },
  { id: crypto.randomUUID(), name: 'ציוד ואיבזור', description: 'ציוד ואיבזור מקצועי למורי נהיגה ותלמידים', adminOnly: false, excludeFromMain: true }
];

// Default listings (initially empty)
const defaultListings = [];

// Default users array
const defaultUsers = [];

// Initialise data if not present
function initData() {
  if (!localStorage.getItem('categories')) {
    setData('categories', defaultCategories);
  }
  if (!localStorage.getItem('listings')) {
    setData('listings', defaultListings);
  }
  if (!localStorage.getItem('users')) {
    setData('users', defaultUsers);
  }
}

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }
});

// Populate categories dropdowns and lists
function populateCategories(selectElementId, includeAdmin = false) {
  const categories = getData('categories', defaultCategories);
  const select = document.getElementById(selectElementId);
  if (select) {
    // Clear existing options
    select.innerHTML = '';
    // Add placeholder
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'בחר קטגוריה';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    // Add options; skip adminOnly categories when includeAdmin is false
    categories.forEach(cat => {
      if (!includeAdmin && cat.adminOnly) return;
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  }
}

// Render listings to container
function renderListings(containerId, filterCategoryId = null, searchTerm = '', allowExcluded = true) {
  const listings = getData('listings', []);
  const categories = getData('categories', defaultCategories);
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  let filtered = listings;
  // Filter by category
  if (filterCategoryId) {
    filtered = filtered.filter(item => item.categoryId === filterCategoryId);
  }
  // Search by term in title or details
  if (searchTerm && searchTerm.trim() !== '') {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(item => {
      return (
        item.title.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    });
  }

  // Exclude categories marked as excludeFromMain when allowExcluded is false
  if (!allowExcluded) {
    filtered = filtered.filter(item => {
      const catObj = categories.find(c => c.id === item.categoryId);
      return catObj && !catObj.excludeFromMain;
    });
  }
  // If no listings show message
  if (filtered.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'לא נמצאו מודעות מתאימות.';
    msg.style.textAlign = 'center';
    container.appendChild(msg);
    return;
  }
  filtered.forEach(item => {
    const cat = categories.find(c => c.id === item.categoryId);
    // Create card
    const card = document.createElement('div');
    card.className = 'listing-card';
    // Image: show first image from gallery if available
    const img = document.createElement('img');
    if (item.images && item.images.length > 0) {
      img.src = item.images[0];
    } else if (item.image) {
      img.src = item.image;
    } else {
      img.src = 'car1.png';
    }
    img.alt = item.title;
    card.appendChild(img);
    // Content
    const content = document.createElement('div');
    content.className = 'card-content';
    // Title
    const title = document.createElement('h4');
    title.textContent = item.title;
    content.appendChild(title);
      // Rating (generate simple star rating if not provided)
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'rating';
      // Use provided rating or generate a random rating between 4 and 5
      const ratingValue = item.rating || (4 + Math.random());
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += i <= Math.round(ratingValue) ? '★' : '☆';
      }
      ratingDiv.textContent = stars;
      content.appendChild(ratingDiv);
    // Price
    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = `${item.price} ₪`;
    content.appendChild(price);
    // Details
    const details = document.createElement('div');
    details.className = 'details';
    // Compose details: category name, year, mileage, etc.
    let detailText = cat ? cat.name : '';
    if (item.year) detailText += ` • ${item.year}`;
    if (item.mileage) detailText += ` • ${item.mileage.toLocaleString()} ק"מ`;
    if (item.transmission) detailText += ` • ${item.transmission}`;
    details.textContent = detailText;
    content.appendChild(details);
    // Contact button (primary) and Details button (secondary)
    const contactBtn = document.createElement('button');
    contactBtn.textContent = 'צור קשר';
    contactBtn.className = 'primary-btn';
    contactBtn.onclick = () => {
      contactSeller(item);
    };
    content.appendChild(contactBtn);
    const detailsBtn = document.createElement('button');
    detailsBtn.textContent = 'פרטים';
    detailsBtn.className = 'secondary-btn';
    detailsBtn.onclick = () => {
      openListingModal(item);
    };
    content.appendChild(detailsBtn);
    card.appendChild(content);
    container.appendChild(card);
  });
}

// Handle selling form submission
function handleSellForm() {
  const form = document.getElementById('sellForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const categories = getData('categories', defaultCategories);
    // Build initial listing object
    const listing = {
      id: crypto.randomUUID(),
      categoryId: formData.get('category'),
      title: formData.get('title') || formData.get('make'),
      model: formData.get('model') || '',
      year: formData.get('year') || '',
      mileage: formData.get('mileage') ? parseInt(formData.get('mileage'), 10) : '',
      transmission: formData.get('transmission') || '',
      dualControl: formData.get('dualControl') === 'on',
      cameras: formData.get('cameras') || '',
      price: parseInt(formData.get('price'), 10) || 0,
      // store phone and email separately
      phone: formData.get('phone') || '',
      email: formData.get('email') || '',
      description: formData.get('description') || '',
      image: '',
      images: []
    };
    // Handle file upload: support multiple images. We'll read all selected files via FileReader and store as an array.
    // Select the file input by id. We intentionally access element directly to allow multiple selection even if HTML lacks the multiple attribute.
    const fileInput = form.querySelector('#image') || form.querySelector('#images') || null;
    const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
    // Helper to save listing and redirect
    const saveAndRedirect = () => {
      const listings = getData('listings', []);
      listings.push(listing);
      setData('listings', listings);
      alert('המודעה פורסמה בהצלחה!');
      form.reset();
      window.location.href = 'buy.html';
    };
    if (files && files.length > 0) {
      // Read all images
      const promises = files.map(f => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = evt => resolve(evt.target.result);
        reader.readAsDataURL(f);
      }));
      Promise.all(promises).then(imgs => {
        listing.images = imgs;
        listing.image = imgs[0];
        saveAndRedirect();
      });
    } else {
      // Fallback to default image for category
      const defImg = getDefaultImage(formData.get('category'), categories);
      listing.images = [defImg];
      listing.image = defImg;
      saveAndRedirect();
    }
  });
  // Toggle car-specific fields
  const categorySelect = form.querySelector('select[name="category"]');
  const vehicleFields = form.querySelectorAll('.vehicle-field');
  categorySelect.addEventListener('change', () => {
    const selectedCat = categorySelect.value;
    const categories = getData('categories', defaultCategories);
    const catObj = categories.find(c => c.id === selectedCat);
    if (catObj && catObj.name === 'רכב לימוד') {
      vehicleFields.forEach(f => f.style.display = 'block');
    } else {
      vehicleFields.forEach(f => f.style.display = 'none');
    }
  });
}

// Get default image for category
function getDefaultImage(catId, categories) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return 'car1.png';
  switch (cat.name) {
    case 'רכב לימוד':
      return 'car1.png';
    case 'מצלמות דרך':
      return 'camera_icon.png';
    case 'ביטוחים':
      return 'insurance3d.png';
    case 'אביזרים':
      return 'pedals_icon.png';
    case 'מבצעים':
      return 'gift.png';
    case 'ציוד ואיבזור':
      return 'camera3d.png';
    default:
      return 'car1.png';
  }
}

// Helper: get category ID by name
function getCategoryIdByName(name) {
  const categories = getData('categories', defaultCategories);
  const cat = categories.find(c => c.name === name);
  return cat ? cat.id : null;
}

// Handle signup form
function handleSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const user = {
      id: crypto.randomUUID(),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      password: formData.get('password'),
    };
    const users = getData('users', []);
    users.push(user);
    setData('users', users);
    alert('נרשמת בהצלחה!');
    form.reset();
  });
}

// Handle admin page
function renderAdmin() {
  const catTableBody = document.getElementById('categoryTableBody');
  const listingTableBody = document.getElementById('listingTableBody');
  const categories = getData('categories', defaultCategories);
  const listings = getData('listings', []);
  // Render categories with edit/delete actions
  if (catTableBody) {
    catTableBody.innerHTML = '';
    categories.forEach(cat => {
      const row = document.createElement('tr');
      // Name and description
      const nameCell = document.createElement('td');
      nameCell.textContent = cat.name;
      const descCell = document.createElement('td');
      descCell.textContent = cat.description;
      // Actions cell
      const actionsCell = document.createElement('td');
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = 'ערוך';
      editBtn.style.marginLeft = '0.5rem';
      editBtn.onclick = () => {
        const newName = prompt('שם קטגוריה חדש:', cat.name);
        if (newName) {
          cat.name = newName;
        }
        const newDesc = prompt('תיאור חדש:', cat.description || '');
        if (newDesc !== null) {
          cat.description = newDesc;
        }
        setData('categories', categories);
        renderAdmin();
      };
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'מחק';
      deleteBtn.onclick = () => {
        if (confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?')) {
          const cats = getData('categories', defaultCategories).filter(c => c.id !== cat.id);
          setData('categories', cats);
          renderAdmin();
        }
      };
      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(deleteBtn);
      // Append cells
      row.appendChild(nameCell);
      row.appendChild(descCell);
      row.appendChild(actionsCell);
      catTableBody.appendChild(row);
    });
  }
  // Render listings
  if (listingTableBody) {
    listingTableBody.innerHTML = '';
    listings.forEach(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      const row = document.createElement('tr');
      // title, category, price, status columns
      const titleCell = document.createElement('td');
      titleCell.textContent = item.title;
      const catCell = document.createElement('td');
      catCell.textContent = cat ? cat.name : '';
      const priceCell = document.createElement('td');
      priceCell.textContent = item.price + ' ₪';
      const statusCell = document.createElement('td');
      statusCell.textContent = item.status || 'פעיל';
      const actionsCell = document.createElement('td');
      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = 'מחק';
      delBtn.onclick = () => {
        if (confirm('האם אתה בטוח שברצונך למחוק מודעה זו?')) {
          const updated = getData('listings', []).filter(l => l.id !== item.id);
          setData('listings', updated);
          renderAdmin();
        }
      };
      // Edit button (pre-populate admin form)
      const editBtn = document.createElement('button');
      editBtn.textContent = 'ערוך';
      editBtn.style.marginLeft = '0.5rem';
      editBtn.onclick = () => {
        // Populate admin form with listing data
        const form = document.getElementById('adminSellForm');
        if (!form) return;
        form.querySelector('[name="category"]').value = item.categoryId;
        form.querySelector('[name="title"]').value = item.title;
        form.querySelector('[name="price"]').value = item.price;
        form.querySelector('[name="contact"]').value = item.contact;
        form.querySelector('[name="description"]').value = item.description || '';
        // Save editing id on form dataset
        form.dataset.editingId = item.id;
        window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
      };
      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(delBtn);
      // assemble row
      row.appendChild(titleCell);
      row.appendChild(catCell);
      row.appendChild(priceCell);
      row.appendChild(statusCell);
      row.appendChild(actionsCell);
      listingTableBody.appendChild(row);
    });
  }
  // Add category form
  const addCatForm = document.getElementById('addCategoryForm');
  if (addCatForm) {
    addCatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = addCatForm.querySelector('input[name="catName"]').value;
      const desc = addCatForm.querySelector('input[name="catDesc"]').value;
      if (!name) return;
      const cats = getData('categories', defaultCategories);
      cats.push({ id: crypto.randomUUID(), name, description: desc });
      setData('categories', cats);
      alert('הקטגוריה נוספה בהצלחה');
      // Re-render categories
      renderAdmin();
    });
  }

  // Populate admin category select and handle admin sell form
  const adminCategorySelect = document.getElementById('adminCategory');
  const adminSellForm = document.getElementById('adminSellForm');
  if (adminCategorySelect) {
    // Populate categories into admin select
    adminCategorySelect.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      adminCategorySelect.appendChild(opt);
    });
  }
  if (adminSellForm) {
    adminSellForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(adminSellForm);
      const editingId = adminSellForm.dataset.editingId || null;
      const listings = getData('listings', []);
      const file = formData.get('image');
      // helper to get image default or from file
      const processImage = (callback) => {
        if (file && file.size > 0) {
          const reader = new FileReader();
          reader.onload = evt => {
            callback(evt.target.result);
          };
          reader.readAsDataURL(file);
        } else {
          callback(getDefaultImage(formData.get('category'), categories));
        }
      };
      processImage((img) => {
        if (editingId) {
          // Editing existing listing
          const index = listings.findIndex(l => l.id === editingId);
          if (index !== -1) {
            listings[index] = {
              ...listings[index],
              categoryId: formData.get('category'),
              title: formData.get('title'),
              price: parseInt(formData.get('price'), 10) || 0,
              contact: formData.get('contact'),
              description: formData.get('description') || '',
              image: img
            };
          }
          adminSellForm.dataset.editingId = '';
          alert('המודעה עודכנה בהצלחה!');
        } else {
          // New listing
          const newListing = {
            id: crypto.randomUUID(),
            categoryId: formData.get('category'),
            title: formData.get('title'),
            price: parseInt(formData.get('price'), 10) || 0,
            contact: formData.get('contact'),
            description: formData.get('description') || '',
            image: img,
            status: 'פעיל'
          };
          listings.push(newListing);
          alert('המודעה נוספה בהצלחה!');
        }
        setData('listings', listings);
        adminSellForm.reset();
        renderAdmin();
      });
    });
  }
}

// Price estimation function for valuation page
function handleValuation() {
  const form = document.getElementById('valuationForm');
  const resultEl = document.getElementById('valuationResult');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const year = parseInt(formData.get('year'), 10);
    const mileage = parseInt(formData.get('mileage'), 10);
    let basePrice = 100000; // base price
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age > 0) {
      basePrice *= Math.pow(0.95, age); // 5% depreciation per year
    }
    if (mileage > 0) {
      basePrice *= Math.pow(0.99, mileage / 10000); // 1% depreciation per 10k km
    }
    basePrice = Math.max(basePrice, 10000);
      // Construct Yad2 search link based on make and model if provided
      const make = formData.get('make') || '';
      const model = formData.get('model') || '';
      const query = encodeURIComponent(`${make} ${model}`.trim());
      const yad2Link = query ? `https://www.yad2.co.il/vehicles?query=${query}` : 'https://www.yad2.co.il/vehicles';
      const estimated = Math.round(basePrice).toLocaleString();
      resultEl.innerHTML = `הערכת מחיר משוערת: ${estimated} ₪ (לפני מע״מ). <br><a href="${yad2Link}" target="_blank" style="color:#00a3e0; text-decoration:underline;">בדיקת מחירון נוספת באתר יד2</a>`;
  });
}

// On document load, run initializations based on page
document.addEventListener('DOMContentLoaded', () => {
  initData();
  // Ensure the image input supports multiple selection on the sell page
  const sellImgInput = document.getElementById('image');
  if (sellImgInput) {
    sellImgInput.setAttribute('multiple', 'true');
  }
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
    // Home page: nothing specific
  } else if (path.endsWith('buy.html')) {
    // Buy page
    // include admin-only categories in filter on buy page so users can view deals/insurance listings
    populateCategories('categoryFilter', true);
    // On buy page exclude categories that should not appear on the main marketplace
    renderListings('listingGrid', null, '', false);
    // Attach filter change
    const filterSelect = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
        renderListings('listingGrid', filterSelect.value || null, searchInput.value, false);
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderListings('listingGrid', filterSelect.value || null, searchInput.value, false);
      });
    }
  } else if (path.endsWith('sell.html')) {
    populateCategories('category');
    handleSellForm();
    // Set up price estimation on sell form
    const estimateLink = document.getElementById('estimatePriceLink');
    if (estimateLink) {
      estimateLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        // Require phone and email
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        if (!phoneInput.value || !emailInput.value) {
          alert('יש למלא טלפון ואימייל לפני בדיקת המחיר המשוער');
          return;
        }
        // Get year and mileage values
        const yearVal = parseInt(document.getElementById('year').value || '');
        const mileageVal = parseInt(document.getElementById('mileage').value || '');
        if (!yearVal || !mileageVal) {
          alert('אנא מלא את שנת היצור וקילומטראז׳ כדי לחשב מחיר משוער');
          return;
        }
        let basePrice = 100000;
        const currentYear = new Date().getFullYear();
        const age = currentYear - yearVal;
        if (age > 0) {
          basePrice *= Math.pow(0.95, age);
        }
        if (mileageVal > 0) {
          basePrice *= Math.pow(0.99, mileageVal / 10000);
        }
        basePrice = Math.max(basePrice, 10000);
        const estimated = Math.round(basePrice);
        // Update price input
        const priceInput = document.getElementById('price');
        if (priceInput) priceInput.value = estimated;
        alert(`המחיר המשוער (לפני מע"מ): ${estimated.toLocaleString()} ₪`);
      });
    }
  } else if (path.endsWith('signup.html')) {
    handleSignup();
  } else if (path.endsWith('admin.html')) {
    renderAdmin();
  } else if (path.endsWith('valuation.html')) {
    handleValuation();
  } else if (path.endsWith('deals.html')) {
    // Deals page: show listings only from deals category
    const id = getCategoryIdByName('מבצעים');
    renderListings('listingGrid', id);
  } else if (path.endsWith('insurance.html')) {
    // Insurance page: show listings only from insurance category
    const id = getCategoryIdByName('ביטוחים');
    renderListings('listingGrid', id);
  } else if (path.endsWith('equipment.html')) {
    // Equipment page: show listings only from equipment category
    const id = getCategoryIdByName('ציוד ואיבזור');
    renderListings('listingGrid', id);
  }
});

// Create and show modal with full listing information
function openListingModal(item) {
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('modalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }
  // Build modal content
  const content = document.createElement('div');
  content.className = 'modal-content';
  // Close button
  const closeBtn = document.createElement('span');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => closeModal();
  content.appendChild(closeBtn);
  // Title
  const title = document.createElement('h2');
  title.textContent = item.title;
  content.appendChild(title);
  // Gallery: show all images
  if (item.images && item.images.length > 0) {
    const gallery = document.createElement('div');
    gallery.className = 'modal-gallery';
    item.images.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = item.title;
      gallery.appendChild(img);
    });
    content.appendChild(gallery);
  } else if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.style.width = '100%';
    img.style.borderRadius = '8px';
    content.appendChild(img);
  }
  // Price and details
  const info = document.createElement('p');
  let infoText = '';
  if (item.price) infoText += `מחיר: ${item.price} ₪\n`;
  if (item.year) infoText += `שנה: ${item.year}\n`;
  if (item.mileage) infoText += `ק"מ: ${item.mileage.toLocaleString()}\n`;
  if (item.transmission) infoText += `גיר: ${item.transmission}\n`;
  if (item.dualControl) infoText += `דוושות ואמצעי בטיחות: כן\n`;
  if (item.cameras) infoText += `מצלמות: ${item.cameras}\n`;
  if (item.description) infoText += `תיאור: ${item.description}\n`;
  info.textContent = infoText;
  content.appendChild(info);
  // Contact options
  const contactDiv = document.createElement('div');
  contactDiv.className = 'contact-buttons';
  // Determine phone and email from listing
  const phone = item.phone || '';
  const email = item.email || '';
  // On desktop, display phone number text; on mobile show call button
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (phone) {
    if (isMobile) {
      const callLink = document.createElement('a');
      callLink.href = `tel:${phone}`;
      callLink.textContent = 'התקשר';
      callLink.className = 'contact-btn primary-btn';
      contactDiv.appendChild(callLink);
    } else {
      // on desktop show phone number as primary button (non-clickable)
      const phoneBtn = document.createElement('button');
      phoneBtn.textContent = phone;
      phoneBtn.className = 'primary-btn';
      phoneBtn.style.cursor = 'default';
      contactDiv.appendChild(phoneBtn);
    }
    // WhatsApp button (secondary)
    const waNum = phone.replace(/[^0-9]/g, '');
    const waLink = document.createElement('a');
    waLink.href = `https://wa.me/${waNum}`;
    waLink.target = '_blank';
    waLink.textContent = 'WhatsApp';
    waLink.className = 'contact-btn secondary-btn';
    contactDiv.appendChild(waLink);
    // SMS button (mobile only)
    if (isMobile) {
      const smsLink = document.createElement('a');
      smsLink.href = `sms:${phone}`;
      smsLink.textContent = 'שלח SMS';
      smsLink.className = 'contact-btn secondary-btn';
      contactDiv.appendChild(smsLink);
    }
  }
  if (email) {
    const emailLink = document.createElement('a');
    emailLink.href = `mailto:${email}?subject=מודעה%20בAlphaDrive&body=שלום,%20אני%20מעוניין/ת%20במודעתך.`;
    emailLink.textContent = 'מייל';
    emailLink.className = 'contact-btn secondary-btn';
    contactDiv.appendChild(emailLink);
  }
  content.appendChild(contactDiv);
  // Append content to overlay
  overlay.innerHTML = '';
  overlay.appendChild(content);
  overlay.style.display = 'flex';
}

// Hide the modal overlay
function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Handle contact button: on mobile open dialer, on desktop show phone and email
function contactSeller(item) {
  const phone = item.phone || '';
  const email = item.email || '';
  // Determine if on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!phone && !email) {
    alert('לא ניתן ליצור קשר - אין פרטי התקשרות זמינים');
    return;
  }
  if (isMobile && phone) {
    // On mobile, open dialer
    window.location.href = `tel:${phone}`;
  } else {
    // On desktop, show phone and email in alert
    let msg = '';
    if (phone) msg += `טלפון: ${phone}\n`;
    if (email) msg += `אימייל: ${email}`;
    alert(msg);
  }
}