const API = 'http://localhost:8080/api/flights';

let allFlights = [];
let myTickets  = JSON.parse(localStorage.getItem('skymnTickets') || '[]');

// ===== TAB SWITCH =====
function switchTab(name) {
  const tabNames = ['flights', 'booking', 'confirm',  'tickets'  ];

  document.querySelectorAll('.tab').forEach((tab, i) => {
    tab.classList.toggle('active', tabNames[i] === name);
  });

  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });

  document.getElementById('panel-' + name).classList.add('active');

  if (name === 'tickets') renderTickets();
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== LOAD FLIGHTS FROM JAVA =====
async function loadFlights() {
  document.getElementById('flightsContainer').innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>Нислэгийн мэдээлэл татаж байна...</div>
    </div>`;

  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Server error');

    allFlights = await res.json();

    document.getElementById('statusDot').className  = 'dot';
    document.getElementById('statusText').textContent = 'Java сервер холбогдсон';

    renderFlights(allFlights);
    populateBookingSelect(allFlights);

  } catch {
    document.getElementById('statusDot').className  = 'dot offline';
    document.getElementById('statusText').textContent = 'Сервер холбогдохгүй байна';

    document.getElementById('flightsContainer').innerHTML = `
      <div class="empty">
        ⚠️ Java сервер ажиллахгүй байна<br>
        <small style="margin-top:8px; display:block;">
          mvn spring-boot:run гэж ажиллуулна уу
        </small>
      </div>`;
  }
}

// ===== RENDER FLIGHTS =====
function renderFlights(flights) {
  if (!flights.length) {
    document.getElementById('flightsContainer').innerHTML =
      '<div class="empty">Нислэг олдсонгүй</div>';
    return;
  }

  const cards = flights.map(f => `
    <div class="flight-card">
      <div>
        <div class="flight-num">${f.flightNumber}</div>
        <div class="city">${f.origin}</div>
        <div class="time">${f.departureTime}</div>
      </div>

      <div class="route-arrow">
        <div class="arrow-line"></div>
        <span style="font-size:11px; color:var(--muted);">
          ${calcDuration(f.departureTime, f.arrivalTime)}
        </span>
      </div>

      <div>
        <div class="city">${f.destination}</div>
        <div class="time">${f.arrivalTime}</div>
      </div>

      <div class="price-block">
        <div class="price">$${f.price}</div>
        <div class="seats ${f.availableSeats > 0 && f.availableSeats <= 10 ? 'low' : ''}">
          ${f.availableSeats > 0 ? f.availableSeats + ' суудал үлдсэн' : ''}
        </div>
        ${f.availableSeats === 0 ? '<div class="no-seat-badge">Дүүрсэн</div>' : ''}
      </div>

      <div>
        <button
          class="btn-book"
          ${f.availableSeats === 0 ? 'disabled' : ''}
          onclick="quickBook('${f.flightNumber}')">
          Захиалах
        </button>
      </div>
    </div>
  `).join('');

  document.getElementById('flightsContainer').innerHTML =
    `<div class="flights-grid">${cards}</div>`;
}

// ===== FILTER FLIGHTS =====
function filterFlights() {
  const query    = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allFlights.filter(f =>
    f.destination.toLowerCase().includes(query) ||
    f.flightNumber.toLowerCase().includes(query)
  );
  renderFlights(filtered);
}

// ===== CALC DURATION =====
function calcDuration(dep, arr) {
  const [dh, dm] = dep.split(':').map(Number);
  let   [ah, am] = arr.split(':').map(Number);
  if (ah < dh) ah += 24;
  const totalMins = (ah * 60 + am) - (dh * 60 + dm);
  return Math.floor(totalMins / 60) + 'ц ' + (totalMins % 60) + 'м';
}

// ===== POPULATE BOOKING SELECT =====
function populateBookingSelect(flights) {
  const sel = document.getElementById('bookFlight');
  sel.innerHTML = '<option value="">— Нислэг сонгоно уу —</option>';

  flights
    .filter(f => f.availableSeats > 0)
    .forEach(f => {
      sel.innerHTML += `
        <option value="${f.flightNumber}">
          ${f.flightNumber} — ${f.origin} → ${f.destination}
        </option>`;
    });
}

// ===== QUICK BOOK FROM FLIGHT CARD =====
function quickBook(flightNum) {
  switchTab('booking');
  document.getElementById('bookFlight').value = flightNum;
}

// ===== SUBMIT BOOKING =====
async function submitBooking() {
  const flightNum  = document.getElementById('bookFlight').value;
  const name       = document.getElementById('passengerName').value.trim();
  const passport   = document.getElementById('passportNum').value.trim();
  const seatClass  = document.getElementById('seatClass').value;

  if (!flightNum || !name || !passport) {
    showToast('Бүх талбарыг бөглөнө үү!', 'error');
    return;
  }

  try {
    const res  = await fetch(`${API}/${flightNum}/book`, { method: 'POST' });
    const data = await res.json();

    if (res.ok) 
    {

        const flight = allFlights.find(f => f.flightNumber === flightNum);

        let price = flight?.price || 0;

        if (seatClass === "Business") price += 50;
        if (seatClass === "First") price += 100;

        const ticket = {
            id:            Date.now(),
            flightNumber:  flightNum,
            origin:        flight?.origin        || '',
            destination:   flight?.destination   || '',
            departureTime: flight?.departureTime || '',
            price:         price ,
            passengerName: name,
            passport:      passport,
            seatClass:     seatClass,
            bookedAt:      new Date().toLocaleDateString('mn-MN')
        };

     

        document.getElementById("pricePreview").textContent = price + " $";

        myTickets.push(ticket);
        localStorage.setItem('skymnTickets', JSON.stringify(myTickets));
        updateTicketCount();

        showToast('✅ ' + data.message);

        // Form цэвэрлэх
        document.getElementById('passengerName').value = '';
        document.getElementById('passportNum').value   = '';
        document.getElementById('bookFlight').value    = '';
        

        loadFlights();
        setTimeout(() => switchTab('tickets'), 1500);

        } else {
        showToast('❌ ' + data.message, 'error');
        }

    } catch {
        showToast('❌ Сервертэй холбогдож чадсангүй', 'error');
    }
}

// ===== RENDER TICKETS =====
function renderTickets() {
  if (!myTickets.length) {
    document.getElementById('ticketsContainer').innerHTML =
      '<div class="empty">🎫 Одоогоор захиалга байхгүй байна</div>';
    return;
  }

  const cards = myTickets.map(t => `
    <div class="ticket-card">
      <div>
        <div class="ticket-route">${t.origin} → ${t.destination}</div>
        <div class="ticket-meta">
          ${t.flightNumber} · ${t.departureTime} · ${t.seatClass} · ${t.passengerName}
        </div>
        <div class="ticket-meta" style="margin-top:2px;">
          Захиалсан: ${t.bookedAt}
        </div>
      </div>
      <div style="text-align:right;">
        <div class="ticket-price">$${t.price}</div>
        <div class="ticket-badge">Баталгаажсан</div>
      </div>
    </div>
  `).join('');

  document.getElementById('ticketsContainer').innerHTML = `
    <div class="tickets-grid">${cards}</div>
    <button class="btn btn-danger" onclick="clearTickets()">
      Бүгдийг устгах
    </button>`;
}

// ===== CLEAR TICKETS =====
function clearTickets() {
  myTickets = [];
  localStorage.removeItem('skymnTickets');
  updateTicketCount();
  renderTickets();
}

// ===== TICKET COUNT BADGE =====
function updateTicketCount() {
  const badge = document.getElementById('ticketCount');
  if (myTickets.length > 0) {
    badge.style.display  = 'inline';
    badge.textContent    = myTickets.length;
  } else {
    badge.style.display  = 'none';
  }
}

// ===== INIT =====
loadFlights();
updateTicketCount();