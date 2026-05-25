// TODO: Replace placeholders with the actual configurations from your Firebase Web Console app dashboard.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase App globally using compat syntax
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const pgContainer = document.getElementById('pgContainer');
const ownerPgSelect = document.getElementById('ownerPgSelect');

// 1. REAL-TIME EVENT LISTENER: Fetch items instantly when database values change
db.collection("pg_listings").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    pgContainer.innerHTML = "";
    ownerPgSelect.innerHTML = "";

    if (snapshot.empty) {
        pgContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center py-8">No PGs listed yet. Be the first to suggest one!</p>`;
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;

        // Populate the dropdown element within the Owner form panel
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${data.title} (${data.address.substring(0, 25)}...)`;
        ownerPgSelect.appendChild(option);

        // Render card layout
        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col justify-between transition hover:shadow-md";
        
        const isVerified = data.isVerifiedByOwner;
        // Conditional: If room photo isn't supplied by owner, fallback to user building exterior photo
        const activePhoto = isVerified ? data.roomPhoto : data.coverPhoto;

        card.innerHTML = `
            <div>
                <div class="relative h-48 bg-gray-100">
                    <img src="${activePhoto}" class="w-full h-full object-cover" alt="PG Image">
                    <span class="absolute top-3 left-3 ${isVerified ? 'bg-emerald-600' : 'bg-amber-600'} text-white text-[11px] font-bold px-2 py-1 rounded shadow-sm">
                        <i class="fa-solid ${isVerified ? 'fa-circle-check' : 'fa-hourglass-start'} mr-1"></i> 
                        ${isVerified ? 'Owner Room Verified' : 'Awaiting Room Photos'}
                    </span>
                </div>
                <div class="p-5">
                    <h3 class="font-bold text-lg text-gray-900 mb-1">${data.title}</h3>
                    <p class="text-gray-500 text-xs flex items-start gap-1 mb-4">
                        <i class="fa-solid fa-location-dot text-gray-400 mt-0.5"></i> ${data.address}
                    </p>
                    ${!isVerified ? `
                        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-[11px] flex items-start gap-1.5">
                            <i class="fa-solid fa-circle-info mt-0.5"></i>
                            <p>Address submitted by community. Interior layout photos will appear when verified by the owner.</p>
                        </div>
                    ` : `
                        <span class="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                            <i class="fa-solid fa-bed mr-1"></i> Room Details Attached
                        </span>
                    `}
                </div>
            </div>
            <div class="px-5 pb-5 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div>
                    <span class="text-xl font-extrabold text-gray-900">${isVerified ? '₹' + data.price : 'Rent Locked'}</span>
                    ${isVerified ? '<span class="text-gray-400 text-xs font-normal">/mo</span>' : ''}
                </div>
                <button class="text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${isVerified ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}">
                    ${isVerified ? 'Contact Owner' : 'View Address'}
                </button>
            </div>
        `;
        pgContainer.appendChild(card);
    });
}, (error) => {
    console.error("Snapshot error listener active: ", error);
});

// 2. FORM ACTION: Public User can post basic entries
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    db.collection("pg_listings").add({
        title: document.getElementById('userPgName').value,
        address: document.getElementById('userPgAddress').value,
        coverPhoto: document.getElementById('userPgImage').value,
        roomPhoto: "", // Forced blank: Restricted for general users
        price: null,   // Forced blank
        isVerifiedByOwner: false,
        createdAt: new Date()
    })
    .then(() => {
        alert("Success! Entry added. Awaiting owner internal photos updates.");
        document.getElementById('userForm').reset();
        document.getElementById('userModal').classList.add('hidden');
    })
    .catch((err) => {
        alert("Submission block mismatch. Ensure rules configurations are synced.");
        console.error(err);
    });
});

// 3. FORM ACTION: Verified Owners can update price variables and append interior pictures
document.getElementById('ownerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const selectedId = ownerPgSelect.value;
    if(!selectedId) return alert("No active item selected.");

    db.collection("pg_listings").doc(selectedId).update({
        price: document.getElementById('ownerPrice').value,
        roomPhoto: document.getElementById('ownerRoomImage').value, // Sets interior view pictures safely
        isVerifiedByOwner: true
    })
    .then(() => {
        alert("Listing updated with room specifications!");
        document.getElementById('ownerForm').reset();
        document.getElementById('ownerModal').classList.add('hidden');
    })
    .catch((err) => {
        alert("Operation blocked. Database verification check rejected inputs.");
        console.error(err);
    });
});