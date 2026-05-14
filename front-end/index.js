// const API     = 'https://back-java-latest-1.onrender.com/api/flights';  // Java 
// const PHP_API = 'https://back-php-latest.onrender.com/api/orders';      // PHP 

const API     = 'http://localhost:8080/api/flights';  // Local java
const PHP_API = 'http://localhost:8000/api/orders';   // Local PHP

// ===== Global huvisagchid =====
let allFlights    = [];                                                         // Java-s tatsan nisleguud 
let myTickets     = JSON.parse(localStorage.getItem('skymnTickets') || '[]');   // Browser-t hadgalsn tickets 
let pendingTicket = null;                                                        // Confirmation zahialga

// ===== Tab solih =====
function switchTab(name) {
  const tabNames = ['flights', 'booking', 'confirm', 'tickets'];

  // Active tab temdegleh
  document.querySelectorAll('.tab').forEach((tab, i) => {
    tab.classList.toggle('active', tabNames[i] === name);
  });

  // Buh panel nuuh
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });

  document.getElementById('panel-' + name).classList.add('active');

  // Tickets tab neeh ued DB-s tatah
  if (name === 'tickets') renderTickets();
}

// ===== Medegdel haruulah =====
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');

  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';

  // 3 secondiin daraa alga bolno
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== Java serveriin tuluv shalgah =====
async function checkJavaStatus() {
  try {
    const res = await fetch(API);

    if (res.ok) {
      document.getElementById('javaDot').className    = 'dot';  // Nogoon dot = ajillaj baina
      document.getElementById('javaText').textContent = 'Java ✓';

    } else {
      throw new Error();
    }
  } catch {
    document.getElementById('javaDot').className    = 'dot offline';  // Ulaan dot = offline
    document.getElementById('javaText').textContent = 'Java ✗';
  }
}

// ===== PHP serveriin tuluv shalgah =====
async function checkPHPstatus() {
  try {
    const res = await fetch(PHP_API);

    if (res.ok) {
      document.getElementById('phpDot').className    = 'dot';  // Nogoon dot = ajillaj baina
      document.getElementById('phpText').textContent = 'PHP ✓';

    } else {
      throw new Error();
    }
  } catch {

    // Ulaan dot = offline
    document.getElementById('phpDot').className    = 'dot offline';
    document.getElementById('phpText').textContent = 'PHP ✗';
  }
}

// ===== Nisleguud tatah =====
async function loadFlights() {

  // Loading spinner haruulah
  document.getElementById('flightsContainer').innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>Нислэгийн мэдээлэл татаж байна...</div>
    </div>`;

  try {

    // Java server ruu GET huselt yavuulah
    const res = await fetch(API);

    if (!res.ok) throw new Error('Serveriin aldaa');
    // JSON hariu hadgalah
    allFlights = await res.json();

    // Java online status
    document.getElementById('javaDot').className    = 'dot';
    document.getElementById('javaText').textContent = 'Java ✓';

    renderFlights(allFlights);
    populateBookingSelect(allFlights);

  } catch {

    // Java offline
    document.getElementById('javaDot').className    = 'dot offline';
    document.getElementById('javaText').textContent = 'Java ✗';

    document.getElementById('flightsContainer').innerHTML = `
      <div class="empty">
        ⚠️ Java сервер ажиллахгүй байна<br>
        <small style="margin-top:8px; display:block;">
          mvn spring-boot:run гэж ажиллуулна уу
        </small>
      </div>`;
  }
}

// ===== Nisleguud haruulah =====
function renderFlights(flights) {

  // Nisleg oldohgui bol
  if (!flights.length) {
    document.getElementById('flightsContainer').innerHTML =
      '<div class="empty">Нислэг олдсонгүй</div>';
    return;
  }

  // Card uusgeh
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

        ${f.availableSeats === 0
          ? '<div class="no-seat-badge">Дүүрсэн</div>'
          : ''}
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

// ===== Nisleg haih =====
function filterFlights() {

  // Search utga авах
  const query = document.getElementById('searchInput').value.toLowerCase();

  // Destination esvel flight number-aar shuuh
  const filtered = allFlights.filter(f =>
    f.destination.toLowerCase().includes(query) ||
    f.flightNumber.toLowerCase().includes(query)
  );

  renderFlights(filtered);
}

// ===== Nislegiin hugatsaa tootsooloh =====
function calcDuration(dep, arr) {

  const [dh, dm] = dep.split(':').map(Number);
  let   [ah, am] = arr.split(':').map(Number);

  // Daraa udriin nisleg bol 24 tsag nemne
  if (ah < dh) ah += 24;
  const totalMins = (ah * 60 + am) - (dh * 60 + dm);

  return Math.floor(totalMins / 60) + 'ц ' + (totalMins % 60) + 'м';
}

// ===== Booking dropdown duureh =====
function populateBookingSelect(flights) {

  const sel = document.getElementById('bookFlight');

  sel.innerHTML = '<option value="">— Нислэг сонгоно уу —</option>';

  // Zuvhun suudaltai nisleg haruulah
  flights
    .filter(f => f.availableSeats > 0)
    .forEach(f => {

      sel.innerHTML += `
        <option value="${f.flightNumber}">
          ${f.flightNumber} — ${f.origin} → ${f.destination}
        </option>`;
    });
}

// ===== Quick booking =====
function quickBook(flightNum) {
  // Booking tab ruu shiljuuleh
  switchTab('booking');
  document.getElementById('bookFlight').value = flightNum;
}

// ===== Zahialga ilgeeh =====
async function submitBooking() {

  // Formiin utguud авах
  const flightNum = document.getElementById('bookFlight').value;
  const name      = document.getElementById('passengerName').value.trim();
  const passport  = document.getElementById('passportNum').value.trim();
  const seatClass = document.getElementById('seatClass').value;

  // Hoolson talbar shalgah
  if (!flightNum || !name || !passport) {
    showToast('Бүх талбарыг бөглөнө үү!', 'error');
    return;
  }

  // Songoson nisleg oloh
  const flight = allFlights.find(f => f.flightNumber === flightNum);

  // Une tootsooloh
  let price = flight?.price || 0;

  if (seatClass === 'Business') price += 50;
  if (seatClass === 'First')    price += 100;

  // Pending ticket hadgalah
  pendingTicket = {
    id:            Date.now(),
    flightNumber:  flightNum,
    origin:        flight?.origin        || '',
    destination:   flight?.destination   || '',
    departureTime: flight?.departureTime || '',
    arrivalTime:   flight?.arrivalTime   || '',
    price:         price,
    passengerName: name,
    passport:      passport,
    seatClass:     seatClass,
    bookedAt:      new Date().toLocaleDateString('mn-MN')
  };

  // Confirmation page ruu shiljuuleh
  renderConfirmation(pendingTicket);
  switchTab('confirm');
}

// ===== Confirmation medeelleer duureh =====
function renderConfirmation(ticket) {
  document.getElementById('confirm-route').textContent    =  ticket.origin + ' → ' + ticket.destination;
  document.getElementById('confirm-flight').textContent   =  ticket.flightNumber;
  document.getElementById('confirm-time').textContent     =  ticket.departureTime + ' → ' + ticket.arrivalTime;
  document.getElementById('confirm-name').textContent     =  ticket.passengerName;
  document.getElementById('confirm-passport').textContent =  ticket.passport;
  document.getElementById('confirm-class').textContent    =  ticket.seatClass;
  document.getElementById('confirm-price').textContent    =  '$' + ticket.price;
}

// ===== Tulbur tuluh =====
async function confirmPayment() 
{
  if (!pendingTicket) return;
  try {
    // Java deer suudal hasah
    const javaRes = await fetch(
      `${API}/${pendingTicket.flightNumber}/book`,
      { method: 'POST' }
    );

    const javaData = await javaRes.json();

    // Java aldaa gargaval zogsoh
    if (!javaRes.ok) {
      showToast('❌ ' + javaData.message, 'error');
      return;
    }
    // PHP deer zahialga hadgalah
    const phpRes = await fetch(PHP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({
        flightNumber:  pendingTicket.flightNumber,
        passengerName: pendingTicket.passengerName,
        passport:      pendingTicket.passport,
        seatClass:     pendingTicket.seatClass,
        price:         pendingTicket.price
      })
    });
    // PHP offline bol warning
    if (!phpRes.ok) {
      console.warn('PHP hadgalahad aldaa garlaa');
      document.getElementById('phpDot').className    = 'dot offline';
      document.getElementById('phpText').textContent = 'PHP ✗';
    } else {

      document.getElementById('phpDot').className    = 'dot';
      document.getElementById('phpText').textContent = 'PHP ✓';
    }

    updateTicketCount();
    // Form tseverleh
    document.getElementById('passengerName').value = '';
    document.getElementById('passportNum').value   = '';
    document.getElementById('bookFlight').value    = '';

    pendingTicket = null;
    // UI shinechleh
    loadFlights();
    showToast('✅ Төлбөр амжилттай төлөгдлөө!');
    setTimeout(() => switchTab('tickets'), 1000);

  } catch {

    showToast(
      '❌ PHP сервертэй холбогдож чадсангүй',
      'error'
    );
  }
}

// ===== Ticketuudiig haruulah =====
async function renderTickets() {

  // Loading spinner
  document.getElementById('ticketsContainer').innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>Захиалгууд татаж байна...</div>
    </div>`;

  try {
    // PHP-s zahialga tatah
    const res     = await fetch(PHP_API);
    const tickets = await res.json();
    // Zahialga baihgui bol
    if (!tickets.length) {
      document.getElementById('ticketsContainer').innerHTML =
        '<div class="empty">🎫 Одоогоор захиалга байхгүй байна</div>';
      return;
    }

    // Ticket card uusgeh
    const cards = tickets.map(t => `
      <div class="ticket-card">

        <div>
          <div class="ticket-route">${t.flight_number}</div>
          <div class="ticket-meta">
            ${t.flight_number} · ${t.seat_class} · ${t.passenger_name}
          </div>
          <div class="ticket-meta" style="margin-top:2px;">
            Захиалсан: ${t.created_at}
          </div>
        </div>

        <div style="text-align:right;">

          <div class="ticket-price">$${t.price}</div>
          <div class="ticket-badge">${t.status}</div>
          <button
            class="btn btn-danger"
            style="margin-top:8px;"
            onclick="deleteTicket(${t.id})">
            Цуцлах
          </button>
        </div>
      </div>
    `).join('');

    document.getElementById('ticketsContainer').innerHTML =
      `<div class="tickets-grid">${cards}</div>`;

  } catch {

    document.getElementById('ticketsContainer').innerHTML =
      '<div class="empty">⚠️ Захиалга татахад алдаа гарлаа</div>';
  }
}

// ===== Zahialga tsutslah =====
async function deleteTicket(id) {

  // Confirmation asuuh
  if (!confirm('Захиалгыг цуцлах уу?')) return;

  try {

    // DELETE huselt yavuulah
    await fetch(`${PHP_API}/${id}`, {
      method: 'DELETE'
    });

    showToast('✅ Захиалга цуцлагдлаа');
    // Jagsaalt shinechleh
    updateTicketCount();
    renderTickets();

  } catch {

    showToast('❌ Цуцлахад алдаа гарлаа', 'error');
  }
}

// ===== Ticket too badge =====
async function updateTicketCount() {

  try {

    const res = await fetch(PHP_API);
    const tickets = await res.json();

    const badge = document.getElementById('ticketCount');

    if (tickets.length > 0) {

      badge.style.display = 'inline';
      badge.textContent = tickets.length;

    } else {

      badge.style.display = 'none';
    }

  } catch {

    console.log('Ticket count update error');
  }
}

// ===== Ehluuleh =====
loadFlights();       // Nisleg tatah
checkPHPstatus();    // PHP status shalgah
updateTicketCount(); // Ticket too haruulah

// 30 second tutamd server shalgah
setInterval(() => {

  checkJavaStatus();
  checkPHPstatus();

}, 30000);